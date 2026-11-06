import { verifyToken, TOKEN_COOKIE } from '../utils/jwt.js';
import { unauthorized } from '../utils/errors.js';

// Middleware de autenticación. Lee el JWT de la cookie HttpOnly (mecanismo
// principal) y, como fallback, del header Authorization: Bearer <token>.
// Si es válido, carga req.user = { id } para que el resto del código filtre
// siempre por ese usuario.
export function authenticate(req, res, next) {
  let token = null;

  if (req.cookies && req.cookies[TOKEN_COOKIE]) {
    token = req.cookies[TOKEN_COOKIE];
  }

  const header = req.headers.authorization;
  if (!token && header && header.startsWith('Bearer ')) {
    token = header.slice(7).trim();
  }

  if (!token) {
    return next(unauthorized('Token de autenticación no proporcionado'));
  }

  try {
    const payload = verifyToken(token);
    if (!payload || !payload.sub) {
      return next(unauthorized('Token inválido'));
    }
    req.user = { id: payload.sub };
    return next();
  } catch {
    return next(unauthorized('Token inválido o expirado'));
  }
}
