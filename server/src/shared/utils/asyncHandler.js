/**
 * Envuelve un controlador async para que cualquier error
 * se pase automáticamente a next() y lo capture errorHandler,
 * sin necesidad de repetir try/catch en cada controlador.
 *
 * Uso:
 *   router.get('/ruta', asyncHandler(miControlador));
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default asyncHandler;
