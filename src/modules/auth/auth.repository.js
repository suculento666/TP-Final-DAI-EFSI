import pool from '../../database/pool.js';

// Columnas públicas de usuarios (sin password_hash). Reutilizadas en
// findById y en el RETURNING de create. Constante interna, sin input externo.
const PUBLIC_COLUMNS =
  'id, username, email, avatar_url, bio, generos_preferidos, creado_en';

// Capa de acceso a datos de usuarios, contra el esquema real (tabla: usuarios).
// Consultas parametrizadas siempre.
export const authRepository = {
  // Login: necesita password_hash para validar.
  async findByEmail(email) {
    const { rows } = await pool.query(
      `SELECT id, username, email, password_hash, avatar_url, bio,
              generos_preferidos, creado_en
       FROM usuarios WHERE email = $1`,
      [email]
    );
    return rows[0] || null;
  },

  // Solo verifica disponibilidad del username al registrar.
  async findByUsername(username) {
    const { rows } = await pool.query(
      'SELECT id FROM usuarios WHERE username = $1',
      [username]
    );
    return rows[0] || null;
  },

  // Perfil público (sin password_hash) para /me.
  async findById(id) {
    const { rows } = await pool.query(
      `SELECT ${PUBLIC_COLUMNS} FROM usuarios WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async create({ username, email, password_hash }) {
    const { rows } = await pool.query(
      `INSERT INTO usuarios (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING ${PUBLIC_COLUMNS}`,
      [username, email, password_hash]
    );
    return rows[0];
  },
};
