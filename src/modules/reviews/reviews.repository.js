import pool from '../../database/pool.js';

const REV_COLUMNS = 'id, usuario_id, contenido_id, texto, creado_en, actualizado_en';

const WITH_CONTENT = `
  SELECT r.id, r.usuario_id, r.contenido_id, r.texto, r.creado_en, r.actualizado_en,
    c.spotify_id, c.tipo, c.titulo, c.artista, c.album, c.portada_url
  FROM resenas r JOIN contenidos c ON c.id = r.contenido_id
`;

export const reviewsRepository = {
  async findByContenido(userId, contenidoId, client = pool) {
    const { rows } = await client.query(
      `SELECT ${REV_COLUMNS} FROM resenas WHERE usuario_id = $1 AND contenido_id = $2`,
      [userId, contenidoId]
    );
    return rows[0] || null;
  },

  // Crea atómicamente. ON CONFLICT DO NOTHING -> null si ya existe (para 409).
  async create(userId, contenidoId, texto, client = pool) {
    const { rows } = await client.query(
      `INSERT INTO resenas (usuario_id, contenido_id, texto)
       VALUES ($1, $2, $3)
       ON CONFLICT (usuario_id, contenido_id) DO NOTHING
       RETURNING ${REV_COLUMNS}`,
      [userId, contenidoId, texto]
    );
    return rows[0] || null;
  },

  async update(userId, contenidoId, texto, client = pool) {
    const { rows } = await client.query(
      `UPDATE resenas SET texto = $3, actualizado_en = now()
       WHERE usuario_id = $1 AND contenido_id = $2
       RETURNING ${REV_COLUMNS}`,
      [userId, contenidoId, texto]
    );
    return rows[0] || null;
  },

  async remove(userId, contenidoId, client = pool) {
    const { rows } = await client.query(
      `DELETE FROM resenas WHERE usuario_id = $1 AND contenido_id = $2 RETURNING id`,
      [userId, contenidoId]
    );
    return rows[0] || null;
  },

  async listMine(userId, client = pool) {
    const { rows } = await client.query(
      `${WITH_CONTENT} WHERE r.usuario_id = $1 ORDER BY r.creado_en DESC`,
      [userId]
    );
    return rows;
  },
};
