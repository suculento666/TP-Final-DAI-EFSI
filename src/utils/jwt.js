import jwt from 'jsonwebtoken';
import config from '../config/env.js';

// Nombre de la cookie HttpOnly que transporta el JWT.
export const TOKEN_COOKIE = 'mc_token';

// Convierte un string de expiración tipo "7d", "24h", "30m", "60s" a milisegundos.
function expiryToMs(exp) {
  const m = /^(\d+)\s*(d|h|m|s)$/i.exec(String(exp).trim());
  if (!m) return 7 * 24 * 60 * 60 * 1000; // fallback: 7 días
  const n = parseInt(m[1], 10);
  const factor = { d: 86400000, h: 3600000, m: 60000, s: 1000 }[m[2].toLowerCase()];
  return n * factor;
}

export function signToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

// Opciones de la cookie: HttpOnly (JS no la lee), Secure solo en producción
// (en dev local no hay HTTPS), SameSite=Lax (mitiga CSRF en mismo sitio).
export function cookieOptions() {
  return {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: expiryToMs(config.jwt.expiresIn),
    path: '/',
  };
}
