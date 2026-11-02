// Middleware de manejo de errores centralizado.
// Express lo reconoce como error handler porque tiene 4 parámetros.
// Debe registrarse DESPUÉS de todas las rutas en app.js.

// Mapa de statusCode → code de error para el contrato de respuesta
const ERROR_CODES = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
};

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  const message =
    statusCode === 500 && isProduction
      ? 'Error interno del servidor'
      : err.message || 'Error interno del servidor';

  // err.code tiene prioridad; si no existe, se infiere del status HTTP
  const code = err.code || ERROR_CODES[statusCode] || 'INTERNAL_ERROR';

  if (!isProduction) {
    console.error(`[${statusCode}] ${code}: ${err.message}`);
    if (err.stack) console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

export default errorHandler;
