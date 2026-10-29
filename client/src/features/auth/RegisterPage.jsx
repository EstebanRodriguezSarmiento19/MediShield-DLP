import { useEffect, useState } from 'react';
import { Alert, Box, Button, Link as MuiLink, Stack, TextField, Typography } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { PasswordField, PasswordRequirements } from '../../shared/components/PasswordFields.jsx';
import { AuthLayout, FieldLabel } from '../../shared/components/auth/AuthLayout.jsx';
import { isPasswordValid } from '../../shared/utils/passwordPolicy.js';
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
  const passwordMismatch = Boolean(formData.confirmPassword) && formData.confirmPassword !== formData.password;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    const nombre = formData.nombre.trim();
    const correo = formData.correo.trim();

    if (direct) {
      if (!isPasswordValid(formData.password)) {
        setError('La contraseña no cumple los requisitos. Revisa la lista de requisitos.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden.');
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
    <AuthLayout
      eyebrow="Registro seguro"
      title="Crea tu cuenta."
      subtitle="Registro en el laboratorio de protección de datos médicos."
    >
      {config && !available && (
        <Alert severity="warning" sx={{ mb: 2.5 }}>
          El registro público no está habilitado. Solicita una invitación a un administrador.
        </Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}
      {info && <Alert severity="success" sx={{ mb: 2.5 }}>{info}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <FieldLabel htmlFor="register-nombre">Nombre completo</FieldLabel>
        <TextField
          id="register-nombre"
          fullWidth
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
          autoComplete="name"
          inputProps={{ maxLength: 150 }}
        />

        <FieldLabel htmlFor="register-correo">Correo de trabajo</FieldLabel>
        <TextField
          id="register-correo"
          fullWidth
          name="correo"
          type="email"
          placeholder="nombre@institucion.co"
          value={formData.correo}
          onChange={handleChange}
          required
          autoComplete="email"
          inputProps={{ maxLength: 150 }}
        />

        {direct && (
          <>
            <FieldLabel htmlFor="register-password">Contraseña</FieldLabel>
            <PasswordField
              id="register-password"
              fullWidth
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
            <Box sx={{ mt: 1.5, p: 2, borderRadius: 3, border: (t) => `1px solid ${t.palette.divider}`, bgcolor: 'action.hover' }}>
              <PasswordRequirements password={formData.password} />
            </Box>

            <FieldLabel htmlFor="register-confirm">Confirmar contraseña</FieldLabel>
            <PasswordField
              id="register-confirm"
              fullWidth
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
              error={passwordMismatch}
              helperText={passwordMismatch ? 'Las contraseñas no coinciden.' : ' '}
            />
          </>
        )}

        {config && !direct && available && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2.5 }}>
            Te enviaremos un enlace para confirmar tu correo y elegir tu contraseña.
          </Typography>
        )}

        <Button
          fullWidth
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={loading || !available}
          endIcon={<ArrowForward />}
          sx={{ mt: 3.5, py: 1.4, fontSize: '0.98rem' }}
        >
          {loading ? 'Registrando...' : (direct ? 'Crear cuenta' : 'Solicitar registro')}
        </Button>
      </Box>

      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          ¿Ya tienes cuenta?{' '}
          <MuiLink component={Link} to="/login" underline="none" sx={{ color: 'primary.main', fontWeight: 600 }}>
            Inicia sesión aquí
          </MuiLink>
        </Typography>
      </Box>
    </AuthLayout>
  );
}
