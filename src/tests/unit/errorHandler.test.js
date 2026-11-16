import assert from 'node:assert/strict';
import { it } from 'node:test';
import errorHandler from '../../middlewares/errorHandler.js';
import { conflict } from '../../utils/errors.js';

function responseFor(error, t) {
  t.mock.method(console, 'error', () => {});
  const res = {
    status(value) { this.statusCode = value; return this; },
    json(value) { this.body = value; return this; },
  };
  errorHandler(error, {}, res, () => assert.fail('No debe delegar la respuesta'));
  return res;
}

for (const [constraint, code] of [
  ['usuarios_email_key', 'EMAIL_TAKEN'],
  ['usuarios_username_key', 'USERNAME_TAKEN'],
  ['colecciones_usuario_id_nombre_key', 'COLLECTION_NAME_TAKEN'],
  ['otra_restriccion_unique', 'CONFLICT'],
]) {
  it(`responde 409 para ${constraint} sin exponer detalles SQL`, (t) => {
    const res = responseFor({
      code: '23505', constraint,
      message: 'duplicate key value violates unique constraint',
      detail: 'Key (email)=(privado@example.com) already exists.',
    }, t);
    assert.equal(res.statusCode, 409);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, code);
    assert.ok(res.body.error.message);
    assert.doesNotMatch(JSON.stringify(res.body), /23505|duplicate key|privado@example.com/);
  });
}

it('mantiene los conflictos controlados por la aplicación', (t) => {
  const res = responseFor(conflict('Ya existe', 'REVIEW_EXISTS'), t);
  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.body.error, { code: 'REVIEW_EXISTS', message: 'Ya existe' });
});

it('no convierte otros errores de PostgreSQL en conflictos', (t) => {
  const res = responseFor({ code: '08006', message: 'connection failure' }, t);
  assert.equal(res.statusCode, 500);
});

it('delega si la respuesta ya fue enviada', () => {
  const error = new Error('fallo');
  let forwarded;
  errorHandler(error, {}, { headersSent: true }, (err) => { forwarded = err; });
  assert.equal(forwarded, error);
});
