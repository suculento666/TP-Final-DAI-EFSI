// Proveedor de Spotify — ÚNICO lugar que habla con la API de Spotify.
// Autenticación por Client Credentials (token cacheado hasta expirar).
// Usa fetch global (Node >= 20). Sin dependencias extra.
//
// IMPORTANTE: Client Credentials NO da acceso al historial personal del
// usuario. Solo sirve para buscar y consultar metadatos públicos.

import { ApiError } from '../../utils/errors.js';

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API_URL = 'https://api.spotify.com/v1';

// Token en memoria del proceso, con expiración.
let tokenCache = { value: null, expiresAt: 0 };

function getCredentials() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new ApiError(
      500,
      'SPOTIFY_NOT_CONFIGURED',
      'Faltan credenciales de Spotify: SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET'
    );
  }
  return { clientId, clientSecret };
}

async function fetchToken() {
  const now = Date.now();
  if (tokenCache.value && tokenCache.expiresAt > now + 30_000) {
    return tokenCache.value;
  }
  const { clientId, clientSecret } = getCredentials();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    throw new ApiError(502, 'SPOTIFY_TOKEN_ERROR', 'No se pudo obtener el token de Spotify');
  }
  const data = await res.json();
  tokenCache = {
    value: data.access_token,
    expiresAt: now + (data.expires_in ?? 3600) * 1000,
  };
  return tokenCache.value;
}

// GET autenticado a Spotify. Si el token venció (401), lo invalida y reintenta una vez.
async function spotifyGet(path) {
  let token = await fetchToken();
  let res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    tokenCache = { value: null, expiresAt: 0 };
    token = await fetchToken();
    res = await fetch(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  return res;
}

// Trae los géneros de hasta 50 artistas en una sola llamada (evita N+1).
async function artistsGenres(artistIds) {
  const unique = [...new Set((artistIds || []).filter(Boolean))].slice(0, 50);
  if (!unique.length) return {};
  const res = await spotifyGet(`/artists?ids=${unique.join(',')}`);
  if (!res.ok) return {};
  const data = await res.json();
  const map = {};
  for (const a of data.artists || []) map[a.id] = a.genres || [];
  return map;
}

function firstImage(images) {
  return Array.isArray(images) && images.length ? images[0]?.url ?? null : null;
}

function normalizeTrack(t, genreMap) {
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

function normalizeAlbum(a, genreMap) {
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

export const spotifyProvider = {
  // tipo: 'track' | 'album' | 'both' (default)
  async search({ q, tipo = 'both', limit = 20 }) {
    if (!q || !q.trim()) return { tracks: [], albums: [] };
    const capped = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
    const type =
      tipo === 'track' ? 'track' : tipo === 'album' ? 'album' : 'track,album';

    const path = `/search?q=${encodeURIComponent(q.trim())}&type=${type}&limit=${capped}`;
    const res = await spotifyGet(path);
    if (!res.ok) {
      throw new ApiError(502, 'SPOTIFY_SEARCH_ERROR', `Error en búsqueda de Spotify (${res.status})`);
    }
    const data = await res.json();

    const artistIds = [
      ...(data.tracks?.items || []).map((t) => t.artists?.[0]?.id),
      ...(data.albums?.items || []).map((a) => a.artists?.[0]?.id),
    ];
    const genreMap = await artistsGenres(artistIds);

    return {
      tracks: (data.tracks?.items || []).map((t) => normalizeTrack(t, genreMap)),
      albums: (data.albums?.items || []).map((a) => normalizeAlbum(a, genreMap)),
    };
  },

  async getTrack(id) {
    const res = await spotifyGet(`/tracks/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new ApiError(502, 'SPOTIFY_ERROR', `Error de Spotify (${res.status})`);
    const t = await res.json();
    const genreMap = await artistsGenres([t.artists?.[0]?.id]);
    return normalizeTrack(t, genreMap);
  },

  async getAlbum(id) {
    const res = await spotifyGet(`/albums/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new ApiError(502, 'SPOTIFY_ERROR', `Error de Spotify (${res.status})`);
    const a = await res.json();
    const genreMap = await artistsGenres([a.artists?.[0]?.id]);
    return normalizeAlbum(a, genreMap);
  },
};
