import pool from '../../database/pool.js';

// Columnas públicas de usuarios (sin password_hash).
const PUBLIC_COLUMNS =
  'id, username, email, avatar_url, bio, generos_preferidos, creado_en';

export const usersRepository = {
  async findById(id) {
    const { rows } = await pool.query(
      `SELECT ${PUBLIC_COLUMNS} FROM usuarios WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  // Actualiza solo los campos editables provistos. `fields` viene filtrado
  // por el service desde una lista fija (EDITABLE), así que las claves del
  // SET son seguras (no input directo del cliente).
  async updateProfile(id, fields) {
    const entries = Object.entries(fields);
    if (!entries.length) return this.findById(id); // nada que actualizar

    const sets = [];
    const values = [id];
    entries.forEach(([key, value], idx) => {
      sets.push(`${key} = $${idx + 2}`);
      values.push(value);
    });

    const { rows } = await pool.query(
      `UPDATE usuarios SET ${sets.join(', ')}
       WHERE id = $1
       RETURNING ${PUBLIC_COLUMNS}`,
      values
    );
    return rows[0] || null;
  },
};
