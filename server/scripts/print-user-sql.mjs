import mysql from 'mysql2';
import { hashPassword } from '../src/features/auth/password.js';
import { readPassword } from './read-password.mjs';

const usage = 'Uso: npm run user:sql -- --email correo@dominio --name "Nombre" --role analista|usuario';
const args = process.argv.slice(2);
const options = {};
for (let i = 0; i < args.length; i += 2) {
  const key = args[i];
  if (!['--email', '--name', '--role'].includes(key) || !args[i + 1] || options[key]) {
    throw new Error(usage);
  }
  options[key] = args[i + 1];
}
if (args.length !== 6 || Object.keys(options).length !== 3) throw new Error(usage);

const email = options['--email'].trim().toLowerCase();
const name = options['--name'].trim();
const role = options['--role'];
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Correo inválido.');
if (name.length < 2 || name.length > 100) throw new Error('El nombre debe tener entre 2 y 100 caracteres.');
if (!['analista', 'usuario'].includes(role)) throw new Error('Rol inválido. Usa analista o usuario.');

const password = await readPassword('Contraseña nueva (no se mostrará): ');
const confirmation = await readPassword('Repite la contraseña: ');
if (password !== confirmation) throw new Error('Las contraseñas no coinciden.');
const passwordHash = await hashPassword(password);

console.log('Copia y ejecuta esta sentencia en MySQL Workbench conectado a Aiven:');
console.log(mysql.format(
  'INSERT INTO medishield.usuario (nombre, correo, clave_hash, rol) VALUES (?, ?, ?, ?);',
  [name, email, passwordHash, role],
));
