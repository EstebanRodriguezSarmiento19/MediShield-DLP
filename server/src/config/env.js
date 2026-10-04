import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });
dotenv.config({ path: fileURLToPath(new URL('../../.env.lab', import.meta.url)), override:true });

/**
 * Configuración centralizada de variables de entorno.
 * Cualquier otro módulo del backend debe leer la configuración
 * desde aquí en lugar de acceder directamente a process.env.
 */
const env = {
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || '127.0.0.1',
  production: process.env.NODE_ENV === 'production',
  auditKey: process.env.AUDIT_HMAC_KEY || '',
  smtp: { host:'127.0.0.1', port:Number(process.env.SMTP_PORT || 1025), enabled:process.env.SMTP_ENABLED === 'true' },

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'medishield',
  },

  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};

export default env;
