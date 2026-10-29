import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// En local lee .env.cloud; en CI usa exclusivamente las variables protegidas.
dotenv.config({ path: fileURLToPath(new URL('../.env.cloud', import.meta.url)) });

const required = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_SSL_CA_BASE64', 'APP_DB_USER'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Falta ${key} para aplicar migraciones.`);
}
if (!/^[A-Za-z0-9_]+$/.test(process.env.DB_NAME)) throw new Error('DB_NAME inválido.');
if (!/^[A-Za-z0-9_]+$/.test(process.env.APP_DB_USER)) throw new Error('APP_DB_USER inválido.');
const port = Number(process.env.DB_PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('DB_PORT inválido.');
const ca = Buffer.from(process.env.DB_SSL_CA_BASE64, 'base64').toString('utf8');
if (!ca.includes('-----BEGIN CERTIFICATE-----')) throw new Error('DB_SSL_CA_BASE64 inválido.');

const cx = await mysql.createConnection({
  host: process.env.DB_HOST,
  port,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { ca, rejectUnauthorized: true },
  multipleStatements: false,
});

async function ensureAccountControls(cx, databaseName) {
  const [[column]] = await cx.execute(
    `SELECT 1
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA=? AND TABLE_NAME='usuario' AND COLUMN_NAME='bloqueado_hasta'
      LIMIT 1`,
    [databaseName]);
  const [[index]] = await cx.execute(
    `SELECT 1
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA=? AND TABLE_NAME='usuario' AND COLUMN_NAME='bloqueado_hasta'
      LIMIT 1`,
    [databaseName]);

  if (!column) {
    if (index) {
      await cx.query('ALTER TABLE usuario ADD COLUMN bloqueado_hasta DATETIME(3) NULL');
    } else {
      await cx.query('ALTER TABLE usuario ADD COLUMN bloqueado_hasta DATETIME(3) NULL, ADD INDEX (bloqueado_hasta)');
    }
  } else if (!index) {
    await cx.query('ALTER TABLE usuario ADD INDEX (bloqueado_hasta)');
  }
}

try {
  await cx.query(`CREATE TABLE IF NOT EXISTS schema_migration (
    filename VARCHAR(255) PRIMARY KEY,
    checksum CHAR(64) NOT NULL,
    applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB`);

  const databaseDir = new URL('../../database/', import.meta.url);
  const migrationNames = (await fs.readdir(new URL('migrations/', databaseDir)))
    .filter(name => /^\d{3}_[A-Za-z0-9_-]+\.sql$/.test(name))
    .sort();
  const files = ['schema.sql', ...migrationNames.map(name => `migrations/${name}`)];

  for (const filename of files) {
    const sql = await fs.readFile(new URL(filename, databaseDir), 'utf8');
    // Git puede entregar LF en Linux y CRLF en Windows: son la misma migración.
    const normalizedSql = sql.replace(/\r\n/g, '\n');
    const hash = value => crypto.createHash('sha256').update(value).digest('hex');
    const checksum = hash(normalizedSql);
    const windowsChecksum = hash(normalizedSql.replace(/\n/g, '\r\n'));
    const [[applied]] = await cx.execute(
      'SELECT checksum FROM schema_migration WHERE filename=?', [filename]);
    if (applied) {
      if (applied.checksum !== checksum) {
        if (applied.checksum !== windowsChecksum) {
          throw new Error(`La migración ${filename} ya se aplicó con otro contenido. Crea una nueva migración.`);
        }
        await cx.execute('UPDATE schema_migration SET checksum=? WHERE filename=? AND checksum=?',
          [checksum, filename, windowsChecksum]);
      }
      console.log(`Ya aplicada: ${filename}`);
      continue;
    }
    const statements = sql.replace(/^--.*$/gm, '').split(';').map(s => s.trim()).filter(Boolean);
    for (const statement of statements) {
      if (/^(CREATE DATABASE|USE )/i.test(statement)) continue;
      if (filename === 'migrations/006_account_controls.sql' &&
          /^ALTER TABLE usuario\s+ADD COLUMN bloqueado_hasta\b/i.test(statement)) {
        await ensureAccountControls(cx, process.env.DB_NAME);
        continue;
      }
      await cx.query(statement);
    }
    await cx.execute('INSERT INTO schema_migration (filename, checksum) VALUES (?,?)',
      [filename, checksum]);
    console.log(`Aplicada: ${filename}`);
  }

  const grants = {
    usuario: 'SELECT, INSERT, UPDATE',
    gestor_usuarios: 'SELECT, INSERT, DELETE',
    recuperacion_clave: 'SELECT, INSERT, UPDATE, DELETE',
    registro_pendiente: 'SELECT, INSERT, UPDATE, DELETE',
    rol_personalizado: 'SELECT, INSERT, UPDATE, DELETE',
    rol_permiso: 'SELECT, INSERT, DELETE',
    error_log: 'INSERT',
  };
  for (const [table, privileges] of Object.entries(grants)) {
    await cx.query(`GRANT ${privileges} ON ${mysql.escapeId(process.env.DB_NAME)}.${mysql.escapeId(table)} TO ?@?`,
      [process.env.APP_DB_USER, '%']);
  }
  console.log('Permisos de gestión de cuentas actualizados.');
} finally {
  await cx.end();
}
