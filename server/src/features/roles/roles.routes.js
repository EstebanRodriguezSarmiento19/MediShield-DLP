import { Router } from 'express';
import crypto from 'node:crypto';
import env from '../../config/env.js';
import pool, { transaction } from '../../db/pool.js';
import { roles } from '../auth/auth.js';
import { invalidateRecovery } from '../auth/recovery.js';
import { appendAudit } from '../audit/audit.service.js';
import { object, fail } from '../../shared/validation.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';

/**
 * Administración de roles y permisos.
 * Solo el rol «admin» puede entrar aquí (no basta con ser gestor de cuentas).
 */
const ROLES = ['admin', 'analista', 'usuario'];
const router = Router();
const emailHash = value => crypto.createHmac('sha256', env.auditKey).update(value).digest('hex');
const accountQuery = `SELECT u.id_usuario AS id,u.nombre AS name,u.correo AS email,u.rol AS role,
  u.estado AS status,u.fecha_creacion AS createdAt,
  (u.rol='admin' OR EXISTS(SELECT 1 FROM gestor_usuarios g WHERE g.id_usuario=u.id_usuario)) AS canManageUsers
  FROM usuario u`;
const escapeLike = value => value.replace(/[\\%_]/g, '\\$&');

router.use(roles('admin'));

router.get('/', asyncHandler(async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const role = typeof req.query.role === 'string' ? req.query.role : '';
  if (search.length > 100) fail('La búsqueda es demasiado larga.');
  if (role && !ROLES.includes(role)) fail('Rol inválido.');
  const where = [], params = [];
  if (search) {
    where.push('(u.nombre LIKE ? OR u.correo LIKE ?)');
    const like = `%${escapeLike(search)}%`;
    params.push(like, like);
  }
  if (role) { where.push('u.rol=?'); params.push(role); }
  const [rows] = await pool.execute(
    `${accountQuery}${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY u.nombre, u.id_usuario LIMIT 500`, params);
  res.json({ success: true, data: rows.map(r => ({ ...r, canManageUsers: Boolean(r.canManageUsers) })) });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  object(req.body, ['role', 'canManageUsers']);
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) fail('Cuenta inválida.');
  const { role, canManageUsers } = req.body;
  if (!ROLES.includes(role)) fail('Rol inválido.');
  if (typeof canManageUsers !== 'boolean') fail('Permiso de gestión inválido.');
  if (id === req.user.id) fail('No puedes cambiar tu propio rol o permisos.', 403);
  await transaction(async cx => {
    const [[target]] = await cx.execute(`${accountQuery} WHERE u.id_usuario=? FOR UPDATE`, [id]);
    if (!target) fail('Cuenta no encontrada.', 404);
    if (target.status !== 'activo') fail('La cuenta está desactivada.', 409);
    const manager = role !== 'admin' && canManageUsers;
    const changed = role !== target.role || manager !== (target.role !== 'admin' && Boolean(target.canManageUsers));
    if (!changed) fail('No hay cambios.', 409);
    if (target.role === 'admin' && role !== 'admin') {
      const [[row]] = await cx.execute("SELECT COUNT(*) AS total FROM usuario WHERE rol='admin' AND estado='activo'");
      if (row.total <= 1) fail('Debe permanecer al menos un administrador activo.', 409);
    }
    await cx.execute('UPDATE usuario SET rol=? WHERE id_usuario=?', [role, id]);
    if (manager) await cx.execute('INSERT IGNORE INTO gestor_usuarios(id_usuario,concedido_por) VALUES (?,?)', [id, req.user.id]);
    else await cx.execute('DELETE FROM gestor_usuarios WHERE id_usuario=?', [id]);
    await cx.execute('DELETE FROM sesion_web WHERE id_usuario=?', [id]);
    await invalidateRecovery(cx, id);
    await appendAudit(cx, { actor: req.user.id, action: 'ROLE_CHANGED', resource: `usuario:${id}`, ip: req.ip,
      details: { emailHash: emailHash(target.email), fromRole: target.role, toRole: role, canManage: manager, sessionsRevoked: true } });
  });
  res.json({ success: true, data: { message: 'Rol actualizado. Se cerraron las sesiones de esa cuenta.' } });
}));

export default router;
