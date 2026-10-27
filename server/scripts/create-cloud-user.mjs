import fs from 'node:fs/promises';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { hashPassword } from '../src/features/auth/password.js';
import { readPassword } from './read-password.mjs';

const usage = 'Uso: npm run user:create:cloud -- --email correo@dominio --name "Nombre" --role analista|usuario';
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

const configPath = fileURLToPath(new URL('../.env.cloud', import.meta.url));
const config = dotenv.parse(await fs.readFile(configPath));
for (const key of ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_SSL_CA_BASE64']) {
  if (!config[key]) throw new Error(`Falta ${key} en server/.env.cloud.`);
}
if (!/^[a-zA-Z0-9_]+$/.test(config.DB_NAME)) throw new Error('DB_NAME inválido.');
const port = Number(config.DB_PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('DB_PORT inválido.');
const ca = Buffer.from(config.DB_SSL_CA_BASE64, 'base64').toString('utf8');
if (!ca.includes('-----BEGIN CERTIFICATE-----')) throw new Error('DB_SSL_CA_BASE64 inválido.');

const password = await readPassword('Contraseña nueva (no se mostrará): ');
const confirmation = await readPassword('Repite la contraseña: ');
if (password !== confirmation) throw new Error('Las contraseñas no coinciden.');
const passwordHash = await hashPassword(password);

const cx = await mysql.createConnection({
  host: config.DB_HOST,
  port,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  ssl: { ca, rejectUnauthorized: true },
  multipleStatements: false,
});
try {
  const [[existing]] = await cx.execute('SELECT id_usuario FROM usuario WHERE correo=?', [email]);
  if (existing) throw new Error('Ya existe una cuenta con este correo; no se modificó.');
  await cx.execute('INSERT INTO usuario (nombre, correo, clave_hash, rol) VALUES (?,?,?,?)',
    [name, email, passwordHash, role]);
  console.log(`Cuenta creada: ${email} (${role}). La contraseña no se guardó en archivos ni se imprimió.`);
} finally {
  await cx.end();
}
