import { useEffect, useState } from 'react';
import {
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

function AuditPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    getRecentDlpAnalyses(50)
      .then((response) => setItems(response.data))
      .catch(() => setItems([]));
  }, []);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h1">Trazabilidad de analisis</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Vista temporal de evidencia tecnica. La auditoria persistente en MySQL se implementara en la siguiente fase.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Destino</TableCell>
                <TableCell>Reglas</TableCell>
                <TableCell>Hash</TableCell>
                <TableCell>Decision</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    Todavia no hay evidencia de analisis en memoria.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{item.id.slice(0, 8)}</TableCell>
                    <TableCell>{new Date(item.createdAt).toLocaleString('es-CO')}</TableCell>
                    <TableCell>{item.recipient.email}</TableCell>
                    <TableCell>{item.content.matches.length}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{item.content.contentHash.slice(0, 12)}…</TableCell>
                    <TableCell><Chip size="small" variant="outlined" label={item.decision} /></TableCell>
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

export default AuditPage;
