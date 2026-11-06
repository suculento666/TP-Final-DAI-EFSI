import { favoritesRepository } from './favorites.repository.js';
import { activityRepository } from '../activity/activity.repository.js';
import { withTransaction } from '../../utils/withTransaction.js';
import { notFound } from '../../utils/errors.js';

export const favoritesService = {
  async set(userId, contenidoId, value) {
    return withTransaction(async (client) => {
      const item = await favoritesRepository.setFavorite(userId, contenidoId, value, client);
      if (!item) throw notFound('Contenido no encontrado');
      await activityRepository.record(
        { userId, tipo: value ? 'marcar_favorito' : 'quitar_favorito', contenidoId },
        client
      );
      return item;
    });
  },

  async list(userId) {
    return favoritesRepository.list(userId);
  },
};
