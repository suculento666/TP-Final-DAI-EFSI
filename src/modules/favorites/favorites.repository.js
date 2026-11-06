import pool from '../../database/pool.js';
import { catalogRepository } from '../catalog/catalog.repository.js';

const FAV_COLUMNS =
  'bi.id, bi.usuario_id, bi.contenido_id, bi.estado, bi.es_favorito, ' +
  'bi.puntuacion, bi.agregado_en, bi.actualizado_en';

const WITH_CONTENT = `
  SELECT ${FAV_COLUMNS},
    c.spotify_id, c.tipo, c.titulo, c.artista, c.album, c.generos,
    c.portada_url, c.duracion_ms, c.total_canciones, c.fecha_lanzamiento
  FROM biblioteca_items bi JOIN contenidos c ON c.id = bi.contenido_id
`;

// Favoritos viven en biblioteca_items.es_favorito (no hay tabla aparte).
export const favoritesRepository = {
  // UPSERT del item: si no existe, lo crea con estado default y marca favorito.
  // Devuelve null si el contenido no existe (para 404).
  async setFavorite(userId, contenidoId, value, client = pool) {
    const content = await catalogRepository.findById(contenidoId, client);
    if (!content) return null;
    const { rows } = await client.query(
      `INSERT INTO biblioteca_items (usuario_id, contenido_id, estado, es_favorito)
       VALUES ($1, $2, 'quiero_escuchar', $3)
       ON CONFLICT (usuario_id, contenido_id) DO UPDATE
         SET es_favorito = EXCLUDED.es_favorito, actualizado_en = now()
       RETURNING ${FAV_COLUMNS}`,
      [userId, contenidoId, value]
    );
    return rows[0];
  },

  async list(userId, client = pool) {
    const { rows } = await client.query(
      `${WITH_CONTENT} WHERE bi.usuario_id = $1 AND bi.es_favorito = TRUE
       ORDER BY bi.actualizado_en DESC`,
      [userId]
    );
    return rows;
  },
};
