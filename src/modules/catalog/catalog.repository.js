import pool from '../../database/pool.js';

// Persistencia del catálogo en `contenidos`. El catálogo es compartido:
// cualquier usuario puede referenciar el mismo contenido. Upsert por spotify_id.

const COLUMNS =
  'id, spotify_id, tipo, titulo, artista, album, generos, portada_url, ' +
  'duracion_ms, total_canciones, fecha_lanzamiento, creado_en';

export const catalogRepository = {
  // Upsert: si el contenido ya existe (por spotify_id), actualiza los metadatos.
  // Devuelve la fila persistida. No inventa datos: lo que no venga queda NULL.
  async upsertContenido(c) {
    const { rows } = await pool.query(
      `INSERT INTO contenidos
         (spotify_id, tipo, titulo, artista, album, generos, portada_url,
          duracion_ms, total_canciones, fecha_lanzamiento)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (spotify_id) DO UPDATE SET
         titulo          = EXCLUDED.titulo,
         artista         = EXCLUDED.artista,
         album           = EXCLUDED.album,
         generos         = EXCLUDED.generos,
         portada_url     = EXCLUDED.portada_url,
         duracion_ms     = EXCLUDED.duracion_ms,
         total_canciones = EXCLUDED.total_canciones,
         fecha_lanzamiento = EXCLUDED.fecha_lanzamiento
       RETURNING ${COLUMNS}`,
      [
        c.spotify_id, c.tipo, c.titulo, c.artista, c.album,
        c.generos || [], c.portada_url, c.duracion_ms,
        c.total_canciones, c.fecha_lanzamiento,
      ]
    );
    return rows[0];
  },

  async findBySpotifyId(spotifyId) {
    const { rows } = await pool.query(
      `SELECT ${COLUMNS} FROM contenidos WHERE spotify_id = $1`,
      [spotifyId]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT ${COLUMNS} FROM contenidos WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  },
};
