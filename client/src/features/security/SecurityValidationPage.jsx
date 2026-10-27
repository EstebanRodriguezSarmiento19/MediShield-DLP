import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, Divider, Grid, Paper, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography
} from '@mui/material';
import api from '../../shared/services/api.js';

const decisionColor = { PERMITIR: 'success', ALERTAR: 'warning', BLOQUEAR: 'error' };
const blankSimulation = { recipient: '', subject: '', body: '' };

function download(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function SecurityValidationPage() {
  const [catalog, setCatalog] = useState([]);
  const [report, setReport] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  const [sim, setSim] = useState(blankSimulation);
  const [simResult, setSimResult] = useState(null);
  const [simBusy, setSimBusy] = useState(false);
  const [simError, setSimError] = useState('');

  useEffect(() => {
    api.get('/security/dlp-tests').then(r => setCatalog(r.data)).catch(err => setError(err.message));
  }, []);

  async function runSuite() {
    setRunning(true);
    setError('');
    try {
      const r = await api.post('/security/dlp-tests/run', {});
      setReport(r.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  async function simulate(event) {
    event.preventDefault();
    setSimBusy(true);
    setSimError('');
    try {
      const r = await api.post('/security/dlp-simulate', sim);
      setSimResult(r.data);
    } catch (err) {
      setSimResult(null);
      setSimError(err.message);
    } finally {
      setSimBusy(false);
    }
  }

  // Antes de ejecutar se muestran los casos del catálogo; después, los resultados reales.
  const rows = report
    ? report.cases
    : catalog.map(test => ({ id: test.id, name: test.name, recipient: test.recipient, expected: test.expected }));

  function exportReport() {
    download('medishield-politica-dlp.json', {
      project: 'MediShield-DLP',
      generatedAt: new Date().toISOString(),
      notice: 'Resultado de la batería ejecutada contra el motor DLP del servidor con las reglas activas. Los casos usan datos sintéticos.',
      executedAt: report.executedAt,
      rulesVersion: report.rulesVersion,
      summary: report.summary,
      cases: report.cases
    });
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h1">Seguridad y pruebas DLP</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Verifica que el motor de políticas tome las decisiones esperadas con las reglas activas.
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Alert severity="info">
        Las pruebas usan el motor real del servidor. No envían correos ni crean transferencias, y el simulador tampoco guarda el mensaje analizado.
      </Alert>

      <Grid container spacing={2}>
        {[
          ['Casos', report ? report.summary.total : catalog.length],
          ['Aprobados', report ? report.summary.passed : '—'],
          ['Fallidos', report ? report.summary.failed : '—'],
          ['Última ejecución', report ? new Date(report.executedAt).toLocaleString('es') : 'Sin ejecutar']
        ].map(([label, value]) => (
          <Grid item xs={6} md={3} key={label}>
            <Card variant="outlined"><CardContent>
              <Typography color="text.secondary" variant="body2">{label}</Typography>
              <Typography variant="h5" sx={{ mt: 1 }}>{value}</Typography>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h2">Batería de políticas</Typography>
            <Typography variant="body2" color="text.secondary">
              Cada caso define un contexto (autorización e historial) y la decisión esperada.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={runSuite} disabled={running}>
              {running ? 'Ejecutando…' : 'Ejecutar pruebas'}
            </Button>
            <Button variant="outlined" onClick={exportReport} disabled={!report}>Exportar informe JSON</Button>
          </Stack>
        </Stack>

        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['ID', 'Caso', 'Destinatario', 'Esperado', 'Obtenido', 'Riesgo', 'Reglas', 'Resultado'].map(h => <TableCell key={h}>{h}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell sx={{ minWidth: 220 }}>{row.name}</TableCell>
                  <TableCell sx={{ overflowWrap: 'anywhere' }}>{row.recipient}</TableCell>
                  <TableCell><Chip size="small" label={row.expected} color={decisionColor[row.expected]} variant="outlined" /></TableCell>
                  <TableCell>{row.obtained ? <Chip size="small" label={row.obtained} color={decisionColor[row.obtained]} /> : '—'}</TableCell>
                  <TableCell>{row.riskScore ?? '—'}</TableCell>
                  <TableCell>{row.matchedRules ? (row.matchedRules.join(', ') || 'Ninguna') : '—'}</TableCell>
                  <TableCell>
                    {row.passed === undefined ? '—' : <Chip size="small" label={row.passed ? 'Aprobado' : 'Fallido'} color={row.passed ? 'success' : 'error'} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h2">Simulador de mensaje</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Analiza un mensaje con tu historial real y las reglas activas. Sirve para entender por qué una transferencia se permitiría, alertaría o bloquearía.
        </Typography>
        <Stack component="form" onSubmit={simulate} spacing={2}>
          {simError && <Alert severity="error">{simError}</Alert>}
          <TextField label="Destinatario" type="email" value={sim.recipient} onChange={e => setSim(c => ({ ...c, recipient: e.target.value }))} inputProps={{ maxLength: 254 }} required />
          <TextField label="Asunto" value={sim.subject} onChange={e => setSim(c => ({ ...c, subject: e.target.value }))} inputProps={{ maxLength: 200 }} />
          <TextField label="Mensaje" multiline minRows={4} value={sim.body} onChange={e => setSim(c => ({ ...c, body: e.target.value }))} inputProps={{ maxLength: 20000 }} />
          <Button type="submit" variant="outlined" disabled={simBusy} sx={{ alignSelf: 'flex-start' }}>
            {simBusy ? 'Analizando…' : 'Analizar sin enviar'}
          </Button>
        </Stack>

        {simResult && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <Chip label={simResult.decision} color={decisionColor[simResult.decision]} />
              <Typography>Riesgo {simResult.risk.score}/100 · {simResult.recipient.type === 'EXTERNO' ? 'Destino externo' : 'Destino interno'} · {simResult.recipient.authorized ? 'Autorizado' : 'No autorizado'}</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Envíos confirmados previos a este destinatario: {simResult.recipient.previousSends}. Habitualidad: {simResult.recipient.habituality}%.
            </Typography>
            {simResult.matches.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
                {simResult.matches.map(m => <Chip key={m.ruleId} size="small" variant="outlined" label={`${m.ruleId} · ${m.name} (${m.sensitivity})`} />)}
              </Stack>
            )}
            <Stack spacing={0.5} sx={{ mt: 2 }}>
              {simResult.reasons.map(reason => <Typography key={reason} variant="body2">• {reason}</Typography>)}
            </Stack>
          </Box>
        )}
      </Paper>
    </Stack>
  );
}
