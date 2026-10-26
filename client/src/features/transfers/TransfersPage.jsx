import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ScienceOutlinedIconModule from '@mui/icons-material/ScienceOutlined';
import SecurityOutlinedIconModule from '@mui/icons-material/SecurityOutlined';
import { analyzeTransfer } from '../dlp/dlpApi.js';
import api from '../../shared/services/api.js';

// Vite 8 may wrap MUI 5 icon defaults during dependency optimization.
const ScienceOutlinedIcon = ScienceOutlinedIconModule.default ?? ScienceOutlinedIconModule;
const SecurityOutlinedIcon = SecurityOutlinedIconModule.default ?? SecurityOutlinedIconModule;

const initialForm = {
  recipient: '',
  subject: '',
  body: '',
};

const demoScenarios = {
  safe: {
    recipient: 'laboratorio@hospital.local',
    subject: 'Reunion de equipo',
    body: 'Confirmo la reunion de seguimiento para manana a las 10:00 a. m.',
  },
  warning: {
    recipient: 'auditoria@partner.test',
    subject: 'Revision de resultados',
    body: 'Agenda de una reunión administrativa con el socio de laboratorio.',
  },
  blocked: {
    recipient: 'destino.personal@gmail.com',
    subject: 'Historia clinica',
    body: 'Adjunto referencia HC-482910 correspondiente al paciente identificado como CC 1012345678.',
  },
};

function decisionColor(decision) {
  if (decision === 'PERMITIR') return 'success';
  if (decision === 'ALERTAR') return 'warning';
  return 'error';
}

function TransfersPage() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setResult(null);
  };

  const loadScenario = (scenario) => {
    setForm(demoScenarios[scenario]);
    setResult(null);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await analyzeTransfer(form);
      setResult(response.data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  async function send() {
    setLoading(true); setError('');
    try { const response = await api.post('/mail/send', {analysisId:result.id,...form}); setResult({...result,status:response.data.status}); }
    catch(e) { setError(e.message); } finally { setLoading(false); }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h1">Analisis de transferencia</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          El servidor analiza el contenido y autoriza el envío solo con decisión PERMITIR. Los correos se entregan al receptor SMTP local del laboratorio.
        </Typography>
      </Box>

      <Alert severity="info" variant="outlined" icon={<ScienceOutlinedIcon />}>
        Entorno de laboratorio: usa unicamente datos sinteticos. Los casos rapidos permiten demostrar las tres decisiones del motor DLP.
      </Alert>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }}>
          <Typography variant="subtitle2" sx={{ mr: 1 }}>
            Casos de laboratorio:
          </Typography>
          <Button size="small" variant="outlined" onClick={() => loadScenario('safe')}>Seguro</Button>
          <Button size="small" variant="outlined" color="warning" onClick={() => loadScenario('warning')}>Advertencia</Button>
          <Button size="small" variant="outlined" color="error" onClick={() => loadScenario('blocked')}>Bloqueo</Button>
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
              <Box>
                <Typography variant="h2">Nueva transferencia</Typography>
                <Typography variant="body2" color="text.secondary">
                  Prepara un correo de laboratorio. El contenido completo no se guarda en la base de datos.
                </Typography>
              </Box>

              <TextField
                label="Destinatario"
                type="email"
                value={form.recipient}
                onChange={handleChange('recipient')}
                placeholder="usuario@hospital.local"
                fullWidth
                required
              />
              <TextField
                label="Asunto"
                value={form.subject}
                onChange={handleChange('subject')}
                fullWidth
              />
              <TextField
                label="Mensaje"
                value={form.body}
                onChange={handleChange('body')}
                multiline
                minRows={8}
                fullWidth
              />

              {error && <Alert severity="error">{error}</Alert>}

              <Box>
                <Button
                  type="submit"
                  variant="contained"
                  disableElevation
                  disabled={loading}
                  startIcon={<SecurityOutlinedIcon />}
                >
                  {loading ? 'Analizando...' : 'Analizar con DLP'}
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Paper variant="outlined" sx={{ p: 3, minHeight: 420 }}>
            <Typography variant="h2">Resultado del motor</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              La decision se calcula exclusivamente en el servidor.
            </Typography>

            {!result && (
              <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                <SecurityOutlinedIcon sx={{ fontSize: 48, mb: 1, opacity: 0.45 }} />
                <Typography>Ejecuta un analisis para ver el nivel de riesgo y las reglas detectadas.</Typography>
              </Box>
            )}

            {result && (
              <Stack spacing={2.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary">DECISION</Typography>
                    <Typography variant="h2">{result.decision}</Typography>
                  </Box>
                  <Chip label={result.risk.level} color={decisionColor(result.decision)} />
                </Stack>

                <Box>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                    <Typography variant="body2">Puntaje de riesgo</Typography>
                    <Typography variant="body2" fontWeight={700}>{result.risk.score}/100</Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={result.risk.score}
                    color={decisionColor(result.decision)}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                {result.decision === 'PERMITIR' && result.status !== 'ENVIADA' && <Button variant="contained" disabled={loading} onClick={send}>Enviar al correo de laboratorio</Button>}
                {result.status === 'ENVIADA' && <Alert severity="success">SMTP confirmó la entrega al laboratorio.</Alert>}
                {result.decision !== 'PERMITIR' && <Alert severity="warning">El correo permanece retenido. No hay envío SMTP.</Alert>}
                <Divider />

                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">DESTINO</Typography>
                    <Typography variant="body2" fontWeight={600}>{result.recipient.type}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">HABITUALIDAD</Typography>
                    <Typography variant="body2" fontWeight={600}>{result.recipient.habituality}%</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">REGLAS ACTIVADAS</Typography>
                    <Typography variant="body2" fontWeight={600}>{result.content.matches.length}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">LATENCIA</Typography>
                    <Typography variant="body2" fontWeight={600}>{result.latencyMs} ms</Typography>
                  </Grid>
                </Grid>

                {result.content.matches.length > 0 && (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>Coincidencias DLP</Typography>
                      <Stack spacing={1}>
                        {result.content.matches.map((match) => (
                          <Stack key={match.ruleId} direction="row" justifyContent="space-between" gap={2}>
                            <Typography variant="body2">{match.name}</Typography>
                            <Chip size="small" label={`${match.sensitivity} · ${match.count}`} />
                          </Stack>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                )}

                <Box>
                  <Typography variant="subtitle2" gutterBottom>Motivos</Typography>
                  <Stack spacing={0.75}>
                    {result.reasons.map((reason) => (
                      <Typography key={reason} variant="body2" color="text.secondary">
                        • {reason}
                      </Typography>
                    ))}
                  </Stack>
                </Box>

                <Typography variant="caption" color="text.secondary">
                  Hash SHA-256 del contenido: {result.content.contentHash.slice(0, 24)}…
                </Typography>
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}

export default TransfersPage;
