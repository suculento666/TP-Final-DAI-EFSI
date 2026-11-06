// Pruebas de los validadores de los distintos módulos.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { updateProfileSchema } from '../../modules/users/users.validator.js';
import { searchQuerySchema } from '../../modules/catalog/catalog.validator.js';
import { addItemSchema, updateEstadoSchema, listQuerySchema } from '../../modules/library/library.validator.js';
import { ratingBodySchema } from '../../modules/ratings/ratings.validator.js';
import { reviewBodySchema } from '../../modules/reviews/reviews.validator.js';
import { createCollectionSchema, updateCollectionSchema, addItemSchema as colAddItemSchema } from '../../modules/collections/collections.validator.js';

describe('updateProfileSchema', () => {
  it('acepta objeto vacío (parche parcial)', () => {
    assert.ok(updateProfileSchema.safeParse({}).success);
  });
  it('acepta bio válida', () => {
    assert.ok(updateProfileSchema.safeParse({ bio: 'Hola mundo' }).success);
  });
  it('rechaza bio > 300 chars', () => {
    assert.ok(!updateProfileSchema.safeParse({ bio: 'a'.repeat(301) }).success);
  });
  it('rechaza campo extra (strict)', () => {
    assert.ok(!updateProfileSchema.safeParse({ admin: true }).success);
  });
  it('acepta generos_preferidos como array', () => {
    assert.ok(updateProfileSchema.safeParse({ generos_preferidos: ['pop', 'rock'] }).success);
  });
});

describe('searchQuerySchema', () => {
  it('q obligatorio', () => {
    assert.ok(!searchQuerySchema.safeParse({}).success);
  });
  it('q vacío falla', () => {
    assert.ok(!searchQuerySchema.safeParse({ q: '' }).success);
  });
  it('tipo válido: track', () => {
    assert.ok(searchQuerySchema.safeParse({ q: 'beatles', tipo: 'track' }).success);
  });
  it('tipo inválido falla', () => {
    assert.ok(!searchQuerySchema.safeParse({ q: 'beatles', tipo: 'video' }).success);
  });
});

describe('addItemSchema (library)', () => {
  const base = {
    contenido: { spotify_id: 'abc', tipo: 'track', titulo: 'Song X' },
  };
  it('acepta ítem mínimo', () => {
    assert.ok(addItemSchema.safeParse(base).success);
  });
  it('tipo album válido', () => {
    assert.ok(addItemSchema.safeParse({ contenido: { ...base.contenido, tipo: 'album' } }).success);
  });
  it('tipo inválido falla', () => {
    assert.ok(!addItemSchema.safeParse({ contenido: { ...base.contenido, tipo: 'video' } }).success);
  });
  it('estado válido pasa', () => {
    assert.ok(addItemSchema.safeParse({ ...base, estado: 'escuchando' }).success);
  });
  it('estado inválido falla', () => {
    assert.ok(!addItemSchema.safeParse({ ...base, estado: 'terminado' }).success);
  });
});

describe('updateEstadoSchema', () => {
  it('estado válido pasa', () => {
    assert.ok(updateEstadoSchema.safeParse({ estado: 'escuchado' }).success);
  });
  it('estado inválido falla', () => {
    assert.ok(!updateEstadoSchema.safeParse({ estado: 'abandoned' }).success);
  });
});

describe('ratingBodySchema', () => {
  it('puntuación 1 pasa', () => { assert.ok(ratingBodySchema.safeParse({ puntuacion: 1 }).success); });
  it('puntuación 5 pasa', () => { assert.ok(ratingBodySchema.safeParse({ puntuacion: 5 }).success); });
  it('puntuación 0 falla', () => { assert.ok(!ratingBodySchema.safeParse({ puntuacion: 0 }).success); });
  it('puntuación 6 falla', () => { assert.ok(!ratingBodySchema.safeParse({ puntuacion: 6 }).success); });
  it('puntuación decimal falla', () => { assert.ok(!ratingBodySchema.safeParse({ puntuacion: 3.5 }).success); });
});

describe('reviewBodySchema', () => {
  it('texto válido pasa', () => { assert.ok(reviewBodySchema.safeParse({ texto: 'Muy buena canción' }).success); });
  it('texto vacío falla', () => { assert.ok(!reviewBodySchema.safeParse({ texto: '' }).success); });
  it('solo espacios falla (trim)', () => { assert.ok(!reviewBodySchema.safeParse({ texto: '   ' }).success); });
});

describe('createCollectionSchema', () => {
  it('nombre obligatorio', () => { assert.ok(!createCollectionSchema.safeParse({}).success); });
  it('nombre válido pasa', () => { assert.ok(createCollectionSchema.safeParse({ nombre: 'Mis favoritos' }).success); });
  it('color hex válido', () => { assert.ok(createCollectionSchema.safeParse({ nombre: 'x', color: '#A1B2C3' }).success); });
  it('color hex inválido falla', () => { assert.ok(!createCollectionSchema.safeParse({ nombre: 'x', color: 'red' }).success); });
});

describe('colAddItemSchema', () => {
  it('contenidoId entero positivo pasa', () => {
    assert.ok(colAddItemSchema.safeParse({ contenidoId: 5 }).success);
  });
  it('contenidoId negativo falla', () => {
    assert.ok(!colAddItemSchema.safeParse({ contenidoId: -1 }).success);
  });
});

import { contenidoIdParamSchema, idParamSchema } from '../../validators/params.js';

describe('params coerce', () => {
  it('contenidoIdParamSchema: string numérico coerce -> number válido', () => {
    assert.ok(contenidoIdParamSchema.safeParse({ contenidoId: '5' }).success);
    assert.equal(contenidoIdParamSchema.safeParse({ contenidoId: '5' }).data.contenidoId, 5);
  });
  it('contenidoIdParamSchema: string no numérico falla', () => {
    assert.ok(!contenidoIdParamSchema.safeParse({ contenidoId: 'abc' }).success);
  });
  it('contenidoIdParamSchema: string "0" falla (no positivo)', () => {
    assert.ok(!contenidoIdParamSchema.safeParse({ contenidoId: '0' }).success);
  });
  it('idParamSchema: string numérico coerce -> number válido', () => {
    assert.ok(idParamSchema.safeParse({ id: '42' }).success);
    assert.equal(idParamSchema.safeParse({ id: '42' }).data.id, 42);
  });
});
