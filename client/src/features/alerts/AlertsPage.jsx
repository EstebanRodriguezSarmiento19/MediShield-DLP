import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { getRecentDlpAnalyses } from '../dlp/dlpApi.js';

function AlertsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getRecentDlpAnalyses(50)
      .then((response) => {
        setItems(response.data.filter((item) => item.decision !== 'PERMITIR'));
      })
      .catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h1">Alertas DLP</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Transferencias que requieren advertencia o fueron bloqueadas por el motor.
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Destinatario</TableCell>
                <TableCell>Riesgo</TableCell>
                <TableCell>Coincidencias</TableCell>
                <TableCell>Decision</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No hay alertas en esta ejecucion.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{new Date(item.createdAt).toLocaleString('es-CO')}</TableCell>
                    <TableCell>{item.recipient.email}</TableCell>
                    <TableCell>{item.risk.score}/100</TableCell>
                    <TableCell>{item.content.matches.length}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={item.decision}
                        color={item.decision === 'ALERTAR' ? 'warning' : 'error'}
                      />
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

export default AlertsPage;
