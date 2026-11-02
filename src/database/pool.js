import pg from 'pg';
import config from '../config/env.js';

const { Pool } = pg;

// Un solo pool compartido por toda la aplicación.
// pg maneja internamente la reutilización de conexiones.
const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
  // Máximo de conexiones simultáneas. 10 es razonable para desarrollo.
  max: 10,
  // Tiempo máximo de espera para obtener una conexión del pool (ms)
  connectionTimeoutMillis: 5000,
  // Tiempo máximo que una conexión puede estar inactiva antes de cerrarse (ms)
  idleTimeoutMillis: 30000,
});

// Listener de errores en conexiones idle.
// Sin esto, un error de red silencioso puede tirar el proceso entero.
pool.on('error', (err) => {
  console.error('Error inesperado en cliente PostgreSQL idle:', err.message);
});

export default pool;
