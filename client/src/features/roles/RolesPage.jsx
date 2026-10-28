import { useCallback, useEffect, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
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

import SearchIconModule from '@mui/icons-material/Search';

import icon from '../../shared/utils/icon.js';
import api from '../../shared/services/api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { roleName } from '../../shared/utils/roles.js';

const SearchIcon = icon(SearchIconModule);

const blank = {
  name: '',
  email: '',
  role: 'usuario',
  canManageUsers: false
};

export default function RolesPage() {
  const { user } = useAuth();

  const [items, setItems] = useState([]);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);

  const isSelf = editing?.id === user.id;

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);

    const params = new URLSearchParams();

    if (search.trim()) {
      params.set('search', search.trim());
    }

    if (roleFilter) {
      params.set('role', roleFilter);
    }

    try {
      const result = await api.get(
        `/roles${params.size ? `?${params}` : ''}`
      );

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

  function change(field, value) {
    setForm(current => ({
      ...current,
      [field]: value
    }));
  }

  // Al pasar de administrador a otro rol no se conserva el permiso de gestión de cuentas.
  function changeRole(value) {
    setForm(current => ({
      ...current,
      role: value,
      canManageUsers: value === 'admin'
        ? true
        : editing?.role === 'admin' ? false : current.canManageUsers
    }));
  }

  function openEdit(account) {
    setEditing(account);

    setForm({
      name: account.name,
      email: account.email,
      role: account.role,
      canManageUsers: account.canManageUsers
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

      setNotice(
        response?.data?.message || 'Cambio guardado correctamente.'
      );

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

    const ok = await run(() =>
      api.post('/users', form)
    );

    if (ok) {
      setForm(blank);
    }
  }

  async function save(event) {
    event.preventDefault();

    if (!editing) {
      return;
    }

    const data = {
      name: form.name,
      email: form.email,
      role: form.role,
      canManageUsers: form.canManageUsers
    };

    const ok = await run(() =>
      api.patch(`/users/${editing.id}`, data)
    );

    if (ok) {
      closeEdit();
    }
  }

  async function deactivate(account) {
    if (
      !window.confirm(
        `¿Desactivar la cuenta de ${account.name}? Se cerrarán sus sesiones y se conservará el historial de auditoría.`
      )
    ) {
      return;
    }

    await run(() =>
      api.delete(`/users/${account.id}`)
    );
  }

  return (
    <Stack spacing={3}>

      {/* ENCABEZADO */}
      <Box>
        <Typography variant="h1">
          Administrar roles
        </Typography>

        <Typography color="text.secondary">
          Administra las cuentas, permisos y estados de los usuarios del sistema.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error">
          {error}
        </Alert>
      )}

      {notice && (
        <Alert severity="success">
          {notice}
        </Alert>
      )}

      {/* BUSQUEDA Y FILTROS */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
        >

          <TextField
            label="Buscar por nombre o correo"
            value={search}
            onChange={event => setSearch(event.target.value)}
            fullWidth
            inputProps={{ maxLength: 100 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />

          <TextField
            select
            label="Filtrar por rol"
            value={roleFilter}
            onChange={event => setRoleFilter(event.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">
              Todos los roles
            </MenuItem>

            {Object.entries(roleName).map(
              ([value, label]) => (
                <MenuItem
                  key={value}
                  value={value}
                >
                  {label}
                </MenuItem>
              )
            )}
          </TextField>

        </Stack>
      </Paper>

      {/* NUEVA CUENTA */}
      <Paper
        variant="outlined"
        sx={{ p: 3 }}
      >
        <Stack
          component="form"
          onSubmit={create}
          spacing={2}
        >

          <Typography variant="h2">
            Nueva cuenta
          </Typography>

          <Typography
            color="text.secondary"
            variant="body2"
          >
            Crea una cuenta mediante una invitación privada.
          </Typography>

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
          >

            <TextField
              label="Nombre"
              value={form.name}
              onChange={event =>
                change('name', event.target.value)
              }
              inputProps={{ maxLength: 150 }}
              required
              fullWidth
            />

            <TextField
              label="Correo real"
              type="email"
              value={form.email}
              onChange={event =>
                change('email', event.target.value)
              }
              inputProps={{ maxLength: 150 }}
              required
              fullWidth
            />

            <TextField
              select
              label="Rol"
              value={form.role}
              onChange={event =>
                change('role', event.target.value)
              }
              fullWidth
            >
              {Object.entries(roleName).map(
                ([value, label]) => (
                  <MenuItem
                    key={value}
                    value={value}
                  >
                    {label}
                  </MenuItem>
                )
              )}
            </TextField>

          </Stack>

          <FormControlLabel
            control={
              <Checkbox
                checked={
                  form.role === 'admin' ||
                  form.canManageUsers
                }
                disabled={form.role === 'admin'}
                onChange={event =>
                  change(
                    'canManageUsers',
                    event.target.checked
                  )
                }
              />
            }
            label="Puede gestionar cuentas y permisos"
          />

          <Button
            type="submit"
            variant="contained"
            disabled={busy}
            sx={{ alignSelf: 'flex-start' }}
          >
            Crear y enviar invitación
          </Button>

        </Stack>
      </Paper>

      {/* TABLA DE CUENTAS */}
      <Paper
        variant="outlined"
        sx={{ overflowX: 'auto' }}
      >

        <Table>

          <TableHead>
            <TableRow>
              {[
                'Nombre',
                'Correo',
                'Rol',
                'Gestión de cuentas',
                'Estado',
                'Acciones'
              ].map(label => (
                <TableCell key={label}>
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>

            {items.map(account => (
              <TableRow key={account.id}>

                <TableCell>
                  {account.name}

                  {account.id === user.id && (
                    <Chip
                      size="small"
                      label="Tú"
                      sx={{ ml: 1 }}
                    />
                  )}
                </TableCell>

                <TableCell>
                  {account.email}
                </TableCell>

                <TableCell>
                  {roleName[account.role]}
                </TableCell>

                <TableCell>
                  {account.canManageUsers
                    ? 'Sí'
                    : 'No'}
                </TableCell>

                <TableCell>
                  <Chip
                    size="small"
                    color={
                      account.status === 'activo'
                        ? 'success'
                        : 'default'
                    }
                    label={
                      account.status === 'activo'
                        ? 'Activa'
                        : 'Desactivada'
                    }
                  />
                </TableCell>

                <TableCell>

                  <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                  >

                    {account.status === 'activo' ? (
                      <>
                        <Button
                          size="small"
                          onClick={() =>
                            openEdit(account)
                          }
                          disabled={busy}
                        >
                          Editar
                        </Button>

                        {account.id !== user.id && (
                          <>
                            <Button
                              size="small"
                              onClick={() =>
                                run(() =>
                                  api.post(
                                    `/users/${account.id}/invite`,
                                    {}
                                  )
                                )
                              }
                              disabled={busy}
                            >
                              Reenviar invitación
                            </Button>

                            <Button
                              size="small"
                              color="error"
                              onClick={() =>
                                deactivate(account)
                              }
                              disabled={busy}
                            >
                              Desactivar
                            </Button>
                          </>
                        )}
                      </>
                    ) : (
                      <Button
                        size="small"
                        onClick={() =>
                          run(() =>
                            api.post(
                              `/users/${account.id}/reactivate`,
                              {}
                            )
                          )
                        }
                        disabled={busy}
                      >
                        Reactivar e invitar
                      </Button>
                    )}

                  </Stack>

                </TableCell>

              </TableRow>
            ))}

            {!loading && !items.length && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align="center"
                >
                  No hay usuarios que coincidan con la búsqueda.
                </TableCell>
              </TableRow>
            )}

          </TableBody>

        </Table>

      </Paper>

      <Alert severity="info">
        Desactivar una cuenta impide el acceso de inmediato.
        Su registro se conserva porque las transferencias y la
        auditoría deben seguir vinculadas a quien las realizó.
      </Alert>

      {/* EDITAR CUENTA */}
      <Dialog
        open={Boolean(editing)}
        onClose={closeEdit}
        fullWidth
        maxWidth="sm"
      >

        <Stack
          component="form"
          onSubmit={save}
        >

          <DialogTitle>
            Editar cuenta
          </DialogTitle>

          <DialogContent>

            <Stack
              spacing={2}
              sx={{ pt: 1 }}
            >

              <TextField
                label="Nombre"
                value={form.name}
                onChange={event =>
                  change(
                    'name',
                    event.target.value
                  )
                }
                inputProps={{ maxLength: 150 }}
                required
              />

              <TextField
                label="Correo"
                type="email"
                value={form.email}
                onChange={event =>
                  change(
                    'email',
                    event.target.value
                  )
                }
                inputProps={{ maxLength: 150 }}
                required
              />

              <TextField
                select
                label="Rol"
                value={form.role}
                onChange={event =>
                  changeRole(event.target.value)
                }
                disabled={isSelf}
                helperText={
                  isSelf
                    ? 'No puedes cambiar tu propio rol.'
                    : 'Define los permisos de la cuenta.'
                }
              >
                {Object.entries(roleName).map(
                  ([value, label]) => (
                    <MenuItem
                      key={value}
                      value={value}
                    >
                      {label}
                    </MenuItem>
                  )
                )}
              </TextField>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={
                      form.role === 'admin' ||
                      form.canManageUsers
                    }
                    disabled={
                      form.role === 'admin'
                    }
                    onChange={event =>
                      change(
                        'canManageUsers',
                        event.target.checked
                      )
                    }
                  />
                }
                label="Puede gestionar cuentas y permisos"
              />

            </Stack>

          </DialogContent>

          <DialogActions>

            <Button
              onClick={closeEdit}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={busy}
            >
              Guardar cambios
            </Button>

          </DialogActions>

        </Stack>

      </Dialog>

    </Stack>
  );
}