import assert from 'node:assert/strict';
import { it } from 'node:test';

// Configuración de prueba: no se leen credenciales locales ni se abre una BD real.
Object.assign(process.env, {
  DB_NAME: 'test', DB_USER: 'test', DB_PASSWORD: 'test',
  JWT_SECRET: 'test_secret_largo_para_pruebas_unitarias_1234',
});
const { default: pool } = await import('../../database/pool.js');
const { libraryService } = await import('../../modules/library/library.service.js');
const { libraryRepository } = await import('../../modules/library/library.repository.js');
const { catalogRepository } = await import('../../modules/catalog/catalog.repository.js');
const { spotifyProvider } = await import('../../modules/catalog/catalog.provider.js');
const { activityRepository } = await import('../../modules/activity/activity.repository.js');
const { addItemSchema } = await import('../../modules/library/library.validator.js');
const { ApiError } = await import('../../utils/errors.js');

it('acepta solo ID y tipo y descarta los metadatos del cliente', () => {
  const identity = { spotify_id: 'abc', tipo: 'track' };
  assert.deepEqual(addItemSchema.parse({ contenido: identity }).contenido, identity);
  assert.deepEqual(addItemSchema.parse({
    contenido: { ...identity, titulo: 'Falso', artista: 'Inventado', generos: ['falso'] },
  }).contenido, identity);
});

for (const tipo of ['track', 'album']) {
  it(`guarda metadatos oficiales de ${tipo} aunque el cliente envíe otros`, async (t) => {
    const official = {
      spotify_id: 'abc', tipo, titulo: 'Oficial', artista: 'Artista real', generos: ['rock'],
    };
    let connected = false;
    const provider = t.mock.method(spotifyProvider, tipo === 'track' ? 'getTrack' : 'getAlbum', async (id) => {
      assert.equal(id, 'abc');
      assert.equal(connected, false, 'Spotify se consulta antes de abrir la transacción');
      return official;
    });
    const queries = [];
    const client = { query: async (sql) => { queries.push(sql); }, release() {} };
    t.mock.method(pool, 'connect', async () => { connected = true; return client; });
    t.mock.method(catalogRepository, 'upsertContenido', async (content, tx) => {
      assert.deepEqual(content, official);
      assert.equal(tx, client);
      return { ...content, id: 12 };
    });
    t.mock.method(libraryRepository, 'create', async (userId, contentId, estado, tx) => {
      assert.equal(userId, 7);
      assert.equal(contentId, 12);
      assert.equal(estado, 'escuchando');
      assert.equal(tx, client);
      return { id: 20, usuario_id: userId, contenido_id: contentId, estado };
    });
    const activity = t.mock.method(activityRepository, 'record', async () => {});
    // Se llama al servicio directamente para verificar que tampoco confía en el
    // body si se omite el middleware de validación.
    const result = await libraryService.add(7, {
      contenido: { spotify_id: 'abc', tipo, titulo: 'Falso', artista: 'Inventado', generos: ['falso'] },
      estado: 'escuchando',
    });
    assert.equal(provider.mock.callCount(), 1);
    assert.equal(result.contenido.titulo, 'Oficial');
    assert.equal(activity.mock.callCount(), 1);
    assert.deepEqual(queries, ['BEGIN', 'COMMIT']);
  });
}

it('si Spotify no encuentra el contenido, responde 404 sin abrir una transacción', async (t) => {
  t.mock.method(spotifyProvider, 'getTrack', async () => null);
  const connect = t.mock.method(pool, 'connect', async () => assert.fail('No debe abrir la BD'));
  await assert.rejects(
    libraryService.add(7, { contenido: { spotify_id: 'missing', tipo: 'track' } }),
    { statusCode: 404, code: 'SPOTIFY_NOT_FOUND' },
  );
  assert.equal(connect.mock.callCount(), 0);
});

it('si Spotify falla, no guarda como alternativa los datos enviados por el cliente', async (t) => {
  t.mock.method(spotifyProvider, 'getTrack', async () => {
    throw new ApiError(502, 'SPOTIFY_ERROR', 'Spotify no disponible');
  });
  const connect = t.mock.method(pool, 'connect', async () => assert.fail('No debe abrir la BD'));
  await assert.rejects(libraryService.add(7, {
    contenido: { spotify_id: 'abc', tipo: 'track', titulo: 'Falso' },
  }), { statusCode: 502, code: 'SPOTIFY_ERROR' });
  assert.equal(connect.mock.callCount(), 0);
});
