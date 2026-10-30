import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  alpha,
  useTheme
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import api from '../../shared/services/api.js';

const REFRESH_MS = 30000;

const DECISION = {
  PERMITIR: { label: 'Permitida', tone: 'success' },
  ALERTAR: { label: 'En alerta', tone: 'warning' },
  BLOQUEAR: { label: 'Bloqueada', tone: 'error' }
};

const BANDS = [
  { label: '0 – 19', min: 0, max: 19, tone: 'success' },
  { label: '20 – 39', min: 20, max: 39, tone: 'success' },
  { label: '40 – 59', min: 40, max: 59, tone: 'warning' },
  { label: '60 – 79', min: 60, max: 79, tone: 'error' },
  { label: '80 – 100', min: 80, max: 100, tone: 'error' }
];

const hhmm = (value) => value
  ? new Date(value).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  : '—';
const percent = (part, total) => (total ? Math.round((part / total) * 100) : 0);

/** Banda de indicadores: cuatro cifras separadas por líneas y una barra apilada de decisiones. */
function SummaryBand({ total, allowed, alerted, blocked, sent }) {
  const theme = useTheme();
  const cells = [
    { label: 'Analizadas', value: total, hint: `${sent} enviadas`, tone: 'primary' },
    { label: 'Permitidas', value: allowed, hint: `${percent(allowed, total)}%`, tone: 'success' },
    { label: 'En alerta', value: alerted, hint: `${percent(alerted, total)}%`, tone: 'warning' },
    { label: 'Bloqueadas', value: blocked, hint: `${percent(blocked, total)}%`, tone: 'error' }
  ];

  return (
    <Card sx={{ overflow: 'hidden' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' } }}>
        {cells.map((cell, index) => (
          <Box
            key={cell.label}
            sx={{
              p: 2.5,
              borderColor: 'divider',
              borderLeft: { md: index ? '1px solid' : 'none' },
              borderTop: { xs: index > 1 ? '1px solid' : 'none', md: 'none' },
              borderRight: { xs: index % 2 === 0 ? '1px solid' : 'none', md: 'none' },
              borderBottom: { xs: 'none' }
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.04em' }}>
              {cell.label}
            </Typography>
            <Typography sx={{ fontSize: '1.9rem', fontWeight: 800, color: `${cell.tone === 'primary' ? 'text.primary' : `${cell.tone}.main`}`, lineHeight: 1.2, mt: 0.5 }}>
              {cell.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">{cell.hint}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', height: 6, bgcolor: alpha(theme.palette.text.secondary, 0.12) }}>
        <Box sx={{ width: `${percent(allowed, total)}%`, bgcolor: 'success.main', transition: 'width 0.6s ease' }} />
        <Box sx={{ width: `${percent(alerted, total)}%`, bgcolor: 'warning.main', transition: 'width 0.6s ease' }} />
        <Box sx={{ width: `${percent(blocked, total)}%`, bgcolor: 'error.main', transition: 'width 0.6s ease' }} />
      </Box>
    </Card>
  );
}

function Panel({ title, caption, children, sx }) {
  return (
    <Card sx={{ p: { xs: 2.5, md: 3 }, ...sx }}>
      <Typography variant="h5">{title}</Typography>
      {caption && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{caption}</Typography>}
      {!caption && <Box sx={{ mb: 2 }} />}
      {children}
    </Card>
  );
}

export default function DashboardPage() {
  const theme = useTheme();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async () => {
    try {
      const [statsResponse, recentResponse] = await Promise.all([
        api.get('/dlp/stats'),
        api.get('/dlp/recent?limit=60')
      ]);
      setStats(statsResponse.data);
      setRecent(recentResponse.data);
      setError('');
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err.message || 'No se pudo cargar la actividad.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const total = stats?.total ?? 0;
  const allowed = stats?.allowed ?? 0;
  const alerted = stats?.alerted ?? 0;
  const blocked = stats?.blocked ?? 0;
  const sent = stats?.sent ?? 0;

  const bandCounts = BANDS.map((band) => ({
    ...band,
    count: recent.filter((item) => {
      const score = item.risk?.score ?? 0;
      return score >= band.min && score <= band.max;
    }).length
  }));
  const bandMax = Math.max(1, ...bandCounts.map((band) => band.count));

  const ranking = Object.values(
    recent.reduce((acc, item) => {
      const email = item.recipient?.email ?? 'Sin destinatario';
      const current = acc[email] ?? { email, peak: 0, count: 0 };
      current.peak = Math.max(current.peak, item.risk?.score ?? 0);
      current.count += 1;
      acc[email] = current;
      return acc;
    }, {})
  ).sort((a, b) => b.peak - a.peak).slice(0, 5);

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-end' }} spacing={2}>
        <Box>
          <Typography variant="h1">Vigilancia de salidas</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Transferencias clínicas analizadas por el motor DLP antes de cualquier envío.
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography variant="caption" color={error ? 'error.main' : 'text.secondary'}>
            {error ? 'Sin conexión' : `Actualizado ${updatedAt ? updatedAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'} · cada 30 s`}
          </Typography>
          <Button size="small" variant="text" startIcon={<Refresh fontSize="small" />} onClick={load}>
            Actualizar
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {loading && <LinearProgress sx={{ borderRadius: 1 }} />}

      <SummaryBand total={total} allowed={allowed} alerted={alerted} blocked={blocked} sent={sent} />

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.6fr) minmax(0, 1fr)' } }}>
        <Stack spacing={2.5}>
          <Panel title="Últimas transferencias" caption={`Las ${Math.min(recent.length, 8)} más recientes de ${recent.length} consultadas.`}>
            {recent.length ? (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Hora</TableCell>
                      <TableCell>Destinatario</TableCell>
                      <TableCell align="right">Riesgo</TableCell>
                      <TableCell>Decisión</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recent.slice(0, 8).map((item) => {
                      const decision = DECISION[item.decision] ?? { label: item.decision, tone: 'info' };
                      return (
                        <TableRow key={item.id} hover>
                          <TableCell sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.secondary' }}>{hhmm(item.createdAt)}</TableCell>
                          <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.recipient?.email ?? '—'}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: `${decision.tone}.main` }}>
                            {item.risk?.score ?? 0}
                          </TableCell>
                          <TableCell>
                            <Chip size="small" label={decision.label} color={decision.tone} variant="outlined" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <Typography color="text.secondary">
                Aún no hay transferencias analizadas. Prepara un envío en Transferencias para verlo aquí.
              </Typography>
            )}
          </Panel>

          <Panel title="Distribución por riesgo" caption="Número de transferencias en cada tramo de puntaje.">
            <Stack spacing={1.5}>
              {bandCounts.map((band) => (
                <Stack key={band.label} direction="row" alignItems="center" spacing={2}>
                  <Typography variant="body2" color="text.secondary" sx={{ width: 76, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                    {band.label}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(band.count / bandMax) * 100}
                    color={band.tone}
                    sx={{ flex: 1, height: 10, borderRadius: 5, bgcolor: alpha(theme.palette.text.secondary, 0.12) }}
                  />
                  <Typography variant="body2" sx={{ width: 28, textAlign: 'right', fontWeight: 700 }}>
                    {band.count}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Panel>
        </Stack>

        <Stack spacing={2.5}>
          <Panel title="Destinatarios críticos" caption="Pico de riesgo registrado por destinatario.">
            {ranking.length ? (
              <Stack spacing={1.25}>
                {ranking.map((entry, index) => {
                  const tone = entry.peak >= 70 ? 'error' : entry.peak >= 40 ? 'warning' : 'success';
                  return (
                    <Stack key={entry.email} direction="row" alignItems="center" spacing={1.5}>
                      <Box
                        sx={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                          color: `${tone}.main`,
                          border: (t) => `1px solid ${alpha(t.palette[tone].main, 0.5)}`,
                          flexShrink: 0
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Typography noWrap variant="body2" sx={{ flex: 1, minWidth: 0 }}>{entry.email}</Typography>
                      <Chip size="small" label={entry.peak} color={tone} />
                    </Stack>
                  );
                })}
              </Stack>
            ) : (
              <Typography color="text.secondary">Sin destinatarios analizados todavía.</Typography>
            )}
          </Panel>

          <Panel title="Criterios del motor" caption="Cómo se decide cada transferencia.">
            <Stack spacing={1.5}>
              <Typography variant="body2"><b>Permitir:</b> riesgo menor a 40 y destinatario autorizado.</Typography>
              <Typography variant="body2"><b>Alertar:</b> riesgo entre 40 y 69. La transferencia se retiene y no se envía.</Typography>
              <Typography variant="body2"><b>Bloquear:</b> destinatario no autorizado, datos de alta sensibilidad hacia un dominio externo, o riesgo de 70 o más.</Typography>
            </Stack>
          </Panel>
        </Stack>
      </Box>
    </Stack>
  );
}
