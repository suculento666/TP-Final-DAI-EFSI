import { collectionsRepository } from './collections.repository.js';
import { activityRepository } from '../activity/activity.repository.js';
import { withTransaction } from '../../utils/withTransaction.js';
import { notFound, conflict } from '../../utils/errors.js';

const EDITABLE = ['nombre', 'descripcion', 'color'];

export const collectionsService = {
  async list(userId) {
    return collectionsRepository.list(userId);
  },

  async getOne(userId, id) {
    const { collection, items } = await collectionsRepository.listItems(userId, id);
    if (!collection) throw notFound('Colección no encontrada');
    return { collection, items };
  },

  async create(userId, data) {
    return withTransaction(async (client) => {
      const collection = await collectionsRepository.create(userId, data, client);
      if (!collection) throw conflict('Ya existe una colección con ese nombre', 'COLLECTION_NAME_TAKEN');
      await activityRepository.record({ userId, tipo: 'crear_coleccion', coleccionId: collection.id }, client);
      return collection;
    });
  },

  async update(userId, id, data) {
    return withTransaction(async (client) => {
      const fields = {};
      for (const key of EDITABLE) {
        if (data[key] !== undefined) fields[key] = data[key];
      }
      const collection = await collectionsRepository.update(userId, id, fields, client);
      if (!collection) throw notFound('Colección no encontrada');
      return collection;
    });
  },

  async remove(userId, id) {
    return withTransaction(async (client) => {
      const deleted = await collectionsRepository.remove(userId, id, client);
      if (!deleted) throw notFound('Colección no encontrada');
      await activityRepository.record({ userId, tipo: 'borrar_coleccion', coleccionId: id }, client);
      return { id };
    });
  },

  async addItem(userId, coleccionId, contenidoId) {
    return withTransaction(async (client) => {
      const res = await collectionsRepository.addItem(userId, coleccionId, contenidoId, client);
      if (res.error === 'collection_not_found') throw notFound('Colección no encontrada');
      if (res.error === 'content_not_found') throw notFound('Contenido no encontrado');
      if (res.added) {
        await activityRepository.record(
          { userId, tipo: 'agregar_a_coleccion', contenidoId, coleccionId },
          client
        );
      }
      return { added: res.added };
    });
  },

  async removeItem(userId, coleccionId, contenidoId) {
    return withTransaction(async (client) => {
      const res = await collectionsRepository.removeItem(userId, coleccionId, contenidoId, client);
      if (res.error === 'collection_not_found') throw notFound('Colección no encontrada');
      if (!res.removed) throw notFound('El contenido no está en la colección');
      await activityRepository.record(
        { userId, tipo: 'quitar_de_coleccion', contenidoId, coleccionId },
        client
      );
      return { removed: true };
    });
  },
};
