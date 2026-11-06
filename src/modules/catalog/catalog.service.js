import { spotifyProvider } from './catalog.provider.js';
import { catalogRepository } from './catalog.repository.js';
import pool from '../../database/pool.js';
import { notFound } from '../../utils/errors.js';

export const catalogService = {
  // Búsqueda contra Spotify (no persiste; solo resultados normalizados).
  async search(params) {
    return spotifyProvider.search(params);
  },

  // Detalle desde Spotify. Si viene, lo persiste/actualiza en contenidos
  // (upsert por spotify_id) y devuelve la fila guardada.
  async getAndPersistDetail(spotifyId, tipo) {
    const item =
      tipo === 'album'
        ? await spotifyProvider.getAlbum(spotifyId)
        : await spotifyProvider.getTrack(spotifyId);
    if (!item) throw notFound('Contenido no encontrado en Spotify', 'SPOTIFY_NOT_FOUND');
    return catalogRepository.upsertContenido(item);
  },

  // Upsert expuesto para que otros módulos (p.ej. biblioteca) persistan un
  // contenido antes de vincularlo al usuario. Acepta un cliente de transacción.
  async ensureContenido(contenido, client = pool) {
    return catalogRepository.upsertContenido(contenido, client);
  },
};
