import { useCallback, useEffect, useMemo, useState } from 'react';
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
  Divider,
  FormControlLabel,
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
import { Add, DeleteOutline, Edit } from '@mui/icons-material';
import api from '../../shared/services/api.js';

const emptyDraft = { id: null, version: 0, name: '', description: '', permissions: [] };

/** Definición de roles personalizados con matriz de permisos agrupada por módulo. */
export default function CustomRolesPanel() {
  const [roles, setRoles] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dialogError, setDialogError] = useState('');

  const load = useCallback(async () => {
    try {
      const [rolesResult, catalogResult] = await Promise.all([
        api.get('/roles/custom'),
        api.get('/roles/custom/catalog')
      ]);
      setRoles(rolesResult.data);
      setCatalog(catalogResult.data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const modules = useMemo(() => {
    const groups = new Map();
    for (const permission of catalog) {
      if (!groups.has(permission.module)) groups.set(permission.module, []);
      groups.get(permission.module).push(permission);
    }
    return [...groups.entries()];
  }, [catalog]);

  const current = draft ?? emptyDraft;

  function openCreate() {
    setDialogError('');
    setDraft(emptyDraft);
  }

  function openEdit(role) {
    setDialogError('');
    setDraft({
      id: role.id,
      version: role.version,
      name: role.name,
      description: role.description ?? '',
      permissions: role.permissions
    });
  }

  function close() {
    setDraft(null);
    setDialogError('');
  }

  function patch(changes) {
    setDraft((previous) => ({ ...(previous ?? emptyDraft), ...changes }));
  }

  function togglePermission(key) {
    setDraft((previous) => {
      const base = previous ?? emptyDraft;
      const granted = base.permissions.includes(key);
      return {
        ...base,
        permissions: granted ? base.permissions.filter((item) => item !== key) : [...base.permissions, key]
      };
    });
  }

  function toggleModule(keys, checked) {
    setDraft((previous) => {
      const base = previous ?? emptyDraft;
      const rest = base.permissions.filter((item) => !keys.includes(item));
      return { ...base, permissions: checked ? [...rest, ...keys] : rest };
    });
  }

  async function save(event) {
    event.preventDefault();
    if (!draft) return;

    setBusy(true);
    setDialogError('');
    setNotice('');
    setError('');

    const body = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      permissions: draft.permissions
    };

    try {
      if (draft.id === null) {
        await api.post('/roles/custom', body);
        setNotice('Rol creado.');
      } else {
        const response = await api.patch(`/roles/custom/${draft.id}`, { ...body, version: draft.version });
        setNotice(response.data.message);
      }
      close();
      await load();
    } catch (err) {
      setDialogError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(role) {
    if (!window.confirm(`¿Eliminar el rol «${role.name}»? Esta acción no se puede deshacer.`)) return;
    setError('');
    setNotice('');
    try {
      await api.delete(`/roles/custom/${role.id}`);
      setNotice('Rol eliminado.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}
      {notice && <Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert>}

      <Alert severity="info">
        Un rol personalizado sustituye los permisos del rol base en las cuentas asignadas. Los administradores conservan siempre acceso completo, y la administración de roles no puede delegarse.
      </Alert>

      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Typography variant="body2" color="text.secondary">
          {roles.length} rol(es) personalizado(s)
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
          Nuevo rol
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              {['Nombre', 'Descripción', 'Permisos', 'Cuentas', 'Acciones'].map((label) => (
                <TableCell key={label}>{label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{role.name}</TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">{role.description || '—'}</Typography>
                </TableCell>
                <TableCell>
                  <Chip size="small" variant="outlined" label={`${role.permissions.length} de ${catalog.length}`} />
                </TableCell>
                <TableCell>{role.accounts}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button size="small" startIcon={<Edit fontSize="small" />} onClick={() => openEdit(role)}>
                      Editar
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteOutline fontSize="small" />}
                      onClick={() => remove(role)}
                      disabled={role.accounts > 0}
                      title={role.accounts > 0 ? 'Reasigna sus cuentas antes de eliminarlo' : undefined}
                    >
                      Eliminar
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!loading && !roles.length && (
              <TableRow>
                <TableCell colSpan={5} align="center">Todavía no hay roles personalizados.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={Boolean(draft)} onClose={close} fullWidth maxWidth="md">
        <Stack component="form" onSubmit={save}>
          <DialogTitle>{current.id === null ? 'Nuevo rol' : 'Editar rol'}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5}>
              {dialogError && <Alert severity="error">{dialogError}</Alert>}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Nombre"
                  value={current.name}
                  onChange={(event) => patch({ name: event.target.value })}
                  inputProps={{ maxLength: 80 }}
                  required
                  fullWidth
                />
                <TextField
                  label="Descripción"
                  value={current.description}
                  onChange={(event) => patch({ description: event.target.value })}
                  inputProps={{ maxLength: 255 }}
                  fullWidth
                />
              </Stack>

              {modules.map(([moduleName, permissions]) => {
                const keys = permissions.map((permission) => permission.key);
                const selected = keys.filter((key) => current.permissions.includes(key)).length;
                return (
                  <Box key={moduleName}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2">{moduleName}</Typography>
                      <FormControlLabel
                        label={<Typography variant="caption" color="text.secondary">Todos</Typography>}
                        control={
                          <Checkbox
                            size="small"
                            checked={selected === keys.length}
                            indeterminate={selected > 0 && selected < keys.length}
                            onChange={(event) => toggleModule(keys, event.target.checked)}
                          />
                        }
                      />
                    </Stack>
                    <Stack spacing={0.25} sx={{ pl: 0.5 }}>
                      {permissions.map((permission) => (
                        <FormControlLabel
                          key={permission.key}
                          control={
                            <Checkbox
                              size="small"
                              checked={current.permissions.includes(permission.key)}
                              onChange={() => togglePermission(permission.key)}
                            />
                          }
                          label={<Typography variant="body2">{permission.label}</Typography>}
                        />
                      ))}
                    </Stack>
                    <Divider sx={{ mt: 1.5 }} />
                  </Box>
                );
              })}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={close}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={busy || !current.name.trim()}>
              Guardar rol
            </Button>
          </DialogActions>
        </Stack>
      </Dialog>
    </Stack>
  );
}
