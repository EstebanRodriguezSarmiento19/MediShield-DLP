import { useState } from 'react';
import { Alert, Box, Button, Divider, Link as MuiLink, Stack, TextField } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { PasswordField } from '../../shared/components/PasswordFields.jsx';
import { AuthLayout } from '../../shared/components/auth/AuthLayout.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    correo: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'correo') {
      // Máximo 254 caracteres.
      if (value.length > 254) return;

      // Solo permite caracteres habituales en un correo.
      if (!/^[a-zA-Z0-9._%+@-]*$/.test(value)) return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const correo = formData.correo.trim();

    // Validación básica adicional antes de enviar.
    if (
      correo.length > 254 ||
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(correo)
    ) {
      setError('Introduce un correo electrónico válido.');
      return;
    }

    setLoading(true);

    try {
      await login(correo, formData.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Credenciales inválidas o cuenta no registrada.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Portal de acceso"
      title="Iniciar sesión"
      subtitle="Usa tu correo institucional para acceder al monitoreo de transferencias."
    >
      {location.state?.registered && !error && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {location.state.message || 'Cuenta creada. Ya puedes iniciar sesión.'}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          id="login-correo"
          fullWidth
          margin="normal"
          label="Correo institucional"
          name="correo"
          type="email"
          value={formData.correo}
          onChange={handleChange}
          required
          autoComplete="email"
          inputProps={{ maxLength: 254 }}
        />

        <PasswordField
          id="login-password"
          fullWidth
          margin="normal"
          label="Contraseña"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          autoComplete="current-password"
        />

        <Button
          fullWidth
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          startIcon={<LockOutlined />}
          sx={{ mt: 3, py: 1.3 }}
        >
          {loading ? 'Verificando...' : 'Iniciar sesión'}
        </Button>
      </Box>

      <Stack spacing={2.5} alignItems="center" sx={{ mt: 3.5 }}>
        <MuiLink
          component={Link}
          to="/forgot-password"
          variant="body2"
          underline="hover"
          color="text.secondary"
        >
          ¿Olvidaste tu contraseña?
        </MuiLink>

        <Divider flexItem />

        <Button fullWidth variant="outlined" component={Link} to="/register">
          Crear una cuenta
        </Button>
      </Stack>
    </AuthLayout>
  );
}
