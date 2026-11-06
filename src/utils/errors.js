// Errores de aplicación con statusCode y code, para que el errorHandler
// centralizado los convierta en respuestas JSON coherentes.
export class ApiError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const badRequest = (message = 'Datos inválidos', code = 'VALIDATION_ERROR') =>
  new ApiError(400, code, message);

export const unauthorized = (message = 'No autenticado', code = 'UNAUTHORIZED') =>
  new ApiError(401, code, message);

export const forbidden = (message = 'No tenés permiso para hacer esto', code = 'FORBIDDEN') =>
  new ApiError(403, code, message);

export const notFound = (message = 'No encontrado', code = 'NOT_FOUND') =>
  new ApiError(404, code, message);

export const conflict = (message = 'Conflicto', code = 'CONFLICT') =>
  new ApiError(409, code, message);
