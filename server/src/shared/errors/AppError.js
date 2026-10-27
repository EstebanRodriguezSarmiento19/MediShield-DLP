/**
 * Error de aplicación con código de estado HTTP asociado.
 * Usar esta clase (en vez de Error genérico) cuando se quiera
 * comunicar un error controlado al cliente, por ejemplo:
 *
 *   throw new AppError('Usuario no encontrado', 404);
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export default AppError;
