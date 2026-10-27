
import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link as MuiLink,
  Alert
} from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    correo: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.correo.trim(), formData.password);

      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err.message || 'Credenciales inválidas o cuenta no registrada.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        bgcolor: 'background.default'
      }}
    >
      <Card sx={{ maxWidth: 420, width: '100%', p: 2 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2.5
            }}
          >
            <SecurityIcon
              sx={{ color: 'primary.main', mr: 1, fontSize: 30 }}
            />

            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 800,
                background:
                  'linear-gradient(90deg, #00E5FF 0%, #2979FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              MediShield DLP
            </Typography>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3, textAlign: 'center' }}
          >
            Acceso al laboratorio de protección de datos médicos.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Correo electrónico"
              name="correo"
              type="email"
              value={formData.correo}
              onChange={handleChange}
              margin="normal"
              required
              size="small"
              autoComplete="email"
            />

            <TextField
              fullWidth
              label="Contraseña"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              size="small"
              autoComplete="current-password"
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.2 }}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </form>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              alignItems: 'center',
              mt: 2
            }}
          >
            <MuiLink
              component={Link}
              to="/forgot-password"
              variant="body2"
              color="primary"
              sx={{ fontWeight: 600, textDecoration: 'none' }}
            >
              ¿Olvidaste tu contraseña?
            </MuiLink>

            <Typography variant="body2" color="text.secondary">
              ¿No tienes cuenta?{' '}
              <MuiLink
                component={Link}
                to="/register"
                color="primary"
                sx={{ fontWeight: 600, textDecoration: 'none' }}
              >
                Regístrate
              </MuiLink>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
