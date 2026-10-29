import test from 'node:test';
import assert from 'node:assert/strict';
import { PERMISSIONS, ALL_PERMISSION_KEYS, effectivePermissions, isKnownPermission } from '../src/features/permissions/permissions.catalog.js';

const sorted = list => [...list].sort();

test('el catálogo no tiene claves duplicadas y cada permiso tiene módulo y etiqueta', () => {
  assert.equal(new Set(ALL_PERMISSION_KEYS).size, ALL_PERMISSION_KEYS.length);
  for (const permission of PERMISSIONS) {
    assert.ok(permission.module && permission.label, permission.key);
  }
});

test('el administrador recibe siempre todos los permisos', () => {
  assert.deepEqual(effectivePermissions({ role: 'admin' }), ALL_PERMISSION_KEYS);
});

test('los roles base conservan exactamente los permisos previos a esta versión', () => {
  assert.deepEqual(
    effectivePermissions({ role: 'usuario' }),
    ['transferencias.enviar', 'destinatarios.ver']
  );
  const analyst = effectivePermissions({ role: 'analista' });
  assert.ok(analyst.includes('alertas.gestionar'));
  assert.ok(analyst.includes('transferencias.ver_todas'));
  assert.ok(!analyst.includes('transferencias.enviar'));
  assert.ok(!analyst.includes('reglas.gestionar'));
});

test('un rol personalizado sustituye por completo a los permisos base', () => {
  const result = effectivePermissions({ role: 'usuario', customRoleGrants: ['reglas.ver'] });
  assert.deepEqual(result, ['reglas.ver']);
});

test('un rol personalizado sin permisos no hereda nada del rol base', () => {
  assert.deepEqual(effectivePermissions({ role: 'usuario', customRoleGrants: [] }), []);
});

test('la gestión de cuentas se añade cuando la cuenta es gestora', () => {
  const result = effectivePermissions({ role: 'usuario', canManageUsers: true });
  assert.deepEqual(sorted(result), sorted(['transferencias.enviar', 'destinatarios.ver', 'usuarios.gestionar']));
});

test('administrar roles no es un permiso delegable', () => {
  assert.equal(isKnownPermission('roles.gestionar'), false);
  assert.equal(isKnownPermission('reglas.gestionar'), true);
});
