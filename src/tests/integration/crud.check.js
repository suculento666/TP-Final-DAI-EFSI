// Ejecutar manualmente: node src/tests/integration/crud.check.js
// Usa PostgreSQL real y la API HTTP local, en un esquema descartable.
// Solo Spotify se sustituye en los casos marcados como fixture.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import pool from '../../database/pool.js';
import app from '../../app.js';
import { spotifyProvider } from '../../modules/catalog/catalog.provider.js';

const schema = `crud_check_${randomBytes(8).toString('hex')}`;
const results = [];
const nativeFetch = globalThis.fetch;
const originalError = console.error;
const originalGetTrack = spotifyProvider.getTrack;
let server;
let created = false;
let base;
let lastResponse;

globalThis.fetch = (url, options = {}) => nativeFetch(url, {
  ...options, signal: options.signal || AbortSignal.timeout(15000),
});
// Las respuestas de error se registran por caso, sin imprimir stacks repetidos.
console.error = () => {};

async function request(method, path, cookie, body) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await response.json();
  const result = { status: response.status, json, cookie: response.headers.get('set-cookie')?.split(';')[0] };
  lastResponse = result;
  return result;
}

async function check(name, run) {
  lastResponse = null;
  try {
    await run();
    results.push({ name, ok: true });
    console.log(`PASS ${name}`);
  } catch (error) {
    const result = {
      name, ok: false,
      error: error.message,
      ...(lastResponse ? { actualStatus: lastResponse.status, apiError: lastResponse.json.error } : {}),
    };
    results.push(result);
    console.log(`FAIL ${name}: ${JSON.stringify(result)}`);
  }
}

async function expect(method, path, cookie, body, status, validate = () => {}) {
  const res = await request(method, path, cookie, body);
  assert.equal(res.status, status);
  assert.equal(res.json.success, status < 400);
  await validate(res.json.data, res.json.error);
  return res;
}

async function scalar(sql, values = []) {
  return (await pool.query(sql, values)).rows[0];
}

