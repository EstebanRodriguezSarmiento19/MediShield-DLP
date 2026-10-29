import { useState } from 'react';
import { Alert, Box, Button, Link as MuiLink, Stack, TextField } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { PasswordField } from '../../shared/components/PasswordFields.jsx';
import { AuthLayout, FieldLabel } from '../../shared/components/auth/AuthLayout.jsx';

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
      eyebrow="Acceso seguro"
      title="Bienvenido de nuevo."
      subtitle="Ingresa para revisar las transferencias y alertas de tu organización."
    >
      {location.state?.registered && !error && (
        <Alert severity="success" sx={{ mb: 2.5 }}>
          {location.state.message || 'Cuenta creada. Ya puedes iniciar sesión.'}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2.5 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <FieldLabel htmlFor="login-correo">Correo de trabajo</FieldLabel>
        <TextField
          id="login-correo"
          fullWidth
          name="correo"
          type="email"
          placeholder="nombre@institucion.co"
          value={formData.correo}
          onChange={handleChange}
          required
          size="medium"
          autoComplete="email"
          inputProps={{ maxLength: 254 }}
        />

        <FieldLabel htmlFor="login-password">Contraseña</FieldLabel>
        <PasswordField
          id="login-password"
          fullWidth
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          size="medium"
          autoComplete="current-password"
        />

        <Button
          fullWidth
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={loading}
          endIcon={<ArrowForward />}
          sx={{ mt: 3.5, py: 1.4, fontSize: '0.98rem' }}
        >
          {loading ? 'Verificando credenciales...' : 'Entrar al centro de control'}
        </Button>
      </Box>

      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} sx={{ mt: 3 }}>
        <MuiLink
          component={Link}
          to="/forgot-password"
          variant="body2"
          underline="hover"
          sx={{ color: 'text.secondary', fontWeight: 500, '&:hover': { color: 'primary.main' } }}
        >
          ¿Olvidaste tu contraseña?
        </MuiLink>
        <MuiLink
          component={Link}
          to="/register"
          variant="body2"
          underline="none"
          sx={{ color: 'primary.main', fontWeight: 600 }}
        >
          Registrar usuario
        </MuiLink>
      </Stack>
    </AuthLayout>
  );
}
