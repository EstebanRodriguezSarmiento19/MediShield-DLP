import pool from '../../db/pool.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';
import { fail } from '../../shared/validation.js';
import { recordAudit } from '../audit/audit.service.js';
import { effectivePermissions } from './permissions.catalog.js';

export { PERMISSIONS, ALL_PERMISSION_KEYS, isKnownPermission, effectivePermissions } from './permissions.catalog.js';

/** Permisos efectivos de una cuenta a partir de su fila (rol, id_rol y gestión de cuentas). */
export async function permissionsFor(account) {
  let customRoleGrants = null;
  if (account.id_rol) {
    const [rows] = await pool.execute('SELECT permiso FROM rol_permiso WHERE id_rol=?', [account.id_rol]);
    customRoleGrants = rows.map(row => row.permiso);
  }
  return effectivePermissions({
    role: account.rol,
    customRoleGrants,
    canManageUsers: Boolean(account.can_manage_users)
  });
}

/** Exige al menos uno de los permisos indicados. Registra el intento denegado. */
export const can = (...keys) => asyncHandler(async (req, res, next) => {
  if (!keys.some(key => req.user.permissions.includes(key))) {
    await recordAudit({ actor: req.user.id, action: 'ACCESS_DENIED', resource: req.path, outcome: 'DENIED', ip: req.ip });
    fail('Tu rol no tiene permiso para esta acción.', 403);
  }
  next();
});
