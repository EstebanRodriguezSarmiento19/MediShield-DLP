import 'dotenv/config';

/**
 * Configuración centralizada de variables de entorno.
 * Cualquier otro módulo del backend debe leer la configuración
 * desde aquí en lugar de acceder directamente a process.env.
 */
const env = {
  port: process.env.PORT || 3000,

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'medishield',
  },

  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5174',
};

export default env;
