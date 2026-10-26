import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ShieldOutlinedIconModule from '@mui/icons-material/ShieldOutlined';
import useHealthCheck from '../../shared/hooks/useHealthCheck.js';
import { getDlpStats, getRecentDlpAnalyses } from '../dlp/dlpApi.js';

// Vite 8 may expose icons from MUI 5 as { default: Component } in development.
// Normalize both module shapes so React always receives the component itself.
const ShieldOutlinedIcon = ShieldOutlinedIconModule.default ?? ShieldOutlinedIconModule;

const statCards = [
  { key: 'total', label: 'Analisis realizados' },
  { key: 'allowed', label: 'Permitidos' },
  { key: 'alerted', label: 'Advertencias' },
  { key: 'blocked', label: 'Bloqueados' },
];

function decisionColor(decision) {
  if (decision === 'PERMITIR') return 'success';
  if (decision === 'ALERTAR') return 'warning';
  return 'error';
}

function DashboardPage() {
  const { status, databaseStatus } = useHealthCheck();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getDlpStats(), getRecentDlpAnalyses(6)])
      .then(([statsResponse, recentResponse]) => {
        setStats(statsResponse.data);
        setRecent(recentResponse.data);
      })
      .catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h1">Panel de control</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Actividad persistente del motor DLP. El profesional ve sus análisis; los roles de seguridad ven el conjunto.
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
        <Chip
          variant="outlined"
          color={status === 'connected' ? 'success' : status === 'error' ? 'error' : 'default'}
          label={status === 'connected' ? 'Backend conectado' : status === 'error' ? 'Backend sin conexion' : 'Comprobando backend'}
        />
        <Chip
          variant="outlined"
          color={databaseStatus === 'connected' ? 'success' : 'default'}
          label={`MySQL: ${databaseStatus || 'comprobando'}`}
        />
        <Chip variant="outlined" color="primary" icon={<ShieldOutlinedIcon />} label="Motor DLP activo" />
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={2}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.key}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                {stats ? (
                  <Typography sx={{ fontSize: '2rem', fontWeight: 700, mt: 1 }}>{stats[card.key]}</Typography>
                ) : (
                  <Skeleton width={60} height={48} />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h2">Actividad DLP reciente</Typography>
          <Typography variant="body2" color="text.secondary">
            Los análisis se conservan en MySQL y permanecen disponibles después de reiniciar el servidor.
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Destinatario</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Riesgo</TableCell>
                <TableCell>Decision</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recent.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    Aun no hay analisis. Ve a Transferencias y ejecuta un caso de laboratorio.
                  </TableCell>
                </TableRow>
              ) : (
                recent.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{new Date(item.createdAt).toLocaleTimeString('es-CO')}</TableCell>
                    <TableCell>{item.recipient.email}</TableCell>
                    <TableCell>{item.recipient.type}</TableCell>
                    <TableCell>{item.risk.score}/100</TableCell>
                    <TableCell>
                      <Chip size="small" label={item.decision} color={decisionColor(item.decision)} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  );
}

export default DashboardPage;
