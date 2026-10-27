import { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Link as MuiLink, Alert } from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const navigate = useNavigate();
  // Estado correcto del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // SOLUCIÓN AL ERROR: Se usa formData.password en lugar de la variable password suelta
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      // TU LÓGICA DE API AQUÍ (Ej: await api.register(formData))
      console.log('Registrando:', formData);
      navigate('/login'); // Redirige al login tras registrar
    } catch (err) {
      setError('Ocurrió un error en el registro.');
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Card sx={{ maxWidth: 450, width: '100%', p: 2 }}>
        <CardContent>
          {/* Título Moderno y Corregido */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
            <SecurityIcon sx={{ color: 'primary.main', mr: 1.5, fontSize: 36 }} />
            <Typography variant="h3" component="h1" sx={{ fontWeight: 800, background: 'linear-gradient(90deg, #00E5FF 0%, #2979FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              MediShield DLP
            </Typography>
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Registro en el laboratorio de protección de datos médicos.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Nombre completo" name="nombre" value={formData.nombre} onChange={handleChange} margin="normal" required variant="outlined" />
            <TextField fullWidth label="Correo electrónico" name="correo" type="email" value={formData.correo} onChange={handleChange} margin="normal" required variant="outlined" />
            <TextField fullWidth label="Contraseña" name="password" type="password" value={formData.password} onChange={handleChange} margin="normal" required variant="outlined" />
            <TextField fullWidth label="Confirmar contraseña" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} margin="normal" required variant="outlined" />
            
            <Button fullWidth type="submit" variant="contained" color="primary" sx={{ mt: 3, mb: 2, py: 1.5 }}>
              Registrarse
            </Button>
          </form>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              ¿Ya tienes cuenta?{' '}
              <MuiLink component={Link} to="/login" color="primary" sx={{ fontWeight: 600, textDecoration: 'none' }}>
                Inicia sesión aquí
              </MuiLink>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}