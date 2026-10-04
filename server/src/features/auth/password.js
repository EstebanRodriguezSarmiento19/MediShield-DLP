import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const derive = promisify(scrypt);
const options = { N:131072, r:8, p:1, maxmem:256 * 1024 * 1024 };
export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 15 || password.length > 128) throw new Error('La contraseña debe tener entre 15 y 128 caracteres.');
  const salt = randomBytes(16).toString('hex');
  const hash = await derive(password,salt,64,options);
  return `scrypt$131072$8$1$${salt}$${hash.toString('hex')}`;
}
export async function verifyPassword(password, encoded) {
  const parts = String(encoded).split('$');
  const validFormat = parts.length===6 && parts.slice(0,4).join('$')==='scrypt$131072$8$1' && /^[0-9a-f]{32}$/.test(parts[4]) && /^[0-9a-f]{128}$/.test(parts[5]);
  const salt = validFormat ? parts[4] : '0'.repeat(32);
  const expected = Buffer.from(validFormat ? parts[5] : '0'.repeat(128),'hex');
  const actual = await derive(password,salt,64,options);
  return timingSafeEqual(expected,actual) && validFormat;
}
