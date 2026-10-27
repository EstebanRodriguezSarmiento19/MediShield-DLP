import test from 'node:test';
import assert from 'node:assert/strict';
import { isPasswordCompliant, PASSWORD_SYMBOLS } from '../src/shared/passwordPolicy.js';
import { runPolicyTests } from '../src/features/dlp/dlp.policyTests.js';

test('acepta contraseñas de 10 a 35 caracteres con las cuatro clases permitidas', () => {
  assert.equal(isPasswordCompliant('Abcdefgh1!'), true);
  assert.equal(isPasswordCompliant('Aa1!' + 'b'.repeat(31)), true);
});
test('rechaza longitudes fuera de rango', () => {
  assert.equal(isPasswordCompliant('Abcdefg1!'), false);
  assert.equal(isPasswordCompliant('Aa1!' + 'b'.repeat(32)), false);
});
test('exige mayúsculas, minúsculas, números y símbolos, y rechaza espacios o acentos', () => {
  for (const weak of ['Abcdefghi1', 'abcdefghi1!', 'ABCDEFGHI1!', 'Abcdefghi!!', 'Abcdefgh 1!', 'Ábcdefgh1!']) {
    assert.equal(isPasswordCompliant(weak), false, weak);
  }
});
test('acepta cada símbolo de la lista oficial', () => {
  assert.equal(PASSWORD_SYMBOLS, "!»#$%&'()*+,-./:;<=>?@[\\]^_`{|}~");
  for (const symbol of PASSWORD_SYMBOLS) assert.equal(isPasswordCompliant('Aa1' + symbol + 'bcdefg'), true, symbol);
});
test('la batería DLP de referencia pasa completa con las reglas por defecto', () => {
  const report = runPolicyTests();
  assert.equal(report.summary.failed, 0, JSON.stringify(report.cases.filter(c => !c.passed)));
});
