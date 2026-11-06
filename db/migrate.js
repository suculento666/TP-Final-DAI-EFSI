// Runner de migraciones — estrategia del equipo: scripts SQL ordenados,
// aplicados manualmente (sin tabla schema_migrations).
//
// Ejecuta SOLO los archivos NNN_*.sql de db/migrations en orden alfabético.
// Archivos con prefijo "pending_" se ignoran; deben aplicarse a mano.
//
// Archivos en db/migrations/:
//   001_init_v2.sql                  → se ejecuta (esquema base)
//   002_seed_prueba.sql              → se ejecuta (datos demo)
//   pending_003_reproducciones.sql   → IGNORADO hasta aplicar manualmente
//
// Para aplicar una migración pendiente manualmente:
//   psql -U $DB_USER -d $DB_NAME -f db/migrations/pending_003_reproducciones.sql
//
// Comportamiento ante base ya inicializada:
//   Si detecta tablas del esquema principal, aborta ANTES de ejecutar SQL.
//   Nunca borra tablas ni bases de datos automáticamente.
//   Para re-inicializar desde cero:
//     dropdb my_collection && createdb my_collection && npm run migrate

import fs from 'node:fs/promises';
import path from 'node:path';
import pool from '../src/database/pool.js';

const MIGRATIONS_DIR = path.join(process.cwd(), 'db', 'migrations');
const LOCK_KEY = 872341;

// Tablas del esquema principal. Si alguna existe, la base ya fue inicializada.
const SCHEMA_TABLES = [
  'usuarios',
  'contenidos',
  'biblioteca_items',
  'resenas',
  'colecciones',
  'coleccion_items',
  'actividad',
];

// Solo archivos NNN_*.sql. Los prefijados con "pending_" se ignoran.
async function listSqlFiles() {
  const entries = await fs.readdir(MIGRATIONS_DIR);
  return entries
    .filter((f) => /^\d{3}_.*\.sql$/.test(f))
    .sort();
}

// Devuelve las tablas del esquema principal que ya existen en la base.
// Solo consulta el catálogo de PG — no toca datos ni estructura.
async function detectExistingTables(client) {
  const { rows } = await client.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_type = 'BASE TABLE'
       AND table_name = ANY($1::text[])`,
    [SCHEMA_TABLES]
  );
  return rows.map((r) => r.table_name);
}

async function migrate() {
  const files = await listSqlFiles();
  if (!files.length) {
    console.log(`No hay archivos .sql en ${MIGRATIONS_DIR}`);
    return;
  }

  const client = await pool.connect();
  try {
    // Serializa ejecuciones concurrentes del runner sobre la misma base.
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);

    // ── Comprobación previa del estado de la base ─────────────────────────
    const existing = await detectExistingTables(client);
    if (existing.length > 0) {
      console.error('✗ La base ya parece estar inicializada.');
      console.error(`  Tablas detectadas: ${existing.join(', ')}`);
      console.error('');
      console.error('  No se ejecutó ninguna migración.');
      console.error('  Si querés aplicarlas sobre una base limpia:');
      console.error('    dropdb my_collection && createdb my_collection');
      console.error('    npm run migrate');
      console.error('');
      console.error('  Si la base está parcialmente inicializada, inspeccioná');
      console.error('  el estado manualmente antes de continuar.');
      process.exitCode = 1;
      return;
    }

    // ── Ejecución de migraciones ──────────────────────────────────────────
    console.log(`Aplicando ${files.length} migración(es) en orden:\n`);

    for (const file of files) {
      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      try {
        await client.query(sql); // cada archivo gestiona su propia transacción
        console.log(`  ✓  ${file}`);
      } catch (err) {
        // Intenta limpiar cualquier transacción que el script haya dejado abierta.
        try { await client.query('ROLLBACK'); } catch { /* ignore */ }

        console.error(`\n✗ Fallo en: ${file}`);
        console.error(`  Código:  ${err.code || '(sin código)'}`);
        console.error(`  Detalle: ${err.message}`);
        console.error('\n  No se ejecutaron las migraciones siguientes.');
        throw err; // propaga para que .catch() salga con código 1
      }
    }

    console.log('\n✓ Todas las migraciones aplicadas correctamente.');
  } finally {
    try { await client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]); } catch { /* ignore */ }
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  // El mensaje ya fue impreso en el catch del bucle; aquí solo garantizamos
  // que el proceso salga con código distinto de cero.
  if (!err._logged) {
    console.error('\n✗ Error inesperado:', err.message);
  }
  process.exit(1);
});
