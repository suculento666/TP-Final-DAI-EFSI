import { reviewsRepository } from './reviews.repository.js';
import { catalogRepository } from '../catalog/catalog.repository.js';
import { activityRepository } from '../activity/activity.repository.js';
import { withTransaction } from '../../utils/withTransaction.js';
import { notFound, conflict } from '../../utils/errors.js';

export const reviewsService = {
  async getMine(userId, contenidoId) {
    return reviewsRepository.findByContenido(userId, contenidoId); // null si no tiene
  },

  async listMine(userId) {
    return reviewsRepository.listMine(userId);
  },

  async create(userId, contenidoId, texto) {
    return withTransaction(async (client) => {
      const content = await catalogRepository.findById(contenidoId, client);
      if (!content) throw notFound('Contenido no encontrado');
      const review = await reviewsRepository.create(userId, contenidoId, texto, client);
      if (!review) throw conflict('Ya tenés una reseña para este contenido', 'REVIEW_EXISTS');
      await activityRepository.record(
        { userId, tipo: 'crear_reseña', contenidoId, detalle: { caracteres: texto.length } },
        client
      );
      return review;
    });
  },

  async update(userId, contenidoId, texto) {
    return withTransaction(async (client) => {
      const review = await reviewsRepository.update(userId, contenidoId, texto, client);
      if (!review) throw notFound('Reseña no encontrada');
      await activityRepository.record(
        { userId, tipo: 'editar_reseña', contenidoId, detalle: { caracteres: texto.length } },
        client
      );
      return review;
    });
  },

  async remove(userId, contenidoId) {
    return withTransaction(async (client) => {
      const deleted = await reviewsRepository.remove(userId, contenidoId, client);
      if (!deleted) throw notFound('Reseña no encontrada');
      await activityRepository.record({ userId, tipo: 'borrar_reseña', contenidoId }, client);
      return { contenido_id: contenidoId };
    });
  },
};
