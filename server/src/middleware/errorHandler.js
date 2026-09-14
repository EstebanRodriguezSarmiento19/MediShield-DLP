/**
 * Middleware centralizado de manejo de errores.
 * Debe registrarse en app.js como el último middleware.
 *
 * Cualquier error lanzado (o pasado con next(error)) termina aquí,
 * incluyendo los AppError controlados y errores inesperados.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const message = error.isOperational
    ? error.message
    : 'Error interno del servidor';

  if (!error.isOperational) {
    console.error('[ERROR NO CONTROLADO]', error);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
    },
  });
}

export default errorHandler;
