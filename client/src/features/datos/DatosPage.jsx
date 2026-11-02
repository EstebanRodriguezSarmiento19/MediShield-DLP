import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, LinearProgress, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import api from '../../shared/services/api.js';

const COLOR = { PERMITIR: '#0E9F6E', ALERTAR: '#D97706', BLOQUEAR: '#E11D48', linea: '#0891B2', pronostico: '#7C3AED', banda: '#7C3AED' };
const DIAS = [30, 60, 90, 180];
const fecha = value => value ? value.slice(5).split('-').reverse().join('/') : '';

function Panel({ title, subtitle, children, sx }) {
  return (
    <Paper variant="outlined" sx={{ p: 3, ...sx }}>
      <Typography variant="h2">{title}</Typography>
      {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{subtitle}</Typography>}
      {children}
    </Paper>
  );
}

function Kpi({ label, value, hint, color }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderTop: 4, borderTopColor: color }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography sx={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.2, color }}>{value}</Typography>
      <Typography variant="body2" color="text.secondary">{hint}</Typography>
    </Paper>
  );
}

function Donut({ items }) {
  const total = items.reduce((sum, item) => sum + item.total, 0);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <Stack direction="row" spacing={3} alignItems="center" justifyContent="center" flexWrap="wrap">
      <svg viewBox="0 0 160 160" width={160} height={160} role="img" aria-label="Distribución de decisiones">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="18" />
        {total > 0 && items.map(item => {
          const length = (item.total / total) * circumference;
          const segment = (
            <circle key={item.decision} cx="80" cy="80" r={radius} fill="none" stroke={COLOR[item.decision]}
              strokeWidth="18" strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offset} transform="rotate(-90 80 80)" />
          );
          offset += length;
          return segment;
        })}
        <text x="80" y="78" textAnchor="middle" fontSize="22" fontWeight="800" fill="currentColor">{total}</text>
        <text x="80" y="96" textAnchor="middle" fontSize="10" fill="currentColor">analizadas</text>
      </svg>
      <Stack spacing={1}>
        {items.map(item => (
          <Stack key={item.decision} direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: COLOR[item.decision] }} />
            <Typography variant="body2">{item.etiqueta}: <b>{item.total}</b> ({item.porcentaje}%)</Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

function RiskColumns({ items }) {
  const W = 520, H = 220, P = { l: 16, r: 16, t: 24, b: 40 };
  const max = Math.max(1, ...items.map(i => i.total));
  const slot = (W - P.l - P.r) / items.length;
  const barWidth = slot * 0.6;
  const tone = i => (i < 2 ? COLOR.PERMITIR : i < 3 ? COLOR.ALERTAR : COLOR.BLOQUEAR);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Distribución por riesgo">
      <line x1={P.l} x2={W - P.r} y1={H - P.b} y2={H - P.b} stroke="#D1D5DB" />
      {items.map((item, i) => {
        const height = (item.total / max) * (H - P.t - P.b);
        const x = P.l + i * slot + (slot - barWidth) / 2;
        const y = H - P.b - height;
        return (
          <g key={item.etiqueta}>
            <rect x={x} y={y} width={barWidth} height={height} rx="4" fill={tone(i)} />
            <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="12" fontWeight="700" fill="currentColor">{item.total}</text>
            <text x={x + barWidth / 2} y={H - P.b + 16} textAnchor="middle" fontSize="11" fill="currentColor">{item.etiqueta}</text>
          </g>
        );
      })}
    </svg>
  );
}

function HorizontalBars({ rows, empty }) {
  if (!rows.length) return <Typography color="text.secondary">{empty}</Typography>;
  const max = Math.max(1, ...rows.map(r => r.value));
  return (
    <Stack spacing={1.5}>
      {rows.map(row => (
        <Box key={row.label}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography variant="body2" sx={{ overflowWrap: 'anywhere', pr: 1 }}>{row.label}</Typography>
            <Typography variant="body2" fontWeight={700}>{row.value}{row.suffix ?? ''}</Typography>
          </Stack>
          <LinearProgress variant="determinate" value={(row.value / max) * 100}
            sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: row.color ?? COLOR.linea } }} />
        </Box>
      ))}
    </Stack>
  );
}

