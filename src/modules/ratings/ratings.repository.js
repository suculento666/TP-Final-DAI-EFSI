import pool from '../../database/pool.js';
import { catalogRepository } from '../catalog/catalog.repository.js';

// Columnas sin alias de tabla: válido en INSERT/UPDATE donde no hay JOIN.
const BARE_COLUMNS =
  'id, usuario_id, contenido_id, estado, es_favorito, ' +
  'puntuacion, agregado_en, actualizado_en';

// Con alias bi: válido en SELECT con JOIN a contenidos.
const WITH_CONTENT = `
  SELECT bi.id, bi.usuario_id, bi.contenido_id, bi.estado, bi.es_favorito,
         bi.puntuacion, bi.agregado_en, bi.actualizado_en,
    c.spotify_id, c.tipo, c.titulo, c.artista, c.album, c.generos,
    c.portada_url, c.duracion_ms, c.total_canciones, c.fecha_lanzamiento
  FROM biblioteca_items bi JOIN contenidos c ON c.id = bi.contenido_id
`;

// Puntuaciones viven en biblioteca_items.puntuacion (no hay tabla aparte).
export const ratingsRepository = {
  // UPSERT del item: si no existe, lo crea con estado default y la puntuación.
  async setRating(userId, contenidoId, score, client = pool) {
    const content = await catalogRepository.findById(contenidoId, client);
    if (!content) return null;
    const { rows } = await client.query(
      `INSERT INTO biblioteca_items (usuario_id, contenido_id, estado, puntuacion)
       VALUES ($1, $2, 'quiero_escuchar', $3)
       ON CONFLICT (usuario_id, contenido_id) DO UPDATE
         SET puntuacion = EXCLUDED.puntuacion, actualizado_en = now()
       RETURNING ${BARE_COLUMNS}`,
      [userId, contenidoId, score]
    );
    return rows[0];
  },

  async clearRating(userId, contenidoId, client = pool) {
    const { rows } = await client.query(
      `UPDATE biblioteca_items SET puntuacion = NULL, actualizado_en = now()
       WHERE usuario_id = $1 AND contenido_id = $2
       RETURNING ${BARE_COLUMNS}`,
      [userId, contenidoId]
    );
    return rows[0] || null;
  },

  async listRated(userId, client = pool) {
    const { rows } = await client.query(
      `${WITH_CONTENT} WHERE bi.usuario_id = $1 AND bi.puntuacion IS NOT NULL
       ORDER BY bi.actualizado_en DESC`,
      [userId]
    );
    return rows;
  },
};
