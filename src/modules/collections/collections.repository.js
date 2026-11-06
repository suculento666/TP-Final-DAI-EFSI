import pool from '../../database/pool.js';
import { catalogRepository } from '../catalog/catalog.repository.js';

const COL_COLUMNS = 'id, usuario_id, nombre, descripcion, color, creado_en';

export const collectionsRepository = {
  async list(userId, client = pool) {
    const { rows } = await client.query(
      `SELECT ${COL_COLUMNS} FROM colecciones WHERE usuario_id = $1 ORDER BY creado_en DESC`,
      [userId]
    );
    return rows;
  },

  // Solo devuelve la colección si pertenece al usuario (control de propiedad).
  async findByIdOwned(userId, id, client = pool) {
    const { rows } = await client.query(
      `SELECT ${COL_COLUMNS} FROM colecciones WHERE id = $1 AND usuario_id = $2`,
      [id, userId]
    );
    return rows[0] || null;
  },

  // Crea. ON CONFLICT (usuario_id, nombre) DO NOTHING -> null para 409.
  async create(userId, { nombre, descripcion, color }, client = pool) {
    const { rows } = await client.query(
      `INSERT INTO colecciones (usuario_id, nombre, descripcion, color)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (usuario_id, nombre) DO NOTHING
       RETURNING ${COL_COLUMNS}`,
      [userId, nombre, descripcion ?? null, color ?? null]
    );
    return rows[0] || null;
  },

  // Actualiza campos editables. `fields` viene filtrado por el service (whitelist).
  async update(userId, id, fields, client = pool) {
    const entries = Object.entries(fields);
    if (!entries.length) return this.findByIdOwned(userId, id, client);
    const sets = [];
    const values = [id, userId];
    entries.forEach(([key, value], idx) => {
      sets.push(`${key} = $${idx + 3}`);
      values.push(value);
    });
    const { rows } = await client.query(
      `UPDATE colecciones SET ${sets.join(', ')} WHERE id = $1 AND usuario_id = $2 RETURNING ${COL_COLUMNS}`,
      values
    );
    return rows[0] || null;
  },

  async remove(userId, id, client = pool) {
    const { rows } = await client.query(
      `DELETE FROM colecciones WHERE id = $1 AND usuario_id = $2 RETURNING id`,
      [id, userId]
    );
    return rows[0] || null;
  },

  // Items de una colección (con datos del contenido), solo si es del usuario.
  async listItems(userId, coleccionId, client = pool) {
    const owned = await this.findByIdOwned(userId, coleccionId, client);
    if (!owned) return { collection: null, items: [] };
    const { rows } = await client.query(
      `SELECT ci.coleccion_id, ci.contenido_id, ci.agregado_en,
        c.spotify_id, c.tipo, c.titulo, c.artista, c.album, c.generos, c.portada_url
       FROM coleccion_items ci JOIN contenidos c ON c.id = ci.contenido_id
       WHERE ci.coleccion_id = $1 ORDER BY ci.agregado_en DESC`,
      [coleccionId]
    );
    return { collection: owned, items: rows };
  },

  // Agrega un contenido. Verifica propiedad de la colección y existencia del contenido.
  async addItem(userId, coleccionId, contenidoId, client = pool) {
    const owned = await this.findByIdOwned(userId, coleccionId, client);
    if (!owned) return { error: 'collection_not_found' };
    const content = await catalogRepository.findById(contenidoId, client);
    if (!content) return { error: 'content_not_found' };
    const { rows } = await client.query(
      `INSERT INTO coleccion_items (coleccion_id, contenido_id) VALUES ($1, $2)
       ON CONFLICT (coleccion_id, contenido_id) DO NOTHING
       RETURNING coleccion_id`,
      [coleccionId, contenidoId]
    );
    return { added: rows.length > 0 };
  },

  async removeItem(userId, coleccionId, contenidoId, client = pool) {
    const owned = await this.findByIdOwned(userId, coleccionId, client);
    if (!owned) return { error: 'collection_not_found' };
    const { rows } = await client.query(
      `DELETE FROM coleccion_items WHERE coleccion_id = $1 AND contenido_id = $2 RETURNING coleccion_id`,
      [coleccionId, contenidoId]
    );
    return { removed: rows.length > 0 };
  },
};
