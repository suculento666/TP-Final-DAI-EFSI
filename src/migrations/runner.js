// Runner de migraciones SQL.
// - Numeradas por nombre de archivo (001_... .sql, 002_... .sql, ...).
// - Registra las aplicadas en schema_migrations (idempotente: no aplica dos veces).
// - Cada migración corre en su propia transacción: si una falla, se revierte
//   solo esa y las anteriores quedan aplicadas; al corregir y re-ejecutar,
//   continúa desde la pendiente.
// - pg_advisory_lock serializa ejecuciones simultáneas del runner.
//
// Uso:
//   npm run migrate          -> aplica pendientes
//   npm run migrate:status   -> muestra aplicadas y pendientes

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from '../database/pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Clave fija para el advisory lock. Cualquier entero constante sirve;
// lo importante es que sea el mismo en cada ejecución del runner.
const ADVISORY_LOCK_KEY = 872341;

async function listSqlFiles() {
  const entries = await fs.readdir(__dirname);
  return entries.filter((f) => f.endsWith('.sql')).sort();
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         SERIAL PRIMARY KEY,
      filename   TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function getApplied(client) {
  const { rows } = await client.query(
    'SELECT filename, applied_at FROM schema_migrations ORDER BY filename'
  );
  return rows;
}

async function migrate() {
  const client = await pool.connect();
  try {
    // Bloqueo a nivel de sesión: persiste entre transacciones del mismo cliente.
    await client.query('SELECT pg_advisory_lock($1)', [ADVISORY_LOCK_KEY]);

    await ensureMigrationsTable(client);

    const appliedRows = await getApplied(client);
    const applied = new Set(appliedRows.map((r) => r.filename));
    const files = await listSqlFiles();
    const pending = files.filter((f) => !applied.has(f));

    // Detectar migraciones registradas cuyo archivo ya no existe (deriva).
    const missingOnDisk = [...applied].filter((f) => !files.includes(f));
    if (missingOnDisk.length) {
      console.warn(
        '⚠  Migraciones registradas pero ausentes en disco:',
        missingOnDisk.join(', ')
      );
    }

    if (!pending.length) {
      console.log('✓ No hay migraciones pendientes. Esquema al día.');
      return;
    }

    console.log(`Migraciones pendientes: ${pending.length}\n`);

    for (const file of pending) {
      const sql = await fs.readFile(path.join(__dirname, file), 'utf8');
      try {
        await client.query('BEGIN');
        await client.query(sql); // simple query: ejecuta todo el script
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✓ ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`✗ ${file}: ${err.message}`);
        throw err;
      }
    }

    console.log('\n✓ Migraciones aplicadas correctamente.');
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock($1)', [ADVISORY_LOCK_KEY]);
    } catch {
      /* ignore */
    }
    client.release();
    await pool.end();
  }
}

async function status() {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [ADVISORY_LOCK_KEY]);
    await ensureMigrationsTable(client);

    const appliedRows = await getApplied(client);
    const appliedSet = new Set(appliedRows.map((r) => r.filename));
    const files = await listSqlFiles();
    const pending = files.filter((f) => !appliedSet.has(f));

    console.log('Aplicadas:');
    if (!appliedRows.length) console.log('  (ninguna)');
    for (const r of appliedRows) {
      console.log(`  ✓ ${r.filename}  (${r.applied_at.toISOString()})`);
    }

    console.log('\nPendientes:');
    if (!pending.length) console.log('  (ninguna)');
    for (const f of pending) console.log(`  • ${f}`);
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock($1)', [ADVISORY_LOCK_KEY]);
    } catch {
      /* ignore */
    }
    client.release();
    await pool.end();
  }
}

const command = process.argv[2];

(async () => {
  try {
    if (command === 'status') {
      await status();
    } else {
      await migrate();
    }
  } catch (err) {
    console.error('\n✗ Migración fallida:', err.message);
    process.exit(1);
  }
})();
