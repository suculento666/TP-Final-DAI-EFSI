import pool from '../../database/pool.js';

// Acceso a datos de la tabla reproducciones.
// La tabla la crea 003_reproducciones.sql.

export const playsRepository = {
  // Registra una reproducción real (es_simulada = false por defecto).
  async record({ userId, contenidoId, reproducidoEn, duracionSeg = null, esSimulada = false }, client = pool) {
    const { rows } = await client.query(
      `INSERT INTO reproducciones
         (usuario_id, contenido_id, reproducido_en, duracion_seg, es_simulada)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, usuario_id, contenido_id, reproducido_en, duracion_seg, es_simulada, creado_en`,
      [userId, contenidoId, reproducidoEn ?? new Date(), duracionSeg, esSimulada]
    );
    return rows[0];
  },

  // Artistas más escuchados: cantidad de reproducciones por artista.
  async topArtists(userId, { limit = 5 } = {}, client = pool) {
    const lim = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 20);
    const { rows } = await client.query(
      `SELECT c.artista, count(*)::int AS reproducciones
       FROM reproducciones r
       JOIN contenidos c ON c.id = r.contenido_id
       WHERE r.usuario_id = $1
       GROUP BY c.artista
       ORDER BY reproducciones DESC
       LIMIT $2`,
      [userId, lim]
    );
    return rows;
  },

  // Canciones más reproducidas (solo tracks).
  async topTracks(userId, { limit = 5 } = {}, client = pool) {
    const lim = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 20);
    const { rows } = await client.query(
      `SELECT c.id, c.spotify_id, c.titulo, c.artista, c.portada_url,
              count(*)::int AS reproducciones
       FROM reproducciones r
       JOIN contenidos c ON c.id = r.contenido_id
       WHERE r.usuario_id = $1 AND c.tipo = 'track'
       GROUP BY c.id
       ORDER BY reproducciones DESC
       LIMIT $2`,
      [userId, lim]
    );
    return rows;
  },

  // Hábitos de escucha: reproducciones por hora del día (en hora de Argentina).
  async listeningByHour(userId, client = pool) {
    const { rows } = await client.query(
      `SELECT extract(hour FROM reproducido_en AT TIME ZONE 'America/Argentina/Buenos_Aires')::int AS hora,
              count(*)::int AS reproducciones
       FROM reproducciones
       WHERE usuario_id = $1
       GROUP BY hora
       ORDER BY hora`,
      [userId]
    );
    return rows;
  },

  // Géneros más escuchados (basado en reproducciones reales, no solo biblioteca).
  async topGenres(userId, { limit = 5 } = {}, client = pool) {
    const lim = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 20);
    const { rows } = await client.query(
      `SELECT g AS genero, count(*)::int AS reproducciones
       FROM reproducciones r
       JOIN contenidos c ON c.id = r.contenido_id
       CROSS JOIN LATERAL unnest(c.generos) AS g
       WHERE r.usuario_id = $1
       GROUP BY g
       ORDER BY reproducciones DESC
       LIMIT $2`,
      [userId, lim]
    );
    return rows;
  },

  // Historial paginado del usuario.
  async list(userId, { limit = 50, offset = 0 } = {}, client = pool) {
    const lim = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const off = Math.max(parseInt(offset, 10) || 0, 0);
    const { rows } = await client.query(
      `SELECT r.id, r.contenido_id, r.reproducido_en, r.duracion_seg, r.es_simulada,
              c.spotify_id, c.tipo, c.titulo, c.artista, c.portada_url
       FROM reproducciones r
       JOIN contenidos c ON c.id = r.contenido_id
       WHERE r.usuario_id = $1
       ORDER BY r.reproducido_en DESC
       LIMIT $2 OFFSET $3`,
      [userId, lim, off]
    );
    return rows;
  },
};
