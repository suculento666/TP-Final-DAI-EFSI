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
  async setFavorite(userId, contenidoId, value, client = pool) {
    const content = await catalogRepository.findById(contenidoId, client);
    if (!content) return null;

    if (value) {
      // Marcar favorito: si el item no existe en biblioteca, lo crea con estado default.
      const { rows } = await client.query(
        `INSERT INTO biblioteca_items (usuario_id, contenido_id, estado, es_favorito)
         VALUES ($1, $2, 'quiero_escuchar', TRUE)
         ON CONFLICT (usuario_id, contenido_id) DO UPDATE
           SET es_favorito = TRUE, actualizado_en = now()
         RETURNING ${FAV_COLUMNS}`,
        [userId, contenidoId]
      );
      return rows[0];
    } else {
      // Quitar favorito: solo actualiza si el item ya existe en biblioteca.
      // No crea un item nuevo con es_favorito=false: no tendría sentido.
      const { rows } = await client.query(
        `UPDATE biblioteca_items
           SET es_favorito = FALSE, actualizado_en = now()
         WHERE usuario_id = $1 AND contenido_id = $2
         RETURNING ${FAV_COLUMNS}`,
        [userId, contenidoId]
      );
      return rows[0] || null; // null → el service lanza 404
    }
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
