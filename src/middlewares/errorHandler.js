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

// PostgreSQL informa las violaciones UNIQUE con 23505, incluso cuando dos
// pedidos concurrentes superan la comprobación previa de disponibilidad.
const UNIQUE_CONFLICTS = {
  usuarios_email_key: { code: 'EMAIL_TAKEN', message: 'El correo ya está registrado' },
  usuarios_username_key: { code: 'USERNAME_TAKEN', message: 'El nombre de usuario ya está en uso' },
  colecciones_usuario_id_nombre_key: {
    code: 'COLLECTION_NAME_TAKEN',
    message: 'Ya existe una colección con ese nombre',
  },
};

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const uniqueConflict = err.code === '23505'
    ? UNIQUE_CONFLICTS[err.constraint] || { code: 'CONFLICT', message: 'El registro ya existe' }
    : null;
  const statusCode = uniqueConflict ? 409 : err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  const message = uniqueConflict?.message || (
    statusCode === 500 && isProduction
      ? 'Error interno del servidor'
      : err.message || 'Error interno del servidor');

  // err.code tiene prioridad; si no existe, se infiere del status HTTP
  const code = uniqueConflict?.code || err.code || ERROR_CODES[statusCode] || 'INTERNAL_ERROR';

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
