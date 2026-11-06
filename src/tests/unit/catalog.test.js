// Pruebas unitarias de la capa de catálogo.
// Prueban la normalización de datos de Spotify (sin llamar a la API real).

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// Funciones de normalización extraídas de catalog.provider.js para testeo aislado.
function firstImage(images) {
  return Array.isArray(images) && images.length ? images[0]?.url ?? null : null;
}

function normalizeTrack(t, genreMap = {}) {
  const artist = t.artists?.[0];
  return {
    spotify_id: t.id,
    tipo: 'track',
    titulo: t.name,
    artista: artist?.name ?? null,
    album: t.album?.name ?? null,
    generos: genreMap[artist?.id] || [],
    portada_url: firstImage(t.album?.images),
    duracion_ms: t.duration_ms ?? null,
    total_canciones: null,
    fecha_lanzamiento: t.album?.release_date ?? null,
  };
}

function normalizeAlbum(a, genreMap = {}) {
  const artist = a.artists?.[0];
  return {
    spotify_id: a.id,
    tipo: 'album',
    titulo: a.name,
    artista: artist?.name ?? null,
    album: null,
    generos: genreMap[artist?.id] || [],
    portada_url: firstImage(a.images),
    duracion_ms: null,
    total_canciones: a.total_tracks ?? null,
    fecha_lanzamiento: a.release_date ?? null,
  };
}

describe('normalizeTrack', () => {
  const track = {
    id: 'abc123',
    name: 'Test Song',
    duration_ms: 200000,
    artists: [{ id: 'a1', name: 'Artista X' }],
    album: { name: 'Test Album', release_date: '2023-01-01', images: [{ url: 'http://img.com/x.jpg' }] },
  };

  it('mapea correctamente los campos obligatorios', () => {
    const r = normalizeTrack(track);
    assert.equal(r.spotify_id, 'abc123');
    assert.equal(r.tipo, 'track');
    assert.equal(r.titulo, 'Test Song');
    assert.equal(r.artista, 'Artista X');
    assert.equal(r.album, 'Test Album');
    assert.equal(r.duracion_ms, 200000);
    assert.equal(r.fecha_lanzamiento, '2023-01-01');
    assert.equal(r.portada_url, 'http://img.com/x.jpg');
  });

  it('usa géneros del mapa si el artista existe', () => {
    const r = normalizeTrack(track, { a1: ['pop', 'rock'] });
    assert.deepEqual(r.generos, ['pop', 'rock']);
  });

  it('géneros vacíos si no hay entrada en el mapa', () => {
    const r = normalizeTrack(track, {});
    assert.deepEqual(r.generos, []);
  });

  it('artista null si no viene artists', () => {
    const r = normalizeTrack({ ...track, artists: [] });
    assert.equal(r.artista, null);
  });

  it('total_canciones siempre null para tracks', () => {
    const r = normalizeTrack(track);
    assert.equal(r.total_canciones, null);
  });
});

describe('normalizeAlbum', () => {
  const album = {
    id: 'alb456',
    name: 'Album Test',
    total_tracks: 12,
    release_date: '2022-05-10',
    artists: [{ id: 'a2', name: 'Banda Y' }],
    images: [{ url: 'http://img.com/alb.jpg' }, { url: 'http://img.com/alb2.jpg' }],
  };

  it('tipo es album', () => {
    assert.equal(normalizeAlbum(album).tipo, 'album');
  });

  it('album siempre null para álbumes', () => {
    assert.equal(normalizeAlbum(album).album, null);
  });

  it('total_canciones mapeado correctamente', () => {
    assert.equal(normalizeAlbum(album).total_canciones, 12);
  });

  it('portada_url toma la primera imagen', () => {
    assert.equal(normalizeAlbum(album).portada_url, 'http://img.com/alb.jpg');
  });

  it('portada_url null si no hay imágenes', () => {
    assert.equal(normalizeAlbum({ ...album, images: [] }).portada_url, null);
  });
});

describe('firstImage', () => {
  it('devuelve la url de la primera imagen', () => {
    assert.equal(firstImage([{ url: 'http://x.com/a.jpg' }]), 'http://x.com/a.jpg');
  });

  it('null con array vacío', () => {
    assert.equal(firstImage([]), null);
  });

  it('null si no es array', () => {
    assert.equal(firstImage(null), null);
  });
});
