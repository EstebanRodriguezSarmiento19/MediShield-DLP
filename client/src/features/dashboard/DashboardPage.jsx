import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Stack
} from '@mui/material';

import {
  Shield,
  ErrorOutline,
  DataUsage,
  Security,
  Block,
  Warning
} from '@mui/icons-material';

export default function DashboardPage() {
  return (
    <Box>
      <Box sx={{ mb: 5 }}>
        <Typography
          variant="h3"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          Dashboard de Seguridad
        </Typography>

        <Typography variant="body1" color="text.secondary">
          Monitorización en tiempo real de fuga de datos clínicos y análisis de red.
        </Typography>
      </Box>

      {/* Tarjetas de métricas */}
      <Grid container spacing={4}>

        {/* Transferencias */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}
              >
                <Box>
                  <Typography
                    color="text.secondary"
                    variant="subtitle2"
                    sx={{
                      textTransform: 'uppercase',
                      mb: 1
                    }}
                  >
                    Transferencias
                  </Typography>

                  <Typography variant="h4" color="text.primary">
                    1,245
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: 'rgba(0, 229, 255, 0.1)'
                  }}
                >
                  <DataUsage sx={{ color: 'primary.main' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Alertas DLP */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}
              >
                <Box>
                  <Typography
                    color="text.secondary"
                    variant="subtitle2"
                    sx={{
                      textTransform: 'uppercase',
                      mb: 1
                    }}
                  >
                    Alertas DLP
                  </Typography>

                  <Typography variant="h4" color="error.main">
                    12
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: 'rgba(255, 23, 68, 0.1)'
                  }}
                >
                  <ErrorOutline color="error" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Eventos NIDS */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}
              >
                <Box>
                  <Typography
                    color="text.secondary"
                    variant="subtitle2"
                    sx={{
                      textTransform: 'uppercase',
                      mb: 1
                    }}
                  >
                    Eventos NIDS
                  </Typography>

                  <Typography variant="h4">
                    24
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: 'rgba(255, 193, 7, 0.1)'
                  }}
                >
                  <Security color="warning" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Bloqueados */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}
              >
                <Box>
                  <Typography
                    color="text.secondary"
                    variant="subtitle2"
                    sx={{
                      textTransform: 'uppercase',
                      mb: 1
                    }}
                  >
                    Bloqueados
                  </Typography>

                  <Typography variant="h4" color="error.main">
                    8
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: 'rgba(255, 23, 68, 0.1)'
                  }}
                >
                  <Block color="error" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Secciones principales */}
      <Grid container spacing={4} sx={{ mt: 1 }}>

        {/* NIDS / SNORT */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 4 }}>

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 3 }}
              >
                <Box>
                  <Typography variant="h5">
                    Tráfico y Análisis NIDS (Snort)
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Eventos detectados por el sistema de detección de intrusiones.
                  </Typography>
                </Box>

                <Chip
                  label="NIDS activo"
                  color="success"
                  size="small"
                />
              </Stack>

              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  overflow: 'hidden'
                }}
              >
                <Table size="small">

                  <TableHead>
                    <TableRow>
                      <TableCell>Hora</TableCell>
                      <TableCell>Regla Snort</TableCell>
                      <TableCell>Origen</TableCell>
                      <TableCell>Destino</TableCell>
                      <TableCell>Acción</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>

                    <TableRow>
                      <TableCell>21:42:18</TableCell>
                      <TableCell>ET SCAN Suspicious Traffic</TableCell>
                      <TableCell>192.168.1.20</TableCell>
                      <TableCell>10.0.0.15</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label="Bloqueado"
                          color="error"
                        />
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>21:39:04</TableCell>
                      <TableCell>Possible Port Scan</TableCell>
                      <TableCell>192.168.1.31</TableCell>
                      <TableCell>10.0.0.15</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label="Alertado"
                          color="warning"
                        />
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>21:35:51</TableCell>
                      <TableCell>HTTP Suspicious Request</TableCell>
                      <TableCell>192.168.1.44</TableCell>
                      <TableCell>10.0.0.15</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label="Detectado"
                          color="info"
                        />
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>21:31:26</TableCell>
                      <TableCell>Unauthorized Connection</TableCell>
                      <TableCell>192.168.1.52</TableCell>
                      <TableCell>10.0.0.15</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label="Bloqueado"
                          color="error"
                        />
                      </TableCell>
                    </TableRow>

                  </TableBody>
                </Table>
              </Box>

            </CardContent>
          </Card>
        </Grid>

        {/* MOTOR DLP */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 4 }}>

              <Typography variant="h5" sx={{ mb: 3 }}>
                Estado del Motor DLP
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 3
                }}
              >
                <Shield
                  sx={{
                    color: 'success.main',
                    mr: 2,
                    fontSize: 40
                  }}
                />

                <Box>
                  <Typography
                    variant="body1"
                    fontWeight="600"
                  >
                    Servicio Activo
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Reglas actualizadas: Hoy
                  </Typography>
                </Box>
              </Box>

              <Stack spacing={2}>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}
                >
                  <Security color="success" />

                  <Box>
                    <Typography variant="body2">
                      Motor DLP
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Funcionando correctamente
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}
                >
                  <Warning color="warning" />

                  <Box>
                    <Typography variant="body2">
                      Alertas pendientes
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      12 eventos requieren revisión
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}
                >
                  <Block color="error" />

                  <Box>
                    <Typography variant="body2">
                      Comunicaciones bloqueadas
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      8 bloqueos registrados
                    </Typography>
                  </Box>
                </Box>

              </Stack>

            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
}