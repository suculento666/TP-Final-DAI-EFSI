import { ratingsRepository } from './ratings.repository.js';
import { catalogRepository } from '../catalog/catalog.repository.js';
import { activityRepository } from '../activity/activity.repository.js';
import { withTransaction } from '../../utils/withTransaction.js';
import { conflict, notFound } from '../../utils/errors.js';

export const ratingsService = {
  async set(userId, contenidoId, score) {
    return withTransaction(async (client) => {
      const item = await ratingsRepository.setRating(userId, contenidoId, score, client);
      if (!item) {
        const content = await catalogRepository.findById(contenidoId, client);
        if (!content) throw notFound('Contenido no encontrado');
        throw conflict('Guardá este contenido en tu biblioteca para puntuarlo', 'RATING_REQUIRES_LIBRARY');
      }
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
      await activityRepository.record(
        { userId, tipo: 'quitar_puntuacion', contenidoId },
        client
      );
      return item;
    });
  },

  async list(userId) {
    return ratingsRepository.listRated(userId);
  },
};
