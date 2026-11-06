import { libraryRepository } from './library.repository.js';
import { catalogService } from '../catalog/catalog.service.js';
import { activityRepository } from '../activity/activity.repository.js';
import { withTransaction } from '../../utils/withTransaction.js';
import { notFound, badRequest } from '../../utils/errors.js';

const VALID_ESTADOS = ['quiero_escuchar', 'escuchando', 'escuchado'];

export const libraryService = {
  async list(userId, filters) {
    return libraryRepository.list(userId, filters);
  },

  // Agrega un contenido a la biblioteca con transacción: upsert contenido
  // → upsert biblioteca_item → registrar actividad.
  async add(userId, { contenido, estado = 'quiero_escuchar' }) {
    if (!contenido || !contenido.spotify_id || !contenido.tipo || !contenido.titulo) {
      throw badRequest('contenido es obligatorio (spotify_id, tipo, titulo)');
    }
    if (!VALID_ESTADOS.includes(estado)) {
      throw badRequest('estado inválido (valores: quiero_escuchar, escuchando, escuchado)');
    }
    return withTransaction(async (client) => {
      const saved = await catalogService.ensureContenido(contenido, client);
      const item = await libraryRepository.create(userId, saved.id, estado, client);
      await activityRepository.record(
        { userId, tipo: 'agregar_biblioteca', contenidoId: saved.id, detalle: { estado } },
        client
      );
      return { ...item, contenido: saved };
    });
  },

  async updateEstado(userId, contenidoId, estado) {
    if (!VALID_ESTADOS.includes(estado)) {
      throw badRequest('estado inválido (valores: quiero_escuchar, escuchando, escuchado)');
    }
    return withTransaction(async (client) => {
      const item = await libraryRepository.updateEstado(userId, contenidoId, estado, client);
      if (!item) throw notFound('El contenido no está en tu biblioteca');
      await activityRepository.record(
        { userId, tipo: 'cambiar_estado', contenidoId, detalle: { nuevo_estado: estado } },
        client
      );
      return item;
    });
  },

  async remove(userId, contenidoId) {
    return withTransaction(async (client) => {
      const deleted = await libraryRepository.remove(userId, contenidoId, client);
      if (!deleted) throw notFound('El contenido no está en tu biblioteca');
      await activityRepository.record(
        { userId, tipo: 'quitar_biblioteca', contenidoId },
        client
      );
      return { contenido_id: contenidoId };
    });
  },
};
