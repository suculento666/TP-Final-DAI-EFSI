// Runner de migraciones con registro persistente.
//
// Mantiene una tabla `schema_migrations` en la misma base que registra qué
// archivos ya fueron aplicados. Esto hace el sistema idempotente: volver a
// ejecutar `npm run migrate` aplica únicamente las migraciones pendientes,
// sin importar cuántas veces se ejecute ni el estado actual de la base.
//
// Archivos en db/migrations/ (orden de aplicación):
//   001_init_v2.sql               → esquema base (7 tablas)
//   002_seed_prueba.sql           → datos demo
//   003_reproducciones.sql        → tabla reproducciones
//   004_actividad_nuevos_tipos.sql → amplía CHECK de actividad.tipo
//   005_seed_reproducciones.sql   → reproducciones simuladas demo
//
// Uso:
//   npm run migrate    → aplica todas las migraciones pendientes
//   npm run migrate:reset → (manual) dropdb + createdb + migrate
//
// Para resetear desde cero:
//   dropdb my_collection && createdb my_collection && npm run migrate

import fs from 'node:fs/promises';
import path from 'node:path';
import pool from '../src/database/pool.js';

const MIGRATIONS_DIR = path.join(process.cwd(), 'db', 'migrations');
const LOCK_KEY = 872341;

// Crea la tabla de registro si no existe.
// Se ejecuta siempre al inicio, antes de cualquier otra cosa.
async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ  NOT NULL DEFAULT now()
    )
  `);
}

// Devuelve el conjunto de migraciones ya aplicadas.
async function getApplied(client) {
  const { rows } = await client.query('SELECT filename FROM schema_migrations');
  return new Set(rows.map((r) => r.filename));
}

// Registra una migración como aplicada.
async function markApplied(client, filename) {
  await client.query(
    'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING',
    [filename]
  );
}

// Solo archivos NNN_*.sql, ordenados alfabéticamente.
async function listSqlFiles() {
  const entries = await fs.readdir(MIGRATIONS_DIR);
  return entries
    .filter((f) => /^\d{3}_.*\.sql$/.test(f))
    .sort();
}

async function migrate() {
  const allFiles = await listSqlFiles();
  if (!allFiles.length) {
    console.log(`No hay archivos .sql en ${MIGRATIONS_DIR}`);
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);

    // Garantiza que schema_migrations exista antes de consultarla.
    await ensureMigrationsTable(client);

    const applied = await getApplied(client);
    const pending = allFiles.filter((f) => !applied.has(f));

    if (!pending.length) {
      console.log('✓ No hay migraciones pendientes. La base está al día.');
      return;
    }

    console.log(`Aplicando ${pending.length} migración(es) pendiente(s):\n`);

    for (const file of pending) {
      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      try {
        await client.query(sql);
        await markApplied(client, file);
        console.log(`  ✓  ${file}`);
      } catch (err) {
        try { await client.query('ROLLBACK'); } catch { /* ignore */ }
        console.error(`\n✗ Fallo en: ${file}`);
        console.error(`  Código:  ${err.code || '(sin código)'}`);
        console.error(`  Detalle: ${err.message}`);
        console.error('\n  No se ejecutaron las migraciones siguientes.');
        process.exitCode = 1;
        return;
      }
    }

    console.log('\n✓ Todas las migraciones pendientes aplicadas correctamente.');
  } finally {
    try { await client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]); } catch { /* ignore */ }
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('\n✗ Error inesperado:', err.message);
  process.exit(1);
});
