import { authRepository } from './auth.repository.js';
import { hashPassword, comparePassword } from '../../utils/hash.js';
import { signToken } from '../../utils/jwt.js';
import { conflict, unauthorized } from '../../utils/errors.js';

// Quita el hash antes de devolver un usuario al cliente.
function toPublic(user) {
  if (!user) return user;
  const { password_hash, ...rest } = user;
  return rest;
}

export const authService = {
  async register({ username, email, password }) {
    if (await authRepository.findByEmail(email)) {
      throw conflict('El correo ya está registrado', 'EMAIL_TAKEN');
    }
    if (await authRepository.findByUsername(username)) {
      throw conflict('El nombre de usuario ya está en uso', 'USERNAME_TAKEN');
    }
    const password_hash = await hashPassword(password);
    const user = await authRepository.create({ username, email, password_hash });
    const token = signToken({ sub: user.id });
    return { user, token };
  },

  async login({ email, password }) {
    const user = await authRepository.findByEmail(email);
    // Mensaje genérico para no filtrar si existe el correo.
    if (!user) throw unauthorized('Credenciales inválidas', 'BAD_CREDENTIALS');
    const ok = await comparePassword(password, user.password_hash);
    if (!ok) throw unauthorized('Credenciales inválidas', 'BAD_CREDENTIALS');
    const token = signToken({ sub: user.id });
    return { user: toPublic(user), token };
  },

  // /me usa findById que ya devuelve campos públicos.
  async me(userId) {
    const user = await authRepository.findById(userId);
    if (!user) throw unauthorized('Usuario no encontrado', 'USER_NOT_FOUND');
    return user;
  },
};
