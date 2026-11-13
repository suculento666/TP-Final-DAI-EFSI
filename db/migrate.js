// Runner de migraciones — estrategia del equipo: scripts SQL ordenados,
// aplicados en dos modos según el estado de la base.
//
// Archivos en db/migrations/:
//   001_init_v2.sql              → esquema base
//   002_seed_prueba.sql          → datos demo
//   003_reproducciones.sql       → tabla de reproducciones
//   004_actividad_nuevos_tipos.sql → amplía CHECK de actividad.tipo (aditiva)
//   005_seed_reproducciones.sql  → reproducciones simuladas demo (aditiva)
//
// MODO 1 — base limpia (npm run migrate):
//   Ejecuta todos los archivos NNN_*.sql en orden.
//   Aborta si ya detecta tablas del esquema principal.
//
// MODO 2 — base ya inicializada (npm run migrate:add):
//   Ejecuta solo los archivos marcados como "aditivos" (NNN_*.sql con
//   número >= 4, o sea los que no forman el esquema/seed inicial).
//   No verifica si las tablas existen; es responsabilidad del DBA
//   asegurarse de no aplicar la misma migración dos veces.
//
// Para re-inicializar desde cero:
//   dropdb my_collection && createdb my_collection && npm run migrate

import fs from 'node:fs/promises';
import path from 'node:path';
import pool from '../src/database/pool.js';

const MIGRATIONS_DIR = path.join(process.cwd(), 'db', 'migrations');
const LOCK_KEY = 872341;

// Migraciones iniciales (001-003): crean el esquema y los datos demo.
// Si alguna tabla del esquema principal ya existe, no se vuelven a aplicar.
const SCHEMA_TABLES = [
  'usuarios',
  'contenidos',
  'biblioteca_items',
  'resenas',
  'colecciones',
  'coleccion_items',
  'actividad',
];

// Número de migración a partir del cual se considera "aditiva".
// Las migraciones 001-003 son el esquema base; 004+ son incrementales.
const ADDITIVE_FROM = 4;

// Solo archivos NNN_*.sql (sin prefijo "pending_").
async function listSqlFiles() {
  const entries = await fs.readdir(MIGRATIONS_DIR);
  return entries
    .filter((f) => /^\d{3}_.*\.sql$/.test(f))
    .sort();
}

// Separa los archivos en "base" (001-003) y "aditivos" (004+).
function splitFiles(files) {
  const base = [];
  const additive = [];
  for (const f of files) {
    const num = parseInt(f.slice(0, 3), 10);
    (num < ADDITIVE_FROM ? base : additive).push(f);
  }
  return { base, additive };
}

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

async function runFiles(files, client, label) {
  if (!files.length) {
    console.log(`  (sin archivos ${label})`);
    return;
  }
  for (const file of files) {
    const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
    try {
      await client.query(sql);
      console.log(`  ✓  ${file}`);
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch { /* ignore */ }
      console.error(`\n✗ Fallo en: ${file}`);
      console.error(`  Código:  ${err.code || '(sin código)'}`);
      console.error(`  Detalle: ${err.message}`);
      console.error('\n  No se ejecutaron las migraciones siguientes.');
      throw err;
    }
  }
}

async function migrate() {
  // El modo "add" solo aplica las migraciones aditivas (004+).
  const additiveOnly = process.argv.includes('--add');

  const allFiles = await listSqlFiles();
  if (!allFiles.length) {
    console.log(`No hay archivos .sql en ${MIGRATIONS_DIR}`);
    return;
  }

  const { base, additive } = splitFiles(allFiles);

  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);

    if (additiveOnly) {
      // ── MODO: solo migraciones aditivas ──────────────────────────────────
      console.log(`Aplicando ${additive.length} migración(es) aditiva(s):\n`);
      await runFiles(additive, client, 'aditivos');
      console.log('\n✓ Migraciones aditivas aplicadas correctamente.');
    } else {
      // ── MODO: inicialización completa (base debe estar vacía) ─────────────
      const existing = await detectExistingTables(client);
      if (existing.length > 0) {
        console.error('✗ La base ya parece estar inicializada.');
        console.error(`  Tablas detectadas: ${existing.join(', ')}`);
        console.error('');
        console.error('  Opciones:');
        console.error('  · Para aplicar solo migraciones aditivas (004+):');
        console.error('      npm run migrate:add');
        console.error('  · Para re-inicializar desde cero:');
        console.error('      dropdb my_collection && createdb my_collection && npm run migrate');
        process.exitCode = 1;
        return;
      }
      const filesToRun = [...base, ...additive];
      console.log(`Aplicando ${filesToRun.length} migración(es) en orden:\n`);
      await runFiles(filesToRun, client, 'todos');
      console.log('\n✓ Todas las migraciones aplicadas correctamente.');
    }
  } finally {
    try { await client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]); } catch { /* ignore */ }
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  if (!err._logged) {
    console.error('\n✗ Error inesperado:', err.message);
  }
  process.exit(1);
});
