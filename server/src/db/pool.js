import mysql from 'mysql2/promise';
import env from '../config/env.js';

/**
 * Pool de conexiones MySQL reutilizable en toda la aplicación.
 * No crear conexiones nuevas manualmente en otros archivos:
 * importar este pool y usar pool.query(...) o pool.execute(...).
 */
const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 50,
  timezone: 'Z',
  connectTimeout: 5000,
  multipleStatements: false,
});

/**
 * Comprueba si la base de datos responde.
 * Se usa por ejemplo en el endpoint /api/health.
 * @returns {Promise<boolean>}
 */
export async function checkDatabaseConnection() {
  try {
    await pool.execute('SELECT id FROM audit_head WHERE id = 1');
    return true;
  } catch (error) {
    return false;
  }
}

export default pool;

export async function transaction(fn) {
  const cx = await pool.getConnection();
  try {
    await cx.beginTransaction();
    // Common lock order serializes state changes and audit append in the lab.
    await cx.execute('SELECT sequence_no FROM audit_head WHERE id = 1 FOR UPDATE');
    const value = await fn(cx);
    await cx.commit();
    return value;
  } catch (error) { await cx.rollback(); throw error; }
  finally { cx.release(); }
}