/** Serie real (línea sólida), pronóstico (línea discontinua) y banda de confianza del 95 %. */
function SeriesChart({ history, forecast, yMax, unit }) {
  const W = 640, H = 240, P = { l: 48, r: 16, t: 16, b: 32 };
  const h0 = history.length;
  const n = h0 + forecast.length;
  const values = [...history.map(p => p.value).filter(v => v !== null), ...forecast.flatMap(f => [f.inferior, f.superior])];
  const top = yMax ?? Math.max(1, Math.ceil(Math.max(...values) * 1.15));
  const x = i => P.l + (n <= 1 ? 0 : (i * (W - P.l - P.r)) / (n - 1));
  const y = v => P.t + (H - P.t - P.b) * (1 - v / top);

  const toPath = points => points.reduce((d, p, i) => {
    if (!p) return d;
    const previous = points[i - 1];
    return d + (previous ? ` L${p.x},${p.y}` : ` M${p.x},${p.y}`);
  }, '');

  const historyPoints = history.map((p, i) => (p.value === null ? null : { x: x(i), y: y(p.value) }));
  let lastValid = null;
  for (let i = h0 - 1; i >= 0; i--) if (history[i].value !== null) { lastValid = { x: x(i), y: y(history[i].value) }; break; }
  const forecastPoints = lastValid ? [lastValid, ...forecast.map((f, k) => ({ x: x(h0 + k), y: y(f.valor) }))] : [];

  const band = forecast.length
    ? [...forecast.map((f, k) => `${x(h0 + k)},${y(f.superior)}`), ...forecast.map((f, k) => `${x(h0 + forecast.length - 1 - k)},${y(forecast[forecast.length - 1 - k].inferior)}`)].join(' ')
    : '';
  const ticks = [0, top / 2, top];
  const labelDates = [history[0]?.fecha, history[h0 - 1]?.fecha, forecast[forecast.length - 1]?.fecha].filter(Boolean);
  const labelX = [x(0), x(h0 - 1), x(n - 1)];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Serie de tiempo con pronóstico">
      {ticks.map(t => (
        <g key={t}>
          <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke="#E5E7EB" />
          <text x={P.l - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="currentColor">{Math.round(t * 10) / 10}{unit}</text>
        </g>
      ))}
      {forecast.length > 0 && <line x1={x(h0 - 0.5)} x2={x(h0 - 0.5)} y1={P.t} y2={H - P.b} stroke="#9CA3AF" strokeDasharray="4 4" />}
      {band && <polygon points={band} fill={COLOR.banda} opacity="0.15" />}
      <path d={toPath(historyPoints)} fill="none" stroke={COLOR.linea} strokeWidth="2.5" />
      <path d={toPath(forecastPoints)} fill="none" stroke={COLOR.pronostico} strokeWidth="2.5" strokeDasharray="6 5" />
      {labelDates.map((d, i) => (
        <text key={d + i} x={labelX[i]} y={H - 8} textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'} fontSize="11" fill="currentColor">{fecha(d)}</text>
      ))}
    </svg>
  );
}

