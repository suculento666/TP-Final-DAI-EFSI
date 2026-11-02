import app from './src/app.js';
import config from './src/config/env.js';
import pool from './src/database/pool.js';

async function startServer() {
  // Verificamos la conexión a PostgreSQL antes de aceptar requests.
  // Si la BD no está disponible, el servidor no arranca.
  try {
    const client = await pool.connect();
    console.log('✓ Conexión a PostgreSQL establecida');
    client.release();
  } catch (err) {
    console.error('✗ No se pudo conectar a PostgreSQL:', err.message);
    console.error('  Verificá que PostgreSQL esté corriendo y que las variables de entorno sean correctas.');
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log(`✓ Servidor corriendo en http://localhost:${config.port}`);
    console.log(`  Entorno: ${config.nodeEnv}`);
    console.log(`  Health check: http://localhost:${config.port}/api/health`);
  });
}

startServer();
