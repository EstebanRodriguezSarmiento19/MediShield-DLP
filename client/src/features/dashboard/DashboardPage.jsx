import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme
} from '@mui/material';
import { Block, CheckCircle, DataUsage, Refresh, Warning } from '@mui/icons-material';
import api from '../../shared/services/api.js';

const REFRESH_MS = 30000;

const DECISION = {
  PERMITIR: { label: 'Permitida', tone: 'success' },
  ALERTAR: { label: 'En alerta', tone: 'warning' },
  BLOQUEAR: { label: 'Bloqueada', tone: 'error' }
};

const BUCKETS = [
  { label: '0–19', min: 0, tone: 'success' },
  { label: '20–39', min: 20, tone: 'success' },
  { label: '40–59', min: 40, tone: 'warning' },
  { label: '60–79', min: 60, tone: 'error' },
  { label: '80–100', min: 80, tone: 'error' }
];

const clock = (date) => date ? date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--';
const percent = (part, total) => (total ? Math.round((part / total) * 100) : 0);

function KpiCard({ label, value, hint, tone, icon: Icon }) {
  const theme = useTheme();
  const color = theme.palette[tone].main;
  return (
    <Card sx={{ p: 2.5, height: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">{label}</Typography>
          <Typography variant="h4" sx={{ mt: 1, color }}>{value}</Typography>
        </Box>
        <Box sx={{ p: 1, borderRadius: 2.5, bgcolor: alpha(color, 0.12), color, display: 'grid', placeItems: 'center' }}>
          <Icon fontSize="small" />
        </Box>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>{hint}</Typography>
    </Card>
  );
}

function SectionCard({ title, subtitle, action, children, sx }) {
  return (
    <Card sx={{ p: { xs: 2.5, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column', ...sx }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 2.5 }}>
        <Box>
          <Typography variant="h5">{title}</Typography>
          {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
        </Box>
        {action}
      </Stack>
      {children}
    </Card>
  );
}

/** Anillo de decisiones calculado con SVG; sin dependencias de gráficos. */
function Donut({ segments, total, label }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <Box sx={{ position: 'relative', width: 184, height: 184, mx: 'auto' }}>
      <svg viewBox="0 0 140 140" width="184" height="184" role="img" aria-label={`${label}: ${total}`}>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(148, 163, 184, 0.14)" strokeWidth="14" />
        {segments.map((segment) => {
          const length = total ? (segment.value / total) * circumference : 0;
          const element = (
            <circle
              key={segment.key}
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="14"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 70 70)"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          );
          offset += length;
          return element;
        })}
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <Box>
          <Typography variant="h4">{total}</Typography>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
        </Box>
      </Box>
    </Box>
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

  const histogram = BUCKETS.map((bucket, index) => {
    const next = BUCKETS[index + 1];
    const count = recent.filter((item) => {
      const score = item.risk?.score ?? 0;
      return score >= bucket.min && (next ? score < next.min : true);
    }).length;
    return { ...bucket, count };
  });
  const histogramMax = Math.max(1, ...histogram.map((bucket) => bucket.count));

  const ranking = Object.values(
    recent.reduce((acc, item) => {
      const email = item.recipient?.email ?? 'Sin destinatario';
      const current = acc[email] ?? { email, peak: 0, count: 0 };
      current.peak = Math.max(current.peak, item.risk?.score ?? 0);
      current.count += 1;
      acc[email] = current;
      return acc;
    }, {})
  ).sort((a, b) => b.peak - a.peak).slice(0, 6);

  const tiles = recent.slice(0, 6);

  if (loading && !stats) {
    return (
      <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress aria-label="Cargando panel" />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'flex-start' }} spacing={2}>
        <Box>
          <Typography variant="h1">Panel de control</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Actividad de transferencias de datos clínicos analizadas por el motor DLP.
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
          <Chip
            size="small"
            variant="outlined"
            color={error ? 'error' : 'success'}
            label={error ? 'Sin conexión' : 'Motor DLP en línea'}
          />
          <Chip size="small" variant="outlined" label={`Actualizado ${clock(updatedAt)} · cada 30 s`} sx={{ fontVariantNumeric: 'tabular-nums' }} />
          <Tooltip title="Actualizar ahora">
            <IconButton onClick={load} aria-label="Actualizar ahora" size="small">
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {loading && <LinearProgress sx={{ borderRadius: 1 }} />}

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' } }}>
        <KpiCard
          label="Transferencias analizadas"
          value={total}
          hint={total ? `${sent} enviadas por el sistema` : 'Sin actividad registrada'}
          tone="primary"
          icon={DataUsage}
        />
        <KpiCard
          label="Permitidas"
          value={allowed}
          hint={`${percent(allowed, total)}% del total`}
          tone="success"
          icon={CheckCircle}
        />
        <KpiCard
          label="En alerta"
          value={alerted}
          hint={`${percent(alerted, total)}% retenidas para revisión`}
          tone="warning"
          icon={Warning}
        />
        <KpiCard
          label="Bloqueadas"
          value={blocked}
          hint={`${percent(blocked, total)}% impedidas antes del envío`}
          tone="error"
          icon={Block}
        />
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(0, 1fr)' } }}>
        <SectionCard
          title="Actividad reciente"
          subtitle="Últimas transferencias analizadas, con su decisión y nivel de riesgo."
        >
          {tiles.length ? (
            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', xl: '1fr 1fr 1fr' } }}>
              {tiles.map((item) => {
                const decision = DECISION[item.decision] ?? { label: item.decision, tone: 'info' };
                const score = item.risk?.score ?? 0;
                return (
                  <Box
                    key={item.id}
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      border: (t) => `1px solid ${t.palette.divider}`,
                      bgcolor: 'action.hover'
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                      <Typography noWrap variant="body2" sx={{ fontWeight: 600, minWidth: 0 }}>
                        {item.recipient?.email ?? 'Destinatario'}
                      </Typography>
                      <Chip size="small" label={decision.label} color={decision.tone} variant="outlined" />
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.25 }}>
                      <Typography variant="caption" color="text.secondary">
                        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: `${decision.tone}.main` }}>
                        Riesgo {score}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, score)}
                      color={decision.tone}
                      sx={{ mt: 1, height: 5, borderRadius: 3, bgcolor: alpha(theme.palette.text.secondary, 0.15) }}
                    />
                  </Box>
                );
              })}
            </Box>
          ) : (
            <Typography color="text.secondary">
              Aún no hay transferencias analizadas. Prepara un envío en Transferencias para ver la actividad aquí.
            </Typography>
          )}
        </SectionCard>

        <SectionCard title="Decisiones del motor" subtitle="Distribución acumulada de decisiones.">
          <Donut
            total={total}
            label="transferencias"
            segments={[
              { key: 'allowed', value: allowed, color: theme.palette.success.main },
              { key: 'alerted', value: alerted, color: theme.palette.warning.main },
              { key: 'blocked', value: blocked, color: theme.palette.error.main }
            ]}
          />
          <Stack spacing={1.25} sx={{ mt: 3 }}>
            {[
              ['Permitidas', allowed, 'success'],
              ['En alerta', alerted, 'warning'],
              ['Bloqueadas', blocked, 'error']
            ].map(([label, value, tone]) => (
              <Stack key={label} direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: `${tone}.main` }} />
                  <Typography variant="body2">{label}</Typography>
                </Stack>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{value}</Typography>
              </Stack>
            ))}
          </Stack>
        </SectionCard>
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(0, 1fr)' } }}>
        <SectionCard
          title="Distribución de riesgo"
          subtitle={`Puntaje de riesgo de las últimas ${recent.length} transferencias.`}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: { xs: 1.5, md: 3 }, height: 240, px: 1 }}>
            {histogram.map((bucket) => {
              const height = (bucket.count / histogramMax) * 100;
              const color = theme.palette[bucket.tone].main;
              return (
                <Box key={bucket.label} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.75, color: bucket.count ? 'text.primary' : 'text.secondary' }}>
                    {bucket.count}
                  </Typography>
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: 88,
                      height: `${Math.max(bucket.count ? height : 2, 2)}%`,
                      borderRadius: '8px 8px 4px 4px',
                      background: `linear-gradient(180deg, ${color} 0%, ${alpha(color, 0.35)} 100%)`,
                      transition: 'height 0.6s ease'
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>{bucket.label}</Typography>
                </Box>
              );
            })}
          </Box>
        </SectionCard>

        <SectionCard title="Destinatarios con mayor riesgo" subtitle="Pico de riesgo por destinatario.">
          {ranking.length ? (
            <Stack spacing={2}>
              {ranking.map((entry) => {
                const tone = entry.peak >= 70 ? 'error' : entry.peak >= 40 ? 'warning' : 'success';
                return (
                  <Box key={entry.email}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                      <Typography noWrap variant="body2" sx={{ minWidth: 0 }}>{entry.email}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: `${tone}.main` }}>{entry.peak}</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, entry.peak)}
                      color={tone}
                      sx={{ mt: 0.75, height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.text.secondary, 0.15) }}
                    />
                  </Box>
                );
              })}
            </Stack>
          ) : (
            <Typography color="text.secondary">Sin destinatarios analizados todavía.</Typography>
          )}
        </SectionCard>
      </Box>
    </Stack>
  );
}
