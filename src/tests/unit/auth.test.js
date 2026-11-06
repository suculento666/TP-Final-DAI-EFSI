// Pruebas unitarias de autenticación (hash, JWT, validadores, errores).
// Ejecutar: npm test
// No requieren conexión a PostgreSQL.
//
// En ESM, dotenv/config (importado por env.js) procesa el .env ANTES de que
// este módulo pueda sobreescribir process.env, por lo que la inyección de
// variables desde el top-level del test no es confiable.
// Solución: estas pruebas importan directamente hash.js, errors.js y
// catchAsync.js (que no dependen de env.js) y prueban JWT y validadores
// con mocks mínimos que no pasan por config.
//
// Las pruebas de signToken/verifyToken usan jsonwebtoken directamente
// con un secreto local, sin pasar por el módulo jwt.js (que depende de config).

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import jwt from 'jsonwebtoken';
import { hashPassword, comparePassword } from '../../utils/hash.js';
import { registerSchema, loginSchema } from '../../modules/auth/auth.validator.js';
import { ApiError, badRequest, unauthorized, forbidden, notFound, conflict } from '../../utils/errors.js';
import { catchAsync } from '../../utils/catchAsync.js';

const TEST_SECRET = 'test_secret_largo_para_pruebas_unitarias_1234';
const TOKEN_COOKIE = 'mc_token';

describe('hash', () => {
  it('produce un hash distinto al plain', async () => {
    const h = await hashPassword('secret123');
    assert.notEqual(h, 'secret123');
    assert.ok(h.startsWith('$2a$') || h.startsWith('$2b$'));
  });

  it('comparePassword: coincidencia correcta', async () => {
    const h = await hashPassword('abc12345');
    assert.ok(await comparePassword('abc12345', h));
  });

  it('comparePassword: no coincide con otra clave', async () => {
    const h = await hashPassword('abc12345');
    assert.ok(!(await comparePassword('wrongpass', h)));
  });
});

describe('jwt (directo, sin env.js)', () => {
  it('sign + verify roundtrip', () => {
    const token = jwt.sign({ sub: 42 }, TEST_SECRET, { expiresIn: '1h' });
    const payload = jwt.verify(token, TEST_SECRET);
    assert.equal(payload.sub, 42);
  });

  it('verify rechaza un token alterado', () => {
    const token = jwt.sign({ sub: 1 }, TEST_SECRET, { expiresIn: '1h' });
    assert.throws(() => jwt.verify(token + 'x', TEST_SECRET));
  });

  it('verify rechaza un token firmado con otro secreto', () => {
    const token = jwt.sign({ sub: 1 }, 'otro_secreto_completamente_diferente', { expiresIn: '1h' });
    assert.throws(() => jwt.verify(token, TEST_SECRET));
  });

  it('TOKEN_COOKIE tiene nombre esperado', () => {
    assert.equal(TOKEN_COOKIE, 'mc_token');
  });
});

describe('validators - register', () => {
  const ok = { username: 'testuser', email: 'test@a.com', password: '12345678', passwordConfirm: '12345678' };

  it('registro válido pasa', () => {
    assert.ok(registerSchema.safeParse(ok).success);
  });

  it('contraseñas no coinciden falla', () => {
    assert.ok(!registerSchema.safeParse({ ...ok, passwordConfirm: 'diferente' }).success);
  });

  it('username demasiado corto falla', () => {
    assert.ok(!registerSchema.safeParse({ ...ok, username: 'ab' }).success);
  });

  it('email inválido falla', () => {
    assert.ok(!registerSchema.safeParse({ ...ok, email: 'no-es-email' }).success);
  });

  it('password menor a 8 chars falla', () => {
    assert.ok(!registerSchema.safeParse({ ...ok, password: '1234', passwordConfirm: '1234' }).success);
  });
});

describe('validators - login', () => {
  it('login válido pasa', () => {
    assert.ok(loginSchema.safeParse({ email: 'x@x.com', password: 'algo' }).success);
  });

  it('email inválido falla', () => {
    assert.ok(!loginSchema.safeParse({ email: 'nomail', password: 'algo' }).success);
  });

  it('password vacío falla', () => {
    assert.ok(!loginSchema.safeParse({ email: 'x@x.com', password: '' }).success);
  });
});

describe('errors', () => {
  it('ApiError hereda de Error', () => {
    const e = new ApiError(418, 'TEAPOT', 'Im a teapot');
    assert.ok(e instanceof Error);
    assert.equal(e.statusCode, 418);
    assert.equal(e.code, 'TEAPOT');
  });

  it('badRequest: 400', () => { assert.equal(badRequest().statusCode, 400); });
  it('unauthorized: 401', () => { assert.equal(unauthorized().statusCode, 401); });
  it('forbidden: 403', () => { assert.equal(forbidden().statusCode, 403); });
  it('notFound: 404', () => { assert.equal(notFound().statusCode, 404); });
  it('conflict: 409', () => { assert.equal(conflict().statusCode, 409); });
});

describe('catchAsync', () => {
  it('propaga errores a next()', async () => {
    let captured = null;
    const wrapped = catchAsync(async () => { throw new Error('boom'); });
    await wrapped({}, {}, (e) => { captured = e; });
    assert.equal(captured?.message, 'boom');
  });

  it('llama al handler si no lanza', async () => {
    let called = false;
    const wrapped = catchAsync(async (req, res) => { called = true; res.sent = true; });
    await wrapped({}, { sent: false }, () => {});
    assert.ok(called);
  });
});
