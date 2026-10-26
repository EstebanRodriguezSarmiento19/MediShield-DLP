import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: fileURLToPath(new URL('../../.env.lab', import.meta.url)), override:true });
}

/**
 * Configuración centralizada de variables de entorno.
 * Cualquier otro módulo del backend debe leer la configuración
 * desde aquí en lugar de acceder directamente a process.env.
 */
const env = {
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'),
  production: process.env.NODE_ENV === 'production',
  allowPublicRegistration: process.env.ALLOW_PUBLIC_REGISTRATION !== 'false' &&
    Boolean(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL),
  auditKey: process.env.AUDIT_HMAC_KEY || '',
  smtp: { host:'127.0.0.1', port:Number(process.env.SMTP_PORT || 1025), enabled:process.env.SMTP_ENABLED === 'true' },
  recoveryMail: {
    apiKey: process.env.BREVO_API_KEY || '',
    senderEmail: process.env.BREVO_SENDER_EMAIL || '',
    senderName: process.env.BREVO_SENDER_NAME || 'MediShield DLP',
  },

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'medishield',
    sslCaBase64: process.env.DB_SSL_CA_BASE64 || '',
  },

  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};

export default env;
