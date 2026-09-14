import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper variant="outlined" sx={{ p: 4, width: '100%', maxWidth: 420 }}>
        <Typography variant="h1" gutterBottom>
          MediShield DLP
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Prototipo de laboratorio para prevencion de perdida de datos medicos.
        </Typography>

        <Alert severity="info" variant="outlined" sx={{ mb: 3 }}>
          La autenticacion real se implementara en la siguiente fase. Este acceso abre directamente el entorno DLP de demostracion.
        </Alert>

        <Stack spacing={2}>
          <TextField label="Correo" type="email" fullWidth size="small" disabled />
          <TextField label="Contraseña" type="password" fullWidth size="small" disabled />
          <Button variant="contained" disableElevation onClick={() => navigate('/dashboard')}>
            Entrar a la demo DLP
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

export default LoginPage;
