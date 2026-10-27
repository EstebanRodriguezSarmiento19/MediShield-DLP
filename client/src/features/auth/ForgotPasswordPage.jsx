import { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Link as MuiLink, Alert } from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import api from '../../shared/services/api.js';

export default function ForgotPasswordPage() {
  const [correo, setCorreo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    try {
      const r = await api.post('/auth/password/forgot', { email: correo.trim() });
      setMensaje(r.data.message);
    } catch (err) {
      setError(err.message || 'Hubo un problema al procesar la solicitud.');
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Card sx={{ maxWidth: 450, width: '100%', p: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
            <SecurityIcon sx={{ color: 'primary.main', mr: 1.5, fontSize: 36 }} />
            <Typography variant="h3" component="h1" sx={{ fontWeight: 800, background: 'linear-gradient(90deg, #00E5FF 0%, #2979FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              MediShield DLP
            </Typography>
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Ingresa tu correo para recuperar el acceso a tu cuenta.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {mensaje && <Alert severity="success" sx={{ mb: 3 }}>{mensaje}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Correo electrónico" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} margin="normal" required variant="outlined" />
            
            <Button fullWidth type="submit" variant="contained" color="primary" sx={{ mt: 3, mb: 2, py: 1.5 }}>
              Recuperar contraseña
            </Button>
          </form>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <MuiLink component={Link} to="/login" variant="body2" color="primary" sx={{ fontWeight: 600, textDecoration: 'none' }}>
              Volver al inicio de sesión
            </MuiLink>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}