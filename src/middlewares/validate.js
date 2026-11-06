import { badRequest } from '../utils/errors.js';

// Middleware genérico de validación con Zod sobre el body.
// Reemplaza req.body por los datos saneados/normalizados por Zod.
export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.') || 'body'}: ${i.message}`)
      .join('; ');
    return next(badRequest(issues));
  }
  req.body = result.data;
  return next();
};

// Validación de parámetros de ruta (ej: :id numérico).
export const validateParams = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.params);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    return next(badRequest(issues));
  }
  req.params = result.data;
  return next();
};

// Validación de query string (ej: ?q=...&limit=...).
export const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    return next(badRequest(issues));
  }
  req.query = result.data;
  return next();
};
