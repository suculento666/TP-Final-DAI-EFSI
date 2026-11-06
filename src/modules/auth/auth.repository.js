import pool from '../../database/pool.js';

// Capa de acceso a datos de usuarios. Consultas parametrizadas siempre.
export const authRepository = {
  // Devuelve id + password_hash para validar login.
  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT id, username, email, password_hash FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  },

  // Solo para verificar disponibilidad del username al registrar.
  async findByUsername(username) {
    const { rows } = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    return rows[0] || null;
  },

  // Perfil público (sin password_hash) para /me.
  async findById(id) {
    const { rows } = await pool.query(
      `SELECT id, username, email, avatar_url, bio, preferences,
              created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async create({ username, email, password_hash }) {
    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, avatar_url, bio, preferences, created_at, updated_at`,
      [username, email, password_hash]
    );
    return rows[0];
  },
};
