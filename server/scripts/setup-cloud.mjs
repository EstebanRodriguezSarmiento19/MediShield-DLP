import fs from 'node:fs/promises';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { hashPassword } from '../src/features/auth/password.js';

dotenv.config({ path: fileURLToPath(new URL('../.env.cloud', import.meta.url)) });

const required = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
  'DB_SSL_CA_BASE64', 'APP_DB_USER', 'APP_DB_PASSWORD', 'INITIAL_ADMIN_EMAIL', 'INITIAL_ADMIN_PASSWORD'];
for (const name of required) {
  if (!process.env[name]) throw new Error(`Falta ${name}. Configura esta variable solo para la inicialización.`);
}
const name = process.env.DB_NAME;
const appUser = process.env.APP_DB_USER;
if (!/^[a-zA-Z0-9_]+$/.test(name) || !/^[a-zA-Z0-9_]+$/.test(appUser)) {
  throw new Error('DB_NAME y APP_DB_USER solo admiten letras, números y guion bajo.');
}
if (!Number.isInteger(Number(process.env.DB_PORT)) || Number(process.env.DB_PORT) < 1 || Number(process.env.DB_PORT) > 65535) {
  throw new Error('DB_PORT inválido.');
}
const adminEmail = process.env.INITIAL_ADMIN_EMAIL.trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) throw new Error('INITIAL_ADMIN_EMAIL inválido.');
const appPassword = process.env.APP_DB_PASSWORD;
if (appPassword.length < 24) throw new Error('APP_DB_PASSWORD debe tener al menos 24 caracteres.');
const ca = Buffer.from(process.env.DB_SSL_CA_BASE64, 'base64').toString('utf8');
if (!ca.includes('-----BEGIN CERTIFICATE-----')) throw new Error('DB_SSL_CA_BASE64 debe contener el certificado CA de Aiven en base64.');

const cx = await mysql.createConnection({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  ssl: { ca, rejectUnauthorized: true }, multipleStatements: false,
});
try {
  await cx.query('CREATE DATABASE IF NOT EXISTS ' + mysql.escapeId(name) + ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  await cx.changeUser({ database: name });
  const databaseDir = new URL('../../database/', import.meta.url);
  const migrationNames = (await fs.readdir(new URL('migrations/', databaseDir)))
    .filter(filename => /^\d{3}_[A-Za-z0-9_-]+\.sql$/.test(filename)).sort();
  for (const url of [new URL('schema.sql', databaseDir),
    ...migrationNames.map(filename => new URL(`migrations/${filename}`, databaseDir))]) {
    const sql = await fs.readFile(url, 'utf8');
    for (const statement of sql.replace(/^--.*$/gm, '').split(';').map(x => x.trim()).filter(Boolean)) {
      if (/^(CREATE DATABASE|USE )/i.test(statement)) continue;
      await cx.query(statement);
    }
  }
  for (const [id, weight] of [['DLP-001', 35], ['DLP-002', 50], ['DLP-003', 25]]) {
    await cx.execute('INSERT IGNORE INTO regla_dlp (id,peso) VALUES (?,?)', [id, weight]);
  }
  const [[existing]] = await cx.execute('SELECT id_usuario FROM usuario WHERE correo=?', [adminEmail]);
  if (!existing) {
    const passwordHash = await hashPassword(process.env.INITIAL_ADMIN_PASSWORD);
    await cx.execute('INSERT INTO usuario(nombre,correo,clave_hash,rol) VALUES (?,?,?,?)',
      ['Administrador', adminEmail, passwordHash, 'admin']);
  }
  await cx.query('CREATE USER IF NOT EXISTS ?@? IDENTIFIED BY ?', [appUser, '%', appPassword]);
  const tables = {
    usuario: 'SELECT, INSERT', sesion_web: 'SELECT, INSERT, UPDATE, DELETE',
    auth_attempt: 'SELECT, INSERT, UPDATE', destinatario: 'SELECT, INSERT, UPDATE',
    regla_dlp: 'SELECT, UPDATE', transferencia: 'SELECT, INSERT, UPDATE',
    alerta: 'SELECT, INSERT, UPDATE', historial_comunicacion: 'SELECT, INSERT, UPDATE',
    audit_head: 'SELECT, UPDATE', audit_event: 'SELECT, INSERT',
  };
  for (const [table, grants] of Object.entries(tables)) {
    await cx.query('GRANT ' + grants + ' ON ' + mysql.escapeId(name) + '.' + mysql.escapeId(table) + ' TO ?@?', [appUser, '%']);
  }
  console.log('Esquema creado o actualizado. Cuenta inicial: ' + adminEmail + '.');
  console.log('Cuenta SQL restringida configurada. No se imprimieron contraseñas.');
} finally {
  await cx.end();
}
