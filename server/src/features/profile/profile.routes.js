import { Router } from 'express';
import pool, { transaction } from '../../db/pool.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { appendAudit } from '../audit/audit.service.js';
import { object, email, text, fail } from '../../shared/validation.js';
import { validatePassword } from '../../shared/passwordPolicy.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';

/** Perfil propio: disponible para cualquier usuario autenticado. */
const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const [[row]] = await pool.execute('SELECT fecha_creacion AS createdAt FROM usuario WHERE id_usuario=?', [req.user.id]);
  res.json({ success: true, data: { ...req.user, createdAt: row?.createdAt ?? null } });
}));

router.patch('/', asyncHandler(async (req, res) => {
  object(req.body, ['name', 'email', 'currentPassword']);
  const name = text(req.body.name, 'Nombre', 150);
  const address = req.body.email === undefined ? req.user.email : email(req.body.email);
  const emailChanged = address !== req.user.email;
  if (emailChanged && (typeof req.body.currentPassword !== 'string' || req.body.currentPassword.length < 1)) {
    fail('Confirma tu contraseña actual para cambiar el correo.');
  }
  if (name.length < 2) fail('Nombre: debe tener al menos 2 caracteres.');
  if (emailChanged) {
    const [[row]] = await pool.execute('SELECT clave_hash FROM usuario WHERE id_usuario=?', [req.user.id]);
    if (!await verifyPassword(req.body.currentPassword, row?.clave_hash)) {
      fail('La contraseña actual no es correcta.', 403);
    }
  }
  try {
    await transaction(async cx => {
      await cx.execute('UPDATE usuario SET nombre=?,correo=? WHERE id_usuario=?', [name, address, req.user.id]);
      if (emailChanged) {
        await cx.execute('DELETE FROM sesion_web WHERE id_usuario=? AND sesion_hash<>?', [req.user.id, req.session.sesion_hash]);
      }
      await appendAudit(cx, {
        actor: req.user.id,
        action: emailChanged ? 'PROFILE_EMAIL_UPDATED' : 'PROFILE_UPDATED',
        resource: `usuario:${req.user.id}`,
        ip: req.ip,
        details: { emailChanged }
      });
    });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') fail('Ya existe una cuenta con ese correo.', 409);
    throw error;
  }
  res.json({ success: true, data: { ...req.user, name, email: address } });
}));

router.post('/password', asyncHandler(async (req, res) => {
  object(req.body, ['currentPassword', 'newPassword']);
  const { currentPassword, newPassword } = req.body;
  if (typeof currentPassword !== 'string' || currentPassword.length < 1 || currentPassword.length > 128) fail('Contraseña actual inválida.');
  validatePassword(newPassword);
  if (newPassword === currentPassword) fail('La nueva contraseña debe ser distinta de la actual.');
  const [[row]] = await pool.execute('SELECT clave_hash FROM usuario WHERE id_usuario=?', [req.user.id]);
  if (!await verifyPassword(currentPassword, row?.clave_hash)) fail('La contraseña actual no es correcta.', 403);
  const encoded = await hashPassword(newPassword);
  await transaction(async cx => {
    await cx.execute('UPDATE usuario SET clave_hash=? WHERE id_usuario=?', [encoded, req.user.id]);
    // Se conserva la sesión actual y se cierran las demás.
    await cx.execute('DELETE FROM sesion_web WHERE id_usuario=? AND sesion_hash<>?', [req.user.id, req.session.sesion_hash]);
    await appendAudit(cx, { actor: req.user.id, action: 'PASSWORD_CHANGED', resource: `usuario:${req.user.id}`, ip: req.ip });
  });
  res.json({ success: true, data: { message: 'Contraseña actualizada. Se cerraron tus otras sesiones.' } });
}));

export default router;
