import { libraryRepository } from './library.repository.js';
import { catalogService } from '../catalog/catalog.service.js';
import { notFound, badRequest } from '../../utils/errors.js';

const VALID_ESTADOS = ['quiero_escuchar', 'escuchando', 'escuchado'];

export const libraryService = {
  async list(userId, filters) {
    return libraryRepository.list(userId, filters);
  },

  // Agrega un contenido a la biblioteca del usuario. Persiste el contenido
  // (upsert por spotify_id) y luego crea el item. Devuelve el item + contenido.
  async add(userId, { contenido, estado = 'quiero_escuchar' }) {
    if (!contenido || !contenido.spotify_id || !contenido.tipo || !contenido.titulo) {
      throw badRequest('contenido es obligatorio (spotify_id, tipo, titulo)');
    }
    if (!VALID_ESTADOS.includes(estado)) {
      throw badRequest('estado inválido (valores: quiero_escuchar, escuchando, escuchado)');
    }
    const saved = await catalogService.ensureContenido(contenido);
    const item = await libraryRepository.create(userId, saved.id, estado);
    return { ...item, contenido: saved };
  },

  async updateEstado(userId, contenidoId, estado) {
    if (!VALID_ESTADOS.includes(estado)) {
      throw badRequest('estado inválido (valores: quiero_escuchar, escuchando, escuchado)');
    }
    const item = await libraryRepository.updateEstado(userId, contenidoId, estado);
    if (!item) throw notFound('El contenido no está en tu biblioteca');
    return item;
  },

  async remove(userId, contenidoId) {
    const deleted = await libraryRepository.remove(userId, contenidoId);
    if (!deleted) throw notFound('El contenido no está en tu biblioteca');
    return { contenido_id: contenidoId };
  },
};
