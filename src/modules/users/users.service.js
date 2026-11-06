import { usersRepository } from './users.repository.js';
import { notFound } from '../../utils/errors.js';

// Únicos campos que el perfil puede editar. Coinciden con columnas de `usuarios`.
const EDITABLE = ['avatar_url', 'bio', 'generos_preferidos'];

export const usersService = {
  async getMe(userId) {
    const user = await usersRepository.findById(userId);
    if (!user) throw notFound('Usuario no encontrado');
    return user;
  },

  async updateMe(userId, data) {
    const fields = {};
    for (const key of EDITABLE) {
      // null es válido (para limpiar avatar/bio); undefined significa "no tocar".
      if (data[key] !== undefined) fields[key] = data[key];
    }
    const user = await usersRepository.updateProfile(userId, fields);
    if (!user) throw notFound('Usuario no encontrado');
    return user;
  },
};
