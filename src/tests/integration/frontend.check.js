// Exercises the sibling frontend's real services through Vite and Express.
// PostgreSQL uses a disposable schema; only Spotify is replaced by a fixture.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { once } from 'node:events';
import app from '../../app.js';
import pool from '../../database/pool.js';
import { spotifyProvider } from '../../modules/catalog/catalog.provider.js';

const frontend = resolve(process.env.FRONTEND_DIR || '../TPFINAL-frontend');
const load = (file) => import(pathToFileURL(resolve(frontend, file)));
const { createServer } = await load('node_modules/vite/dist/node/index.js');
const { authService: auth } = await load('src/services/authService.js');
const { musicService: music } = await load('src/services/musicService.js');
const { libraryService: library } = await load('src/services/libraryService.js');
const { collectionService: collections } = await load('src/services/collectionService.js');
const { ratingService: ratings } = await load('src/services/ratingService.js');
const { reviewService: reviews } = await load('src/services/reviewService.js');
const { statisticsService: statistics } = await load('src/services/statisticsService.js');
const schema = `frontend_check_${randomBytes(8).toString('hex')}`;
const fixture = { spotify_id: 'frontend_fixture', tipo: 'track', titulo: 'Integration track', artista: 'Test artist', generos: ['rock'] };
const originalFetch = globalThis.fetch;
const originalTrack = spotifyProvider.getTrack;
const originalSearch = spotifyProvider.search;
let server, vite, created = false;
try {
  pool.options.max = 1;
  await pool.query(`CREATE SCHEMA ${schema}`);
  created = true;
  await pool.query(`SET search_path TO ${schema}`);
  pool.options.options = `-c search_path=${schema}`;
  await pool.query(await readFile(new URL('../../../db/migrations/001_init_v2.sql', import.meta.url), 'utf8'));
  spotifyProvider.getTrack = async () => fixture;
  spotifyProvider.search = async () => ({ tracks: [fixture], albums: [] });
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const backend = `http://127.0.0.1:${server.address().port}`;
  // Load the actual Vite config, overriding only the target and test ports.
  vite = await createServer({ root: frontend, server: { port: 0, host: '127.0.0.1', proxy: { '/api': { target: backend } } } });
  await vite.listen();
  const origin = `http://127.0.0.1:${vite.httpServer.address().port}`;
  let cookie = '';
  globalThis.fetch = async (path, options = {}) => {
    assert.equal(options.credentials, 'include');
    const response = await originalFetch(new URL(path, origin), { ...options, headers: { ...options.headers, ...(cookie ? { Cookie: cookie } : {}) } });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    return response;
  };
  await assert.rejects(auth.me(), e => e.status === 401);
  const password = randomBytes(16).toString('hex');
  const account = { username: 'frontend_test', email: 'frontend@example.com', password, passwordConfirm: password };
  const { user } = await auth.register(account);
  assert.ok(cookie.startsWith('mc_token='));
  assert.equal((await auth.me()).user.id, user.id);
  await auth.update({ bio: 'Frontend integration', generos_preferidos: ['rock'] });
  assert.equal((await auth.me()).user.bio, 'Frontend integration');
  const results = await music.search('test', 'track');
  assert.equal(results[0].title, fixture.titulo);
  const detail = await music.detail(fixture.spotify_id, 'track');
  assert.equal(typeof detail.contentId, 'number');
  await assert.rejects(reviews.save(detail.contentId, 'Great track', false),
    { status: 409, code: 'REVIEW_REQUIRES_LIBRARY' });
  await assert.rejects(ratings.set(detail.contentId, 5),
    { status: 409, code: 'RATING_REQUIRES_LIBRARY' });
  assert.deepEqual(await library.list(), []);
  await library.add(detail);
  await reviews.save(detail.contentId, 'Great track', false);
  let [item] = await library.list();
  assert.equal(item.contentId, detail.contentId);
  await library.state(item.contentId, 'escuchado');
  await library.favorite(item.contentId, true);
  await ratings.set(item.contentId, 5);
  [item] = await library.list();
  assert.equal(item.status, 'Escuchado');
  assert.equal(item.es_favorito, true);
  assert.equal(item.puntuacion, 5);
  await reviews.save(item.contentId, 'Edited review', true);
  assert.equal((await reviews.get(item.contentId)).review.texto, 'Edited review');
  const { collection } = await collections.create('My collection');
  await collections.addItem(collection.id, item.contentId);
  assert.equal((await collections.detail(collection.id)).items[0].spotify_id, fixture.spotify_id);
  await collections.update(collection.id, 'Renamed');
  assert.equal((await collections.list())[0].nombre, 'Renamed');
  const stats = await statistics.get();
  assert.equal(stats.favoritos, 1);
  assert.equal(stats.total_resenas, 1);
  assert.equal(stats.actividad_por_mes.reduce((total, month) => total + month.acciones, 0), 4);
  assert.deepEqual((await statistics.activity()).map(entry => entry.tipo).sort(), [
    'agregar_a_coleccion', 'agregar_biblioteca', 'crear_coleccion', 'marcar_favorito',
  ]);
  await collections.removeItem(collection.id, item.contentId);
  await collections.remove(collection.id);
  await reviews.remove(item.contentId);
  await ratings.clear(item.contentId);
  await library.favorite(item.contentId, false);
  await library.remove(item.contentId);
  assert.deepEqual(await library.list(), []);
  await auth.logout();
  await assert.rejects(auth.me(), e => e.status === 401);
  await auth.login({ email: account.email, password });
  assert.equal((await auth.me()).user.id, user.id);
  console.log('PASS: frontend services -> Vite proxy -> Express -> PostgreSQL; auth, catalog fixture, library, favorites, ratings, reviews, collections, profile, statistics and logout.');
} finally {
  globalThis.fetch = originalFetch;
  spotifyProvider.getTrack = originalTrack;
  spotifyProvider.search = originalSearch;
  if (vite) await vite.close();
  if (server) await new Promise(resolve => server.close(resolve));
  try {
    if (created) {
      await pool.query('ROLLBACK');
      await pool.query('SET search_path TO public');
      assert.match(schema, /^frontend_check_[a-f0-9]{16}$/);
      await pool.query(`DROP SCHEMA ${schema} CASCADE`);
    }
  } finally { await pool.end(); }
}
