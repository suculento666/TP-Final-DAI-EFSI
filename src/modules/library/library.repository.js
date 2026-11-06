import pool from '../../database/pool.js';

// Datos personales del usuario sobre un contenido. Siempre filtra por usuario_id.
const ITEM_COLUMNS = `
  bi.id, bi.usuario_id, bi.contenido_id, bi.estado, bi.es_favorito,
  bi.puntuacion, bi.agregado_en, bi.actualizado_en
`;

// Joinea con contenidos para reconstruir la vista personal.
const ITEM_WITH_CONTENT = `
  SELECT ${ITEM_COLUMNS},
    c.spotify_id, c.tipo, c.titulo, c.artista, c.album, c.generos,
    c.portada_url, c.duracion_ms, c.total_canciones, c.fecha_lanzamiento
  FROM biblioteca_items bi
  JOIN contenidos c ON c.id = bi.contenido_id
`;

export const libraryRepository = {
  async list(userId, { estado, favorito, orderBy = 'agregado_en' } = {}, client = pool) {
    const allowedSort = ['agregado_en', 'actualizado_en', 'titulo'];
    const sort = allowedSort.includes(orderBy) ? orderBy : 'agregado_en';
    const where = ['bi.usuario_id = $1'];
    const params = [userId];
    let idx = 2;
    if (estado) {
      where.push(`bi.estado = $${idx++}`);
      params.push(estado);
    }
    if (favorito === true) where.push('bi.es_favorito = TRUE');
    const sortCol = sort === 'titulo' ? 'c.titulo' : `bi.${sort}`;
    const { rows } = await client.query(
      `${ITEM_WITH_CONTENT} WHERE ${where.join(' AND ')} ORDER BY ${sortCol} DESC`,
      params
    );
    return rows;
  },

  async findByContenido(userId, contenidoId, client = pool) {
    const { rows } = await client.query(
      `${ITEM_WITH_CONTENT} WHERE bi.usuario_id = $1 AND bi.contenido_id = $2`,
      [userId, contenidoId]
    );
    return rows[0] || null;
  },

  async create(userId, contenidoId, estado, client = pool) {
    const { rows } = await client.query(
      `INSERT INTO biblioteca_items (usuario_id, contenido_id, estado)
       VALUES ($1, $2, $3)
       ON CONFLICT (usuario_id, contenido_id) DO UPDATE
         SET estado = EXCLUDED.estado, actualizado_en = now()
       RETURNING ${ITEM_COLUMNS}`,
      [userId, contenidoId, estado]
    );
    return rows[0];
  },

  async updateEstado(userId, contenidoId, estado, client = pool) {
    const { rows } = await client.query(
      `UPDATE biblioteca_items
         SET estado = $3, actualizado_en = now()
       WHERE usuario_id = $1 AND contenido_id = $2
       RETURNING ${ITEM_COLUMNS}`,
      [userId, contenidoId, estado]
    );
    return rows[0] || null;
  },

  async remove(userId, contenidoId, client = pool) {
    const { rows } = await client.query(
      `DELETE FROM biblioteca_items
       WHERE usuario_id = $1 AND contenido_id = $2
       RETURNING id`,
      [userId, contenidoId]
    );
    return rows[0] || null;
  },
};