export default function DatosPage() {
  const [data, setData] = useState(null);
  const [dias, setDias] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api.get(`/datos/resumen?dias=${dias}&horizonte=7`)
      .then(response => setData(response.data))
      .catch(requestError => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [dias]);

  useEffect(() => { load(); }, [load]);

  if (!data && !error) return <Typography color="text.secondary">Cargando datos…</Typography>;

  const { kpis, decisiones, bandasRiesgo, destinatariosCriticos, reglas, serie, pronostico } = data ?? {};
  const countForecast = pronostico?.transferencias;
  const riskForecast = pronostico?.riesgoPromedio;
  const riskHistory = serie?.map(p => ({ fecha: p.fecha, value: p.riesgoPromedio })) ?? [];
  const countHistory = serie?.map(p => ({ fecha: p.fecha, value: p.transferencias })) ?? [];

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="h1">Datos</Typography>
          <Typography color="text.secondary">
            Análisis descriptivo de las transferencias y pronóstico de su serie de tiempo.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField select size="small" label="Periodo" value={dias} onChange={e => setDias(Number(e.target.value))} sx={{ minWidth: 140 }}>
            {DIAS.map(d => <MenuItem key={d} value={d}>Últimos {d} días</MenuItem>)}
          </TextField>
          <Button startIcon={<Refresh />} onClick={load} disabled={loading}>Actualizar</Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {data && (
        <>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' } }}>
            <Kpi label="Analizadas" value={kpis.total} hint={`${kpis.enviadas} enviadas`} color="#0F172A" />
            <Kpi label="Permitidas" value={kpis.permitidas} hint={`${kpis.porcentajePermitidas}%`} color={COLOR.PERMITIR} />
            <Kpi label="En alerta" value={kpis.alertas} hint={`${kpis.porcentajeAlertas}%`} color={COLOR.ALERTAR} />
            <Kpi label="Bloqueadas" value={kpis.bloqueadas} hint={`${kpis.porcentajeBloqueadas}%`} color={COLOR.BLOQUEAR} />
          </Box>

          <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
            <Panel title="Decisiones del motor" subtitle="Proporción de transferencias por decisión.">
              <Donut items={decisiones} />
            </Panel>
            <Panel title="Distribución por riesgo" subtitle="Número de transferencias en cada tramo de puntaje.">
              <RiskColumns items={bandasRiesgo} />
            </Panel>
            <Panel title="Destinatarios críticos" subtitle="Pico de riesgo registrado por destinatario.">
              <HorizontalBars
                empty="Aún no hay transferencias en el periodo."
                rows={destinatariosCriticos.map(d => ({ label: d.destinatario, value: d.riesgoMaximo, color: d.riesgoMaximo >= 70 ? COLOR.BLOQUEAR : COLOR.ALERTAR }))}
              />
            </Panel>
            <Panel title="Reglas más activadas" subtitle="Ocurrencias de cada regla DLP en el periodo.">
              <HorizontalBars
                empty="No se activaron reglas en el periodo."
                rows={reglas.map(r => ({ label: r.nombre, value: r.ocurrencias, color: COLOR.linea }))}
              />
            </Panel>
          </Box>

          <Panel title="Serie de tiempo: transferencias por día" subtitle="Línea continua: observado. Línea discontinua: pronóstico a 7 días con banda del 95 %.">
            {countForecast
              ? <SeriesChart history={countHistory} forecast={countForecast.pronostico} unit="" />
              : <Alert severity="info">Se necesitan al menos 4 días con datos para generar el pronóstico.</Alert>}
          </Panel>

          <Panel title="Serie de tiempo: riesgo promedio por día" subtitle="Promedio diario del puntaje de riesgo. Los días sin transferencias quedan sin punto.">
            {riskForecast
              ? <SeriesChart history={riskHistory} forecast={riskForecast.pronostico} yMax={100} unit="" />
              : <Alert severity="info">Se necesitan al menos 4 días con datos para generar el pronóstico.</Alert>}
          </Panel>

          {countForecast && (
            <Panel title="Inferencia" subtitle={`Método: ${countForecast.metodo}.`}>
              <Stack spacing={2}>
                <Typography variant="body2">
                  Parámetros seleccionados por validación: alfa {countForecast.parametros.alfa} (nivel) y beta {countForecast.parametros.beta} (tendencia).
                  Tendencia diaria de transferencias: {countForecast.tendenciaDiaria > 0 ? '+' : ''}{countForecast.tendenciaDiaria} por día.
                </Typography>
                {countForecast.validacion && (
                  <Typography variant="body2">
                    Validación con los últimos {countForecast.validacion.puntos} días: error medio del modelo de{' '}
                    <b>{countForecast.validacion.errorModelo}</b> frente a <b>{countForecast.validacion.errorIngenuo}</b> del pronóstico ingenuo (repetir el último valor).
                  </Typography>
                )}
                {[...countForecast.advertencias, ...(riskForecast?.advertencias ?? [])]
                  .filter((texto, i, all) => all.indexOf(texto) === i)
                  .map(texto => <Alert key={texto} severity="warning">{texto}</Alert>)}
                <Box sx={{ overflowX: 'auto' }}>
                  <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', '& th, & td': { p: 1, textAlign: 'left', borderBottom: '1px solid', borderColor: 'divider' } }}>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Transferencias pronosticadas</th>
                        <th>Intervalo 95 %</th>
                        <th>Riesgo promedio pronosticado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {countForecast.pronostico.map((step, i) => (
                        <tr key={step.fecha}>
                          <td>{fecha(step.fecha)}</td>
                          <td><b>{step.valor}</b></td>
                          <td>{step.inferior} – {step.superior}</td>
                          <td>{riskForecast ? riskForecast.pronostico[i].valor : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Box>
                </Box>
              </Stack>
            </Panel>
          )}
        </>
      )}
    </Stack>
  );
}
