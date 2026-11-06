import pool from '../database/pool.js';

// Ejecuta `fn(client)` dentro de una transacción: BEGIN, si todo OK COMMIT,
// si lanza ROLLBACK. El cliente se libera siempre. Las operaciones que tocan
// varias tablas (p.ej. agregar a biblioteca + registrar actividad) deben
// usar esto para mantener consistencia.
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    throw err;
  } finally {
    client.release();
  }
}
