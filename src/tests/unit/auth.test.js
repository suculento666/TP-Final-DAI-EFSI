// Pruebas unitarias de autenticación (hash, JWT, validadores, errores).
// Ejecutar: npm test
// No requieren conexión a PostgreSQL.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { hashPassword, comparePassword } from '../../utils/hash.js';
import { signToken, verifyToken, TOKEN_COOKIE, cookieOptions } from '../../utils/jwt.js';
import { registerSchema, loginSchema } from '../../modules/auth/auth.validator.js';
import { ApiError, badRequest, unauthorized, forbidden, notFound, conflict } from '../../utils/errors.js';
import { catchAsync } from '../../utils/catchAsync.js';

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

describe('jwt', () => {
  it('signToken + verifyToken roundtrip', () => {
    const token = signToken({ sub: 42 });
    const payload = verifyToken(token);
    assert.equal(payload.sub, 42);
  });

  it('verifyToken rechaza un token alterado', () => {
    const token = signToken({ sub: 1 });
    assert.throws(() => verifyToken(token + 'x'));
  });

  it('cookieOptions: httpOnly y no Secure en development', () => {
    const opts = cookieOptions();
    assert.ok(opts.httpOnly);
    assert.equal(opts.secure, false);
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
