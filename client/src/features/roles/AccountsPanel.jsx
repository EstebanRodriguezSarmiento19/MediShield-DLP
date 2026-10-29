import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Checkbox,
  Chip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { Search } from '@mui/icons-material';
import api from '../../shared/services/api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { roleName } from '../../shared/utils/roles.js';

const blank = { name: '', email: '', role: 'usuario', customRoleId: '', canManageUsers: false };

// Cambiar el rol base: el administrador no usa roles personalizados ni marca de gestión separada.
function withBaseRole(current, role) {
  return {
    role,
    customRoleId: role === 'admin' ? '' : current.customRoleId,
    canManageUsers: role === 'admin' ? true : current.role === 'admin' ? false : current.canManageUsers
  };
}

// Valores del formulario → cuerpo de la API.
function toPayload(form) {
  const admin = form.role === 'admin';
  return {
    name: form.name.trim(),
    email: form.email.trim(),
    role: form.role,
    canManageUsers: admin ? false : Boolean(form.canManageUsers),
    customRoleId: admin || form.customRoleId === '' ? null : Number(form.customRoleId)
  };
}

function RoleFields({ value, onChange, customRoles, self, grantedByRole }) {
  const admin = value.role === 'admin';
  return (
    <Stack spacing={2}>
      <TextField
        select
        fullWidth
        label="Rol base"
        value={value.role}
        onChange={(event) => onChange(withBaseRole(value, event.target.value))}
        disabled={self}
        helperText={self ? 'No puedes cambiar tu propio rol.' : 'Define los permisos por defecto de la cuenta.'}
      >
        {Object.entries(roleName).map(([key, label]) => (
          <MenuItem key={key} value={key}>{label}</MenuItem>
        ))}
      </TextField>

      <TextField
        select
        fullWidth
        label="Rol personalizado"
        value={admin ? '' : value.customRoleId}
        onChange={(event) => onChange({ customRoleId: event.target.value })}
        disabled={self || admin}
        helperText={admin ? 'Los administradores tienen acceso completo.' : 'Opcional. Sustituye los permisos del rol base.'}
      >
        <MenuItem value="">Ninguno</MenuItem>
        {customRoles.map((role) => (
          <MenuItem key={role.id} value={String(role.id)}>{role.name}</MenuItem>
        ))}
      </TextField>

      <Box>
        <FormControlLabel
          control={
            <Checkbox
              checked={admin || value.canManageUsers}
              disabled={admin || self}
              onChange={(event) => onChange({ canManageUsers: event.target.checked })}
            />
          }
          label="Puede gestionar cuentas (invitar y editar)"
        />
        {grantedByRole && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 3.5 }}>
            Esta cuenta ya gestiona cuentas por su rol personalizado.
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

export default function AccountsPanel() {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [customRoles, setCustomRoles] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const isSelf = editing?.id === user.id;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (roleFilter) params.set('role', roleFilter);
    try {
      const result = await api.get(`/roles${params.size ? `?${params}` : ''}`);
      setItems(result.data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    api.get('/roles/custom')
      .then((result) => setCustomRoles(result.data))
      .catch((err) => setError(err.message));
  }, []);

  const updateForm = (patch) => setForm((current) => ({ ...current, ...patch }));

  function openEdit(account) {
    setEditing(account);
    setForm({
      name: account.name,
      email: account.email,
      role: account.role,
      customRoleId: account.customRoleId ? String(account.customRoleId) : '',
      canManageUsers: Boolean(account.managerFlag)
    });
    setError('');
    setNotice('');
  }

  function closeEdit() {
    setEditing(null);
    setForm(blank);
  }

  async function run(action) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await action();
      setNotice(response?.data?.message || 'Cambio guardado correctamente.');
      await load();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function create(event) {
    event.preventDefault();
    const ok = await run(() => api.post('/users', toPayload(form)));
    if (ok) setForm(blank);
  }

  async function save(event) {
    event.preventDefault();
    if (!editing) return;
    const ok = await run(() => api.patch(`/users/${editing.id}`, toPayload(form)));
    if (ok) closeEdit();
  }

  async function deactivate(account) {
    if (!window.confirm(`¿Desactivar la cuenta de ${account.name}? Se cerrarán sus sesiones y se conservará el historial de auditoría.`)) return;
    await run(() => api.delete(`/users/${account.id}`));
  }

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}
      {notice && <Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert>}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            fullWidth
            label="Buscar por nombre o correo"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            inputProps={{ maxLength: 100 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          />
          <TextField select label="Filtrar por rol base" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} sx={{ minWidth: 220 }}>
            <MenuItem value="">Todos los roles</MenuItem>
            {Object.entries(roleName).map(([value, label]) => (
              <MenuItem key={value} value={value}>{label}</MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      <Paper variant="outlined" component="form" onSubmit={create} sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h2">Nueva cuenta</Typography>
            <Typography color="text.secondary" variant="body2">Crea una cuenta mediante una invitación privada.</Typography>
          </Box>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label="Nombre" value={form.name} onChange={(event) => updateForm({ name: event.target.value })} inputProps={{ maxLength: 150 }} required fullWidth />
            <TextField label="Correo real" type="email" value={form.email} onChange={(event) => updateForm({ email: event.target.value })} inputProps={{ maxLength: 150 }} required fullWidth />
          </Stack>
          <RoleFields value={form} onChange={updateForm} customRoles={customRoles} />
          <Button type="submit" variant="contained" disabled={busy} sx={{ alignSelf: 'flex-start' }}>
            Crear y enviar invitación
          </Button>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              {['Nombre', 'Correo', 'Rol', 'Gestión de cuentas', 'Estado', 'Acciones'].map((label) => (
                <TableCell key={label}>{label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((account) => (
              <TableRow key={account.id} hover>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <span>{account.name}</span>
                    {account.id === user.id && <Chip size="small" label="Tú" />}
                  </Stack>
                </TableCell>
                <TableCell>{account.email}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    <Chip size="small" variant="outlined" label={roleName[account.role]} />
                    {account.customRoleName && <Chip size="small" color="secondary" label={account.customRoleName} />}
                  </Stack>
                </TableCell>
                <TableCell>{account.canManageUsers ? 'Sí' : 'No'}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    color={account.status === 'activo' ? 'success' : 'default'}
                    label={account.status === 'activo' ? 'Activa' : 'Desactivada'}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {account.status === 'activo' ? (
                      <>
                        <Button size="small" onClick={() => openEdit(account)} disabled={busy}>Editar</Button>
                        {account.id !== user.id && (
                          <>
                            <Button size="small" onClick={() => run(() => api.post(`/users/${account.id}/invite`, {}))} disabled={busy}>
                              Reenviar invitación
                            </Button>
                            <Button size="small" color="error" onClick={() => deactivate(account)} disabled={busy}>Desactivar</Button>
                          </>
                        )}
                      </>
                    ) : (
                      <Button size="small" onClick={() => run(() => api.post(`/users/${account.id}/reactivate`, {}))} disabled={busy}>
                        Reactivar e invitar
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!loading && !items.length && (
              <TableRow>
                <TableCell colSpan={6} align="center">No hay usuarios que coincidan con la búsqueda.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Alert severity="info">
        Desactivar una cuenta impide el acceso de inmediato. Su registro se conserva porque las transferencias y la auditoría deben seguir vinculadas a quien las realizó.
      </Alert>

      <Dialog open={Boolean(editing)} onClose={closeEdit} fullWidth maxWidth="sm">
        <Stack component="form" onSubmit={save}>
          <DialogTitle>Editar cuenta</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <TextField label="Nombre" value={form.name} onChange={(event) => updateForm({ name: event.target.value })} inputProps={{ maxLength: 150 }} required />
              <TextField label="Correo" type="email" value={form.email} onChange={(event) => updateForm({ email: event.target.value })} inputProps={{ maxLength: 150 }} required />
              <RoleFields
                value={form}
                onChange={updateForm}
                customRoles={customRoles}
                self={isSelf}
                grantedByRole={Boolean(editing?.canManageUsers && !editing?.managerFlag && editing?.role !== 'admin')}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeEdit}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={busy}>Guardar cambios</Button>
          </DialogActions>
        </Stack>
      </Dialog>
    </Stack>
  );
}
