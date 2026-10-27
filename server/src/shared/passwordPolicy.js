import { fail } from './validation.js';

/**
 * Política única de contraseñas de MediShield DLP.
 * Debe mantenerse sincronizada con client/src/shared/utils/passwordPolicy.js.
 */
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 35;
export const PASSWORD_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const PASSWORD_LOWER = 'abcdefghijklmnopqrstuvwxyz';
export const PASSWORD_DIGITS = '0123456789';
export const PASSWORD_SYMBOLS = "!»#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
const ALLOWED = PASSWORD_UPPER + PASSWORD_LOWER + PASSWORD_DIGITS + PASSWORD_SYMBOLS;

const containsAny = (chars, set) => chars.some(ch => set.includes(ch));

export function passwordChecks(password) {
  const value = typeof password === 'string' ? password : '';
  const chars = [...value];
  return {
    length: chars.length >= PASSWORD_MIN && chars.length <= PASSWORD_MAX,
    upper: containsAny(chars, PASSWORD_UPPER),
    lower: containsAny(chars, PASSWORD_LOWER),
    digit: containsAny(chars, PASSWORD_DIGITS),
    symbol: containsAny(chars, PASSWORD_SYMBOLS),
    allowedOnly: chars.length > 0 && chars.every(ch => ALLOWED.includes(ch)),
  };
}

export function isPasswordCompliant(password) {
  return Object.values(passwordChecks(password)).every(Boolean);
}

export function validatePassword(password) {
  if (!isPasswordCompliant(password)) {
    fail(`La contraseña debe tener entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres e incluir mayúsculas, minúsculas, números y símbolos permitidos, sin espacios.`);
  }
  return password;
}
