import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

export default function RouteErrorPage() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error?.message || 'La interfaz encontró un error inesperado.';

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'background.default', p: 3 }}>
      <Paper variant="outlined" sx={{ width: '100%', maxWidth: 620, p: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h1">No fue posible mostrar esta pantalla</Typography>
          <Alert severity="error">{message}</Alert>
          <Typography color="text.secondary">
            Vuelve a cargar la aplicación. Si el problema continúa, reinicia el cliente de desarrollo.
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Volver a cargar
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
