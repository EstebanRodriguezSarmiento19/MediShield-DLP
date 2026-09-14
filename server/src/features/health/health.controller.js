import { checkDatabaseConnection } from '../../db/pool.js';

/**
 * GET /api/health
 * Comprueba que el backend está activo y, opcionalmente,
 * que puede conectarse a la base de datos.
 */
async function getHealth(req, res) {
  const isDatabaseConnected = await checkDatabaseConnection();

  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      database: isDatabaseConnected ? 'connected' : 'disconnected',
    },
  });
}

export default { getHealth };
