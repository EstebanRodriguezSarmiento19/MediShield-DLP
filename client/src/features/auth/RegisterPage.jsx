import { useEffect, useState } from 'react';
import { Alert, Box, Button, Divider, Stack, TextField, Typography } from '@mui/material';
import { PersonAddAlt } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { PasswordField, PasswordRequirements } from '../../shared/components/PasswordFields.jsx';
import { AuthLayout } from '../../shared/components/auth/AuthLayout.jsx';
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
      eyebrow="Registro"
      title="Crear cuenta"
      subtitle="Alta de usuario para el laboratorio de protección de datos médicos."
    >
      {config && !available && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          El registro público no está habilitado. Solicita una invitación a un administrador.
        </Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {info && <Alert severity="success" sx={{ mb: 2 }}>{info}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          margin="normal"
          label="Nombre completo"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
          autoComplete="name"
          inputProps={{ maxLength: 150 }}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Correo institucional"
          name="correo"
          type="email"
          value={formData.correo}
          onChange={handleChange}
          required
          autoComplete="email"
          inputProps={{ maxLength: 150 }}
        />

        {direct && (
          <>
            <PasswordField
              fullWidth
              margin="normal"
              label="Contraseña"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
            <Box sx={{ mt: 1, p: 2, borderRadius: 2.5, border: (t) => `1px solid ${t.palette.divider}` }}>
              <PasswordRequirements password={formData.password} />
            </Box>

            <PasswordField
              fullWidth
              margin="normal"
              label="Confirmar contraseña"
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
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Te enviaremos un enlace para confirmar tu correo y elegir tu contraseña.
          </Typography>
        )}

        <Button
          fullWidth
          type="submit"
          variant="contained"
          size="large"
          disabled={loading || !available}
          startIcon={<PersonAddAlt />}
          sx={{ mt: 3, py: 1.3 }}
        >
          {loading ? 'Registrando...' : (direct ? 'Crear cuenta' : 'Solicitar registro')}
        </Button>
      </Box>

      <Stack spacing={2.5} alignItems="center" sx={{ mt: 3.5 }}>
        <Divider flexItem />
        <Button fullWidth variant="outlined" component={Link} to="/login">
          Ya tengo una cuenta
        </Button>
      </Stack>
    </AuthLayout>
  );
}
