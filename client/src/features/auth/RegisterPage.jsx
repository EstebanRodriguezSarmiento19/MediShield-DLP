import { useEffect, useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Link as MuiLink, Alert } from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../shared/services/api.js';
import { useAuth } from './AuthContext.jsx';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({ nombre: '', correo: '', password: '', confirmPassword: '' });
  const [config, setConfig] = useState(null); // { allowPublicRegistration, directRegistration }
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/auth/config')
      .then(r => setConfig(r.data))
      .catch(() => setConfig({ allowPublicRegistration: false, directRegistration: false }));
  }, []);

  const direct = Boolean(config?.directRegistration);
  const available = direct || Boolean(config?.allowPublicRegistration);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    const nombre = formData.nombre.trim();
    const correo = formData.correo.trim();

    if (direct) {
      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
      }
      if (formData.password.length < 15 || formData.password.length > 128) {
        setError('La contraseña debe tener entre 15 y 128 caracteres.');
        return;
      }
    }

    setLoading(true);
    try {
      const message = await register(nombre, correo, direct ? formData.password : undefined);
      if (direct) {
        navigate('/login', { replace: true, state: { registered: true, message } });
      } else {
        // Modo con confirmación por correo: la contraseña se elige desde el enlace recibido.
        setInfo(message);
        setFormData({ nombre: '', correo: '', password: '', confirmPassword: '' });
      }
    } catch (err) {
      setError(err.message || 'Ocurrió un error en el registro.');
    } finally {
      setLoading(false);
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
            Registro en el laboratorio de protección de datos médicos.
          </Typography>

          {config && !available && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              El registro público no está habilitado. Solicita una invitación a un administrador.
            </Alert>
          )}
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {info && <Alert severity="success" sx={{ mb: 3 }}>{info}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Nombre completo" name="nombre" value={formData.nombre} onChange={handleChange} margin="normal" required variant="outlined" autoComplete="name" />
            <TextField fullWidth label="Correo electrónico" name="correo" type="email" value={formData.correo} onChange={handleChange} margin="normal" required variant="outlined" autoComplete="email" />
            {direct && (
              <>
                <TextField fullWidth label="Contraseña" name="password" type="password" value={formData.password} onChange={handleChange} margin="normal" required variant="outlined" autoComplete="new-password" helperText="Entre 15 y 128 caracteres." />
                <TextField fullWidth label="Confirmar contraseña" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} margin="normal" required variant="outlined" autoComplete="new-password" />
              </>
            )}
            {config && !direct && available && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Te enviaremos un enlace para confirmar tu correo y elegir tu contraseña.
              </Typography>
            )}

            <Button fullWidth type="submit" variant="contained" color="primary" disabled={loading || !available} sx={{ mt: 3, mb: 2, py: 1.5 }}>
              {loading ? 'Registrando...' : (direct ? 'Registrarse' : 'Solicitar registro')}
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
