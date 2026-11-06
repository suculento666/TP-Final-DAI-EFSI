// Runner de migraciones — estrategia del equipo: scripts SQL ordenados,
// aplicados en orden (sin tabla de tracking; el equipo aplica manualmente).
//
// Ejecuta los .sql de db/migrations en orden alfabético. Cada archivo gestiona
// su propia transacción (BEGIN ... COMMIT). Pensado para ejecutarse UNA sola
// vez sobre una base limpia. Re-ejecutar falla de forma segura: no duplica
// tablas existentes (CREATE TABLE choca y se revierte su transacción).
//
//   npm run migrate
//
// No reemplaza al flujo manual del equipo (psql -f); es una alternativa.

import fs from 'node:fs/promises';
import path from 'node:path';
import pool from '../src/database/pool.js';

const MIGRATIONS_DIR = path.join(process.cwd(), 'db', 'migrations');
const LOCK_KEY = 872341;

async function listSqlFiles() {
  const entries = await fs.readdir(MIGRATIONS_DIR);
  return entries.filter((f) => f.endsWith('.sql')).sort();
}

async function migrate() {
  const files = await listSqlFiles();
  if (!files.length) {
    console.log(`No hay archivos .sql en ${MIGRATIONS_DIR}`);
    return;
  }

  const client = await pool.connect();
  try {
    // Evita dos ejecuciones simultáneas del runner sobre la misma base.
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);

    console.log(`Aplicando ${files.length} migracion(es) en orden:\n`);
    for (const file of files) {
      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      try {
        await client.query(sql); // cada archivo trae su propio BEGIN/COMMIT
        console.log(`  OK  ${file}`);
      } catch (err) {
        // Limpia cualquier transacción que el script haya dejado abierta.
        try { await client.query('ROLLBACK'); } catch { /* ignore */ }
        console.error(`  FAIL ${file}: ${err.message}`);
        throw err;
      }
    }

    console.log('\nMigraciones aplicadas correctamente.');
  } finally {
    try { await client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]); } catch { /* ignore */ }
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('\nMigración fallida:', err.message);
  process.exit(1);
});
