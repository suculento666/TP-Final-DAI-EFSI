import { spotifyProvider } from './catalog.provider.js';
import { catalogRepository } from './catalog.repository.js';
import pool from '../../database/pool.js';
import { notFound } from '../../utils/errors.js';

export const catalogService = {
  // Búsqueda contra Spotify (no persiste; solo resultados normalizados).
  async search(params) {
    return spotifyProvider.search(params);
  },

  // Consulta los metadatos oficiales sin abrir una transacción de base de datos.
  async getDetail(spotifyId, tipo) {
    const item =
      tipo === 'album'
        ? await spotifyProvider.getAlbum(spotifyId)
        : await spotifyProvider.getTrack(spotifyId);
    if (!item) throw notFound('Contenido no encontrado en Spotify', 'SPOTIFY_NOT_FOUND');
    return item;
  },

  // Detalle desde Spotify, persistido por spotify_id.
  async getAndPersistDetail(spotifyId, tipo) {
    const item = await this.getDetail(spotifyId, tipo);
    return catalogRepository.upsertContenido(item);
  },

  // Solo recibe metadatos obtenidos por el servidor, nunca el body del cliente.
  // Acepta un cliente para guardar contenido y biblioteca en la misma transacción.
  async ensureContenido(contenido, client = pool) {
    return catalogRepository.upsertContenido(contenido, client);
  },
};
