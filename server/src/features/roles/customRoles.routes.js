import { Router } from 'express';
import pool, { transaction } from '../../db/pool.js';
import { appendAudit } from '../audit/audit.service.js';
import { PERMISSIONS, isKnownPermission } from '../permissions/permissions.catalog.js';
import { object, text, version, fail } from '../../shared/validation.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';

/** Roles personalizados. Montado en /api/roles/custom; solo accesible para el rol administrador. */
const router = Router();
const idParam = req => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) fail('Rol inválido.');
  return id;
};

function parseRole(body) {
  object(body, ['name', 'description', 'permissions', 'version']);
  const name = text(body.name, 'Nombre del rol', 80);
  const description = body.description == null ? null : (text(body.description, 'Descripción', 255, false) || null);
  if (!Array.isArray(body.permissions) || body.permissions.length > PERMISSIONS.length) fail('Permisos inválidos.');
  const permissions = [...new Set(body.permissions)];
  if (permissions.length !== body.permissions.length || !permissions.every(isKnownPermission)) fail('Permisos inválidos.');
  return { name, description, permissions };
}

async function loadRoles() {
  const [rows] = await pool.execute(`SELECT r.id_rol AS id, r.nombre AS name, r.descripcion AS description, r.version,
      r.fecha_actualizacion AS updatedAt,
      (SELECT COUNT(*) FROM usuario u WHERE u.id_rol=r.id_rol) AS accounts
    FROM rol_personalizado r ORDER BY r.nombre`);
  const [grants] = await pool.execute('SELECT id_rol, permiso FROM rol_permiso ORDER BY permiso');
  const byRole = new Map();
  for (const grant of grants) {
    if (!byRole.has(grant.id_rol)) byRole.set(grant.id_rol, []);
    byRole.get(grant.id_rol).push(grant.permiso);
  }
  return rows.map(row => ({ ...row, accounts: Number(row.accounts), permissions: byRole.get(row.id) ?? [] }));
}

async function saveGrants(cx, id, permissions) {
  await cx.execute('DELETE FROM rol_permiso WHERE id_rol=?', [id]);
  for (const permiso of permissions) {
    await cx.execute('INSERT INTO rol_permiso(id_rol,permiso) VALUES (?,?)', [id, permiso]);
  }
}

router.get('/', asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await loadRoles() });
}));

router.get('/catalog', asyncHandler(async (_req, res) => {
  res.json({ success: true, data: PERMISSIONS });
}));

router.post('/', asyncHandler(async (req, res) => {
  const role = parseRole(req.body);
  let id;
  try {
    await transaction(async cx => {
      const [result] = await cx.execute(
        'INSERT INTO rol_personalizado(nombre,descripcion,creado_por) VALUES (?,?,?)',
        [role.name, role.description, req.user.id]
      );
      id = result.insertId;
      await saveGrants(cx, id, role.permissions);
      await appendAudit(cx, { actor: req.user.id, action: 'CUSTOM_ROLE_CREATED', resource: `rol:${id}`, ip: req.ip,
        details: { permissions: role.permissions } });
    });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') fail('Ya existe un rol con ese nombre.', 409);
    throw error;
  }
  res.status(201).json({ success: true, data: { id, message: 'Rol creado.' } });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const id = idParam(req);
  const role = parseRole(req.body);
  const expected = version(req.body.version);
  let permissionsChanged = false;
  try {
    await transaction(async cx => {
      const [[current]] = await cx.execute('SELECT id_rol FROM rol_personalizado WHERE id_rol=? FOR UPDATE', [id]);
      if (!current) fail('Rol no encontrado.', 404);
      const [previous] = await cx.execute('SELECT permiso FROM rol_permiso WHERE id_rol=? ORDER BY permiso', [id]);
      const before = previous.map(row => row.permiso);
      const after = [...role.permissions].sort();
      permissionsChanged = before.length !== after.length || before.some((key, index) => key !== after[index]);
      const [result] = await cx.execute(
        'UPDATE rol_personalizado SET nombre=?,descripcion=?,version=version+1 WHERE id_rol=? AND version=?',
        [role.name, role.description, id, expected]
      );
      if (!result.affectedRows) fail('El rol cambió o no existe. Actualiza la lista.', 409);
      await saveGrants(cx, id, role.permissions);
      if (permissionsChanged) {
        // Los permisos efectivos cambian para todas sus cuentas: se cierran sus sesiones.
        await cx.execute('DELETE s FROM sesion_web s JOIN usuario u ON u.id_usuario=s.id_usuario WHERE u.id_rol=?', [id]);
      }
      await appendAudit(cx, { actor: req.user.id, action: 'CUSTOM_ROLE_UPDATED', resource: `rol:${id}`, ip: req.ip,
        details: { permissionsChanged, from: before, to: after, sessionsRevoked: permissionsChanged } });
    });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') fail('Ya existe un rol con ese nombre.', 409);
    throw error;
  }
  res.json({ success: true, data: { message: permissionsChanged
    ? 'Rol actualizado. Se cerraron las sesiones de sus cuentas.'
    : 'Rol actualizado.' } });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = idParam(req);
  await transaction(async cx => {
    const [[current]] = await cx.execute('SELECT nombre FROM rol_personalizado WHERE id_rol=? FOR UPDATE', [id]);
    if (!current) fail('Rol no encontrado.', 404);
    const [[count]] = await cx.execute('SELECT COUNT(*) AS total FROM usuario WHERE id_rol=?', [id]);
    if (Number(count.total) > 0) {
      fail(`Hay ${count.total} cuenta(s) con este rol. Reasígnalas antes de eliminarlo.`, 409);
    }
    await cx.execute('DELETE FROM rol_personalizado WHERE id_rol=?', [id]);
    await appendAudit(cx, { actor: req.user.id, action: 'CUSTOM_ROLE_DELETED', resource: `rol:${id}`, ip: req.ip,
      details: { name: current.nombre } });
  });
  res.json({ success: true, data: { message: 'Rol eliminado.' } });
}));

export default router;
