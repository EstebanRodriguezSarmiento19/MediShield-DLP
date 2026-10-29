// Catálogo de permisos granulares: única fuente de verdad.
// El servidor valida contra estas claves y el cliente las recibe desde
// GET /api/roles/custom/catalog. No contiene dependencias para poder probarse aislado.

export const PERMISSIONS = Object.freeze([
  { key: 'transferencias.enviar', module: 'Transferencias', label: 'Preparar y enviar correos mediante el control DLP' },
  { key: 'transferencias.ver_todas', module: 'Transferencias', label: 'Ver las transferencias de toda la organización' },
  { key: 'destinatarios.ver', module: 'Destinatarios', label: 'Consultar destinatarios y su historial' },
  { key: 'destinatarios.gestionar', module: 'Destinatarios', label: 'Crear, autorizar y revocar destinatarios' },
  { key: 'reglas.ver', module: 'Reglas DLP', label: 'Consultar las reglas de detección' },
  { key: 'reglas.gestionar', module: 'Reglas DLP', label: 'Modificar el peso de las reglas' },
  { key: 'alertas.ver', module: 'Alertas', label: 'Consultar las alertas de transferencias' },
  { key: 'alertas.gestionar', module: 'Alertas', label: 'Revisar y cerrar alertas' },
  { key: 'auditoria.ver', module: 'Auditoría', label: 'Consultar y verificar el registro de auditoría' },
  { key: 'seguridad.ver', module: 'Seguridad y pruebas', label: 'Consultar las pruebas de política DLP' },
  { key: 'seguridad.ejecutar', module: 'Seguridad y pruebas', label: 'Ejecutar pruebas y simulaciones DLP' },
  { key: 'usuarios.gestionar', module: 'Cuentas', label: 'Invitar, editar y desactivar cuentas' }
]);

// Administrar roles y permisos es exclusivo del rol administrador: no existe
// una clave de permiso para ello, así que ningún rol personalizado puede concederlo.

export const ALL_PERMISSION_KEYS = Object.freeze(PERMISSIONS.map(p => p.key));

export const isKnownPermission = key => ALL_PERMISSION_KEYS.includes(key);

// Permisos de los roles base. Reproducen el comportamiento previo a esta versión
// y solo se aplican a cuentas sin rol personalizado.
export const BASE_ROLE_PERMISSIONS = Object.freeze({
  usuario: Object.freeze(['transferencias.enviar', 'destinatarios.ver']),
  analista: Object.freeze([
    'transferencias.ver_todas', 'destinatarios.ver', 'reglas.ver', 'alertas.ver',
    'alertas.gestionar', 'auditoria.ver', 'seguridad.ver', 'seguridad.ejecutar'
  ])
});

/**
 * Calcula los permisos efectivos de una cuenta.
 * @param {{role: string, customRoleGrants?: string[]|null, canManageUsers?: boolean}} account
 *   customRoleGrants: null si la cuenta no tiene rol personalizado.
 */
export function effectivePermissions({ role, customRoleGrants = null, canManageUsers = false }) {
  if (role === 'admin') return [...ALL_PERMISSION_KEYS];
  const granted = new Set(customRoleGrants ?? BASE_ROLE_PERMISSIONS[role] ?? []);
  if (canManageUsers) granted.add('usuarios.gestionar');
  return ALL_PERMISSION_KEYS.filter(key => granted.has(key));
}
