// Runner de migraciones — estrategia del equipo: scripts SQL ordenados,
// aplicados en orden (sin tabla de tracking; el equipo aplica manualmente).
//
// Ejecuta los .sql de db/migrations en orden alfabético, pero SOLO los que
// empiezan con tres dígitos (NNN_*.sql). Archivos con prefijo "pending_"
// se ignoran y deben aplicarse a mano cuando estén listos.
//
// Archivos en db/migrations/:
//   001_init_v2.sql              → se ejecuta (esquema base)
//   002_seed_prueba.sql          → se ejecuta (datos demo)
//   pending_003_reproducciones.sql → IGNORADO hasta aplicar manualmente
//
// Para aplicar una migración pendiente:
//   psql -U $DB_USER -d $DB_NAME -f db/migrations/pending_003_reproducciones.sql
//
//   npm run migrate

import fs from 'node:fs/promises';
import path from 'node:path';
import pool from '../src/database/pool.js';

const MIGRATIONS_DIR = path.join(process.cwd(), 'db', 'migrations');
const LOCK_KEY = 872341;

// Solo archivos que empiezan con NNN_ (tres dígitos + guión bajo).
// Los prefijados con "pending_" se ignoran.
async function listSqlFiles() {
  const entries = await fs.readdir(MIGRATIONS_DIR);
  return entries
    .filter((f) => /^\d{3}_.*\.sql$/.test(f))
    .sort();
}

async function migrate() {
  const files = await listSqlFiles();
  if (!files.length) {
    console.log(`No hay archivos .sql en ${MIGRATIONS_DIR}`);
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);

    console.log(`Aplicando ${files.length} migracion(es) en orden:\n`);
    for (const file of files) {
      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      try {
        await client.query(sql);
        console.log(`  OK  ${file}`);
      } catch (err) {
        try { await client.query('ROLLBACK'); } catch { /* ignore */ }

        // 42P07 = "relation already exists": la base ya fue inicializada.
        // 23505 = unique_violation en el seed: los datos demo ya están cargados.
        // En ambos casos informamos claramente en lugar de lanzar un error críptico.
        if (err.code === '42P07') {
          console.warn(`  SKIP ${file}: las tablas ya existen (base ya inicializada).`);
          console.warn('         Si querés re-inicializar, creá la base desde cero con:');
          console.warn('         dropdb my_collection && createdb my_collection');
          continue;
        }
        if (err.code === '23505') {
          console.warn(`  SKIP ${file}: datos ya presentes (seed ya aplicado).`);
          continue;
        }

        console.error(`  FAIL ${file}: ${err.message}`);
        throw err;
      }
    }

    console.log('\nMigraciones aplicadas.');
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
