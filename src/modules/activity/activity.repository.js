import pool from '../../database/pool.js';
import { RECENT_ACTIVITY_TYPES, VALID_ACTIVITY_TYPES } from './activity.constants.js';

const ACT_COLUMNS = 'id, usuario_id, tipo, contenido_id, coleccion_id, detalle, creado_en';

// Re-exportado para compatibilidad con código existente que lo importara directamente.
export const VALID_TYPES = VALID_ACTIVITY_TYPES;

export const activityRepository = {
  // Registra una acción. `client` permite ejecutarse dentro de una transacción.
  async record({ userId, tipo, contenidoId = null, coleccionId = null, detalle = null }, client = pool) {
    const { rows } = await client.query(
      `INSERT INTO actividad (usuario_id, tipo, contenido_id, coleccion_id, detalle)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING ${ACT_COLUMNS}`,
      [userId, tipo, contenidoId, coleccionId, detalle ?? null]
    );
    return rows[0];
  },

  // Actividad reciente por defecto; el filtro por tipo consulta el historial.
  async list(userId, { limit = 50, tipo } = {}, client = pool) {
    const lim = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const { rows } = await client.query(
      `SELECT ${ACT_COLUMNS} FROM actividad
       WHERE usuario_id = $1 AND tipo = ANY($2::text[])
       ORDER BY creado_en DESC
       LIMIT $3`,
      [userId, tipo ? [tipo] : RECENT_ACTIVITY_TYPES, lim]
    );
    return rows;
  },
};
