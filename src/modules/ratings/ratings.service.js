import { ratingsRepository } from './ratings.repository.js';
import { activityRepository } from '../activity/activity.repository.js';
import { withTransaction } from '../../utils/withTransaction.js';
import { notFound } from '../../utils/errors.js';

export const ratingsService = {
  async set(userId, contenidoId, score) {
    return withTransaction(async (client) => {
      const item = await ratingsRepository.setRating(userId, contenidoId, score, client);
      if (!item) throw notFound('Contenido no encontrado');
      await activityRepository.record(
        { userId, tipo: 'puntuar', contenidoId, detalle: { puntuacion: score } },
        client
      );
      return item;
    });
  },

  async clear(userId, contenidoId) {
    return withTransaction(async (client) => {
      const item = await ratingsRepository.clearRating(userId, contenidoId, client);
      if (!item) throw notFound('No hay puntuación para este contenido');
      return item;
    });
  },

  async list(userId) {
    return ratingsRepository.listRated(userId);
  },
};
