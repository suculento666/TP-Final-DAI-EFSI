import { playsRepository } from './plays.repository.js';
import pool from '../../database/pool.js';
import { notFound } from '../../utils/errors.js';

export const playsService = {
  // Registra que el usuario reprodujo un contenido.
  async record(userId, { contenidoId, duracionSeg }) {
    // Verificar que el contenido existe antes de insertar.
    const { rows } = await pool.query(
      'SELECT id FROM contenidos WHERE id = $1',
      [contenidoId]
    );
    if (!rows.length) throw notFound('Contenido no encontrado');

    return playsRepository.record({
      userId,
      contenidoId,
      reproducidoEn: new Date(),
      duracionSeg: duracionSeg ?? null,
      esSimulada: false,
    });
  },

  async list(userId, { limit, offset } = {}) {
    return playsRepository.list(userId, { limit, offset });
  },

  // Wrapped personal: artistas top, canciones top, géneros y hábitos.
  async wrapped(userId) {
    const [artistas, canciones, generos, horarios] = await Promise.all([
      playsRepository.topArtists(userId, { limit: 5 }),
      playsRepository.topTracks(userId, { limit: 5 }),
      playsRepository.topGenres(userId, { limit: 5 }),
      playsRepository.listeningByHour(userId),
    ]);
    return { artistas_mas_escuchados: artistas, canciones_mas_reproducidas: canciones, generos_mas_escuchados: generos, habitos_por_hora: horarios };
  },
};
