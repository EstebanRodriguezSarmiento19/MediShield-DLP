/**
 * Middleware que responde con 404 cuando ninguna ruta coincide.
 * Debe registrarse en app.js después de todas las rutas.
 */
function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    },
  });
}

export default notFound;
