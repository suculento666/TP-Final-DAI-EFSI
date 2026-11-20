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
  // Muestra los avisos (RAISE NOTICE) de los scripts SQL, p. ej. la verificación del seed.
  client.on('notice', (n) => console.log(`     ℹ ${n.message}`));
  try {
    // Serializa ejecuciones concurrentes del runner sobre la misma base.
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);

    // ── Comprobación previa del estado de la base ─────────────────────────
    const existing = await detectExistingTables(client);
    if (existing.length > 0) {
      const dbName = process.env.DB_NAME || '<nombre_de_tu_base>';
      const missing = SCHEMA_TABLES.filter((t) => !existing.includes(t));
      const parcial = missing.length > 0;

      console.error(
        parcial
          ? `✗ La base "${dbName}" está PARCIALMENTE inicializada.`
          : `✗ La base "${dbName}" ya está inicializada.`
      );
      console.error(`  Tablas detectadas: ${existing.join(', ')}`);
      if (parcial) console.error(`  Tablas que faltan: ${missing.join(', ')}`);
      console.error('');
      console.error('  No se ejecutó ninguna migración (ni se tocó ningún dato).');
      console.error('');
      console.error('  Para empezar de cero:');
      console.error(`    1) Creá una base vacía distinta, o borrá y recreá "${dbName}"`);
      console.error('       (en DBeaver: clic derecho sobre la base → Delete / Create New Database).');
      console.error('    2) Verificá que DB_NAME en el .env apunte a esa base vacía.');
      console.error('    3) Corré: npm run migrate');
      if (parcial) {
        console.error('');
        console.error('  Como el estado es parcial, inspeccionalo antes de borrar nada.');
      }
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
        err._logged = true;
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