try {
  // Una conexión y search_path sin public: ninguna consulta de la aplicación
  // puede caer por accidente en las tablas de los usuarios existentes.
  pool.options.max = 1;
  await pool.query(`CREATE SCHEMA ${schema}`);
  created = true;
  await pool.query(`SET search_path TO ${schema}`);
  pool.options.options = `-c search_path=${schema}`;
  await pool.query(await readFile(new URL('../../../db/migrations/001_init_v2.sql', import.meta.url), 'utf8'));
  assert.equal((await scalar('SELECT current_schema() AS name')).name, schema);
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}/api`;
  console.log('PostgreSQL real: esquema temporal inicializado.');

  const password = randomBytes(16).toString('hex');
  const account = (name) => ({ username: name, email: `${name}@example.com`, password, passwordConfirm: password });
  const a = await expect('POST', '/auth/register', null, account('crud_a'), 201);
  const b = await expect('POST', '/auth/register', null, account('crud_b'), 201);
  const ca = a.cookie;
  const cb = b.cookie;
  const uid = a.json.data.user.id;
  assert.ok(ca && cb);

  await check('Auth: registro no expone hash y persiste contraseña hasheada', async () => {
    assert.equal(a.json.data.user.password_hash, undefined);
    const row = await scalar('SELECT password_hash FROM usuarios WHERE id=$1', [uid]);
    assert.notEqual(row.password_hash, password);
    assert.match(row.password_hash, /^\$2[ab]\$/);
  });
  await check('Auth: login correcto y sesión por cookie', async () => {
    const login = await expect('POST', '/auth/login', null, { email: 'crud_a@example.com', password }, 200);
    await expect('GET', '/auth/me', login.cookie, null, 200, (d) => assert.equal(d.user.id, uid));
  });
  await check('Auth: contraseña incorrecta => 401', () => expect('POST', '/auth/login', null, { email: 'crud_a@example.com', password: 'incorrecta' }, 401));
  await check('Auth: email duplicado => 409', () => expect('POST', '/auth/register', null, { ...account('crud_c'), email: 'crud_a@example.com' }, 409, (d, e) => assert.equal(e.code, 'EMAIL_TAKEN')));
  await check('Auth: username duplicado => 409', () => expect('POST', '/auth/register', null, { ...account('crud_a'), email: 'crud_c@example.com' }, 409, (d, e) => assert.equal(e.code, 'USERNAME_TAKEN')));
  for (const path of ['/library', '/favorites', '/ratings', '/reviews', '/collections', '/users/me', '/activity', '/statistics']) {
    await check(`Sin sesión: GET ${path} => 401`, () => expect('GET', path, null, null, 401));
  }
  await check('Perfil: editar, leer y comprobar persistencia', async () => {
    await expect('PATCH', '/users/me', ca, { bio: 'Perfil de prueba', generos_preferidos: ['rock'] }, 200, (d) => assert.equal(d.user.bio, 'Perfil de prueba'));
    await expect('GET', '/users/me', ca, null, 200, (d) => assert.deepEqual(d.user.generos_preferidos, ['rock']));
    assert.equal((await scalar('SELECT bio FROM usuarios WHERE id=$1', [uid])).bio, 'Perfil de prueba');
    await expect('GET', '/users/me', cb, null, 200, (d) => assert.equal(d.user.bio, null));
  });

  await check('Spotify real: buscar canciones', () => expect('GET', '/catalog/search?q=Muse&tipo=track&limit=1', ca, null, 200, (d) => assert.ok(d.tracks.length > 0)));
  await check('Spotify real: agregar a biblioteca => 201', () => expect('POST', '/library', ca, {
    contenido: { spotify_id: '7ouMYWpwJ422jRcDASZB7P', tipo: 'track', titulo: 'Título falso' },
  }, 201, (d) => assert.notEqual(d.item.contenido.titulo, 'Título falso')));
  // Aislar el resultado de Spotify de los siguientes casos del CRUD.
  await pool.query('DELETE FROM biblioteca_items WHERE usuario_id=$1', [uid]);

  const fixture = { spotify_id: 'crud_fixture_track', tipo: 'track', titulo: 'Oficial de prueba', artista: 'Artista de prueba', generos: ['rock'] };
  const previousTitle = 'Título previo al intento de escritura';
  const content = await scalar(`INSERT INTO contenidos (spotify_id,tipo,titulo,artista,generos) VALUES ($1,$2,$3,$4,$5) RETURNING id`, [fixture.spotify_id, fixture.tipo, previousTitle, fixture.artista, fixture.generos]);
  const cid = content.id;
  // Sin sustituir Express, servicios, repositorios ni PostgreSQL. Esta respuesta
  // controlada permite comprobar el CRUD aunque Spotify esté inaccesible.
  spotifyProvider.getTrack = async () => fixture;
  let createResponse;
  await check('Biblioteca CREATE (Spotify fixture): devuelve 201 y metadatos oficiales', async () => {
    createResponse = await request('POST', '/library', ca, {
    contenido: { spotify_id: fixture.spotify_id, tipo: 'track', titulo: 'Falso' }, estado: 'escuchando',
    });
    assert.equal(createResponse.status, 201);
    const d = createResponse.json.data;
    assert.equal(d.item.contenido.titulo, fixture.titulo);
    assert.equal((await scalar('SELECT estado FROM biblioteca_items WHERE usuario_id=$1 AND contenido_id=$2', [uid, cid])).estado, 'escuchando');
  });
  spotifyProvider.getTrack = originalGetTrack;
  if (createResponse?.status >= 400) await check('Biblioteca: fallo de CREATE no deja cambios parciales', async () => {
    const row = await scalar('SELECT titulo FROM contenidos WHERE id=$1', [cid]);
    assert.equal(row.titulo, previousTitle);
    assert.equal((await scalar('SELECT count(*)::int AS n FROM biblioteca_items WHERE usuario_id=$1 AND contenido_id=$2', [uid, cid])).n, 0);
    assert.equal((await scalar("SELECT count(*)::int AS n FROM actividad WHERE usuario_id=$1 AND tipo='agregar_biblioteca'", [uid])).n, 0);
  });

  // Fixture SQL independiente: permite probar READ/UPDATE/DELETE aun si CREATE falla.
  await pool.query(`INSERT INTO biblioteca_items (usuario_id,contenido_id,estado,es_favorito,puntuacion) VALUES ($1,$2,'quiero_escuchar',FALSE,NULL)
    ON CONFLICT (usuario_id,contenido_id) DO UPDATE SET estado='quiero_escuchar',es_favorito=FALSE,puntuacion=NULL`, [uid, cid]);
  await check('Biblioteca READ: datos y filtro por usuario', async () => {
    await expect('GET', '/library', ca, null, 200, (d) => {
      assert.equal(d.items.length, 1); assert.equal(d.items[0].contenido_id, cid); assert.equal(d.items[0].estado, 'quiero_escuchar');
    });
    await expect('GET', '/library', cb, null, 200, (d) => assert.equal(d.items.length, 0));
  });
  await check('Biblioteca UPDATE: estado escuchado', () => expect('PATCH', `/library/${cid}`, ca, { estado: 'escuchado' }, 200, async (d) => {
    assert.equal(d.item.estado, 'escuchado');
    assert.equal((await scalar('SELECT estado FROM biblioteca_items WHERE usuario_id=$1 AND contenido_id=$2', [uid, cid])).estado, 'escuchado');
  }));
  await check('Biblioteca: estado inválido => 400', () => expect('PATCH', `/library/${cid}`, ca, { estado: 'invalido' }, 400));
  await check('Biblioteca: otro usuario no puede editar => 404', () => expect('PATCH', `/library/${cid}`, cb, { estado: 'escuchado' }, 404));

  await check('Favoritos CREATE: es_favorito=true', () => expect('POST', `/favorites/${cid}`, ca, null, 200, async (d) => {
    assert.equal(d.item.es_favorito, true);
    assert.equal((await scalar('SELECT es_favorito FROM biblioteca_items WHERE usuario_id=$1 AND contenido_id=$2', [uid, cid])).es_favorito, true);
  }));
  await pool.query('UPDATE biblioteca_items SET es_favorito=TRUE WHERE usuario_id=$1 AND contenido_id=$2', [uid, cid]);
  await check('Favoritos READ: devuelve favorito y aísla usuarios', async () => {
    await expect('GET', '/favorites', ca, null, 200, (d) => assert.equal(d.items[0].es_favorito, true));
    await expect('GET', '/favorites', cb, null, 200, (d) => assert.equal(d.items.length, 0));
  });
  await check('Favoritos DELETE: es_favorito=false', () => expect('DELETE', `/favorites/${cid}`, ca, null, 200, async (d) => {
    assert.equal(d.item.es_favorito, false);
    assert.equal((await scalar('SELECT es_favorito FROM biblioteca_items WHERE usuario_id=$1 AND contenido_id=$2', [uid, cid])).es_favorito, false);
  }));

  for (const score of [5, 3]) {
    await check(`Puntuaciones CREATE/UPDATE: puntuacion=${score}`, () => expect('PUT', `/ratings/${cid}`, ca, { puntuacion: score }, 200, async (d) => {
      assert.equal(d.item.puntuacion, score);
      assert.equal((await scalar('SELECT puntuacion FROM biblioteca_items WHERE usuario_id=$1 AND contenido_id=$2', [uid, cid])).puntuacion, score);
    }));
  }
  await pool.query('UPDATE biblioteca_items SET puntuacion=4 WHERE usuario_id=$1 AND contenido_id=$2', [uid, cid]);
  await check('Puntuaciones READ: devuelve 4 y aísla usuarios', async () => {
    await expect('GET', '/ratings', ca, null, 200, (d) => assert.equal(d.items[0].puntuacion, 4));
    await expect('GET', '/ratings', cb, null, 200, (d) => assert.equal(d.items.length, 0));
  });
  await check('Puntuaciones DELETE: puntuacion=null', () => expect('DELETE', `/ratings/${cid}`, ca, null, 200, async (d) => {
    assert.equal(d.item.puntuacion, null);
    assert.equal((await scalar('SELECT puntuacion FROM biblioteca_items WHERE usuario_id=$1 AND contenido_id=$2', [uid, cid])).puntuacion, null);
  }));
  await check('Puntuaciones: valor fuera de rango => 400', () => expect('PUT', `/ratings/${cid}`, ca, { puntuacion: 6 }, 400));

  await check('Reseñas CREATE: texto y persistencia', () => expect('POST', `/reviews/${cid}`, ca, { texto: 'Buena canción' }, 201, async (d) => {
    assert.equal(d.review.texto, 'Buena canción');
    assert.equal((await scalar('SELECT texto FROM resenas WHERE usuario_id=$1 AND contenido_id=$2', [uid, cid])).texto, 'Buena canción');
  }));
  await check('Reseñas: duplicado => 409', () => expect('POST', `/reviews/${cid}`, ca, { texto: 'Duplicada' }, 409));
  await check('Reseñas READ: listado y detalle', async () => {
    await expect('GET', '/reviews', ca, null, 200, (d) => assert.equal(d.items.length, 1));
    await expect('GET', `/reviews/${cid}`, ca, null, 200, (d) => assert.equal(d.review.texto, 'Buena canción'));
    await expect('GET', `/reviews/${cid}`, cb, null, 200, (d) => assert.equal(d.review, null));
  });
  await check('Reseñas UPDATE: nuevo texto persistido', () => expect('PATCH', `/reviews/${cid}`, ca, { texto: 'Excelente canción' }, 200, async (d) => {
    assert.equal(d.review.texto, 'Excelente canción');
    assert.equal((await scalar('SELECT texto FROM resenas WHERE usuario_id=$1 AND contenido_id=$2', [uid, cid])).texto, 'Excelente canción');
  }));
  await check('Reseñas: otro usuario no puede editar => 404', () => expect('PATCH', `/reviews/${cid}`, cb, { texto: 'Ajena' }, 404));
  await check('Reseñas: texto vacío => 400', () => expect('POST', `/reviews/${cid}`, ca, { texto: '   ' }, 400));

  let col;
  await check('Colecciones CREATE: nombre y persistencia', async () => {
    const res = await expect('POST', '/collections', ca, { nombre: 'Rock', color: '#123456' }, 201, (d) => assert.equal(d.collection.nombre, 'Rock'));
    col = res.json.data.collection.id;
    assert.equal((await scalar('SELECT color FROM colecciones WHERE id=$1', [col])).color, '#123456');
  });
  if (col) {
    await check('Colecciones: nombre duplicado => 409', () => expect('POST', '/collections', ca, { nombre: 'Rock' }, 409));
    await expect('POST', '/collections', ca, { nombre: 'Pop' }, 201);
    await check('Colecciones UPDATE: conflicto de nombre => 409 y rollback', async () => {
      await expect('PATCH', `/collections/${col}`, ca, { nombre: 'Pop' }, 409, (d, e) => assert.equal(e.code, 'COLLECTION_NAME_TAKEN'));
      assert.equal((await scalar('SELECT nombre FROM colecciones WHERE id=$1', [col])).nombre, 'Rock');
    });
    await check('Colecciones UPDATE: nombre nuevo persistido', () => expect('PATCH', `/collections/${col}`, ca, { nombre: 'Rock editado' }, 200, async (d) => {
      assert.equal(d.collection.nombre, 'Rock editado');
      assert.equal((await scalar('SELECT nombre FROM colecciones WHERE id=$1', [col])).nombre, 'Rock editado');
    }));
    await check('Colecciones READ: listado y detalle', async () => {
      await expect('GET', '/collections', ca, null, 200, (d) => assert.equal(d.items.length, 2));
      await expect('GET', `/collections/${col}`, ca, null, 200, (d) => assert.equal(d.collection.nombre, 'Rock editado'));
    });
    await check('Colecciones: otro usuario no puede leer/editar/borrar', async () => {
      await expect('GET', `/collections/${col}`, cb, null, 404);
      await expect('PATCH', `/collections/${col}`, cb, { nombre: 'Ajena' }, 404);
      await expect('DELETE', `/collections/${col}`, cb, null, 404);
    });
    await check('Colecciones: agregar contenido y comprobar vínculo', () => expect('POST', `/collections/${col}/items`, ca, { contenidoId: cid }, 201, async (d) => {
      assert.equal(d.added, true);
      assert.equal((await scalar('SELECT count(*)::int AS n FROM coleccion_items WHERE coleccion_id=$1 AND contenido_id=$2', [col, cid])).n, 1);
    }));
    await check('Colecciones: agregar repetido no duplica => 200', () => expect('POST', `/collections/${col}/items`, ca, { contenidoId: cid }, 200, (d) => assert.equal(d.added, false)));
    await check('Colecciones: detalle incluye contenido', () => expect('GET', `/collections/${col}`, ca, null, 200, (d) => assert.equal(d.items[0].contenido_id, cid)));
    await check('Colecciones: otro usuario no puede agregar/quitar contenido', async () => {
      await expect('POST', `/collections/${col}/items`, cb, { contenidoId: cid }, 404);
      await expect('DELETE', `/collections/${col}/items/${cid}`, cb, null, 404);
    });
    await check('Colecciones: quitar contenido y comprobar borrado', () => expect('DELETE', `/collections/${col}/items/${cid}`, ca, null, 200, async (d) => {
      assert.equal(d.removed, true);
      assert.equal((await scalar('SELECT count(*)::int AS n FROM coleccion_items WHERE coleccion_id=$1', [col])).n, 0);
    }));
  }
  // Fuente conocida para estadísticas, independiente de qué escrituras fallaron.
  await pool.query("UPDATE biblioteca_items SET estado='quiero_escuchar',es_favorito=TRUE,puntuacion=4 WHERE usuario_id=$1 AND contenido_id=$2", [uid, cid]);
  await check('Estadísticas: valores reales del fixture', () => expect('GET', '/statistics', ca, null, 200, (d) => {
    assert.deepEqual(d.totales_por_tipo, [{ tipo: 'track', total: 1 }]);
    assert.deepEqual(d.distribucion_estados, [{ estado: 'quiero_escuchar', total: 1 }]);
    assert.equal(d.favoritos, 1);
    assert.equal(Number(d.promedio_puntuaciones.promedio), 4);
    assert.equal(d.total_resenas, 1);
    assert.equal(d.colecciones.length, 2);
    assert.deepEqual(d.generos_frecuentes, [{ genero: 'rock', total: 1 }]);
    assert.ok(d.actividad_por_mes[0].acciones > 0);
  }));
  await check('Actividad: registra acciones propias y aísla usuarios', async () => {
    await expect('GET', '/activity', ca, null, 200, (d) => {
      assert.ok(d.items.some(i => i.tipo === 'agregar_biblioteca'));
      assert.ok(d.items.every(i => i.tipo !== 'crear_reseña'));
      assert.ok(d.items.every(i => i.usuario_id === uid));
    });
    await expect('GET', '/activity', cb, null, 200, (d) => assert.equal(d.items.length, 0));
  });
  await check('Reseñas DELETE: elimina registro', async () => {
    await expect('DELETE', `/reviews/${cid}`, ca, null, 200);
    assert.equal((await scalar('SELECT count(*)::int AS n FROM resenas WHERE usuario_id=$1', [uid])).n, 0);
  });
  if (col) await check('Colecciones DELETE: elimina registro y conserva historial', async () => {
    await expect('DELETE', `/collections/${col}`, ca, null, 200);
    assert.equal((await scalar('SELECT count(*)::int AS n FROM colecciones WHERE id=$1', [col])).n, 0);
    await expect('GET', `/collections/${col}`, ca, null, 404);
    assert.equal((await scalar("SELECT count(*)::int AS n FROM actividad WHERE usuario_id=$1 AND tipo='borrar_coleccion' AND coleccion_id IS NULL", [uid])).n, 1);
  });
  await check('Biblioteca: otro usuario no puede borrar => 404', () => expect('DELETE', `/library/${cid}`, cb, null, 404));
  await check('Biblioteca DELETE: elimina registro', async () => {
    await expect('DELETE', `/library/${cid}`, ca, null, 200);
    assert.equal((await scalar('SELECT count(*)::int AS n FROM biblioteca_items WHERE usuario_id=$1', [uid])).n, 0);
  });
  await check('Biblioteca: borrar inexistente => 404', () => expect('DELETE', `/library/${cid}`, ca, null, 404));
  await check('Logout: respuesta y eliminación de cookie', async () => {
    const res = await expect('POST', '/auth/logout', ca, null, 200);
    assert.equal(res.cookie, 'mc_token=');
  });
} finally {
  spotifyProvider.getTrack = originalGetTrack;
  globalThis.fetch = nativeFetch;
  console.error = originalError;
  if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  try {
    if (created) {
      assert.match(schema, /^crud_check_[a-f0-9]{16}$/);
      await pool.query('ROLLBACK');
      await pool.query('SET search_path TO public');
      await pool.query(`DROP SCHEMA ${schema} CASCADE`);
      const remaining = await scalar('SELECT count(*)::int AS n FROM information_schema.schemata WHERE schema_name=$1', [schema]);
      assert.equal(remaining.n, 0);
      console.log('CLEANUP OK: esquema temporal eliminado; tablas existentes sin cambios.');
    }
  } finally { await pool.end(); }
}

console.log(JSON.stringify({ total: results.length, passed: results.filter(r => r.ok).length, failed: results.filter(r => !r.ok).length }, null, 2));
if (results.some(r => !r.ok)) process.exitCode = 1;
