import pool from '../../database/pool.js';

// Estadísticas calculadas dinámicamente con SQL real filtrado por usuario.
// Incluye indicadores de biblioteca y estadísticas musicales tipo Wrapped
// (artistas, canciones y géneros más escuchados) basadas en la tabla
// reproducciones (creada en 003_reproducciones.sql).

export const statisticsService = {
  async getSummary(userId) {
    const [
      totalRes,
      estadosRes,
      favoritosRes,
      promedioRes,
      generosRes,
      resenasRes,
      coleccionesRes,
      mesRes,
      artistasRes,
      cancionesRes,
      generosRepRes,
    ] = await Promise.all([
      // 1. Total de canciones y álbumes en biblioteca (por tipo)
      pool.query(
        `SELECT c.tipo, count(*)::int AS total
         FROM biblioteca_items bi JOIN contenidos c ON c.id = bi.contenido_id
         WHERE bi.usuario_id = $1 GROUP BY c.tipo`,
        [userId]
      ),
      // 2. Distribución de estados
      pool.query(
        `SELECT estado, count(*)::int AS total
         FROM biblioteca_items WHERE usuario_id = $1 GROUP BY estado`,
        [userId]
      ),
      // 3. Total de favoritos
      pool.query(
        `SELECT count(*)::int AS total FROM biblioteca_items
         WHERE usuario_id = $1 AND es_favorito = TRUE`,
        [userId]
      ),
      // 4. Promedio de puntuaciones
      pool.query(
        `SELECT round(avg(puntuacion)::numeric, 2) AS promedio, count(*)::int AS puntuados
         FROM biblioteca_items WHERE usuario_id = $1 AND puntuacion IS NOT NULL`,
        [userId]
      ),
      // 5. Géneros más frecuentes en biblioteca (en los contenidos guardados)
      pool.query(
        `SELECT g AS genero, count(*)::int AS total
         FROM biblioteca_items bi
         JOIN contenidos c ON c.id = bi.contenido_id
         CROSS JOIN LATERAL unnest(c.generos) AS g
         WHERE bi.usuario_id = $1
         GROUP BY g ORDER BY total DESC LIMIT 5`,
        [userId]
      ),
      // 6. Total de reseñas escritas
      pool.query(
        `SELECT count(*)::int AS total FROM resenas WHERE usuario_id = $1`,
        [userId]
      ),
      // 7. Colecciones y sus tamaños
      pool.query(
        `SELECT col.id, col.nombre, count(ci.contenido_id)::int AS contenidos
         FROM colecciones col
         LEFT JOIN coleccion_items ci ON ci.coleccion_id = col.id
         WHERE col.usuario_id = $1 GROUP BY col.id ORDER BY col.creado_en DESC`,
        [userId]
      ),
      // 8. Actividad reciente por mes (últimos 6 meses)
      pool.query(
        `SELECT to_char(date_trunc('month', creado_en), 'YYYY-MM') AS mes,
                count(*)::int AS acciones
         FROM actividad WHERE usuario_id = $1
           AND creado_en >= now() - interval '6 months'
         GROUP BY mes ORDER BY mes`,
        [userId]
      ),
      // 9. Artistas más escuchados (basado en reproducciones reales/simuladas)
      pool.query(
        `SELECT c.artista, count(*)::int AS reproducciones
         FROM reproducciones r
         JOIN contenidos c ON c.id = r.contenido_id
         WHERE r.usuario_id = $1
         GROUP BY c.artista
         ORDER BY reproducciones DESC
         LIMIT 5`,
        [userId]
      ),
      // 10. Canciones más reproducidas (solo tracks)
      pool.query(
        `SELECT c.id, c.spotify_id, c.titulo, c.artista, c.portada_url,
                count(*)::int AS reproducciones
         FROM reproducciones r
         JOIN contenidos c ON c.id = r.contenido_id
         WHERE r.usuario_id = $1 AND c.tipo = 'track'
         GROUP BY c.id
         ORDER BY reproducciones DESC
         LIMIT 5`,
        [userId]
      ),
      // 11. Géneros más escuchados según reproducciones (no solo biblioteca)
      pool.query(
        `SELECT g AS genero, count(*)::int AS reproducciones
         FROM reproducciones r
         JOIN contenidos c ON c.id = r.contenido_id
         CROSS JOIN LATERAL unnest(c.generos) AS g
         WHERE r.usuario_id = $1
         GROUP BY g
         ORDER BY reproducciones DESC
         LIMIT 5`,
        [userId]
      ),
    ]);

    return {
      totales_por_tipo:       totalRes.rows,
      distribucion_estados:   estadosRes.rows,
      favoritos:              favoritosRes.rows[0]?.total ?? 0,
      promedio_puntuaciones:  promedioRes.rows[0],
      generos_frecuentes:     generosRes.rows,
      total_resenas:          resenasRes.rows[0]?.total ?? 0,
      colecciones:            coleccionesRes.rows,
      actividad_por_mes:      mesRes.rows,
      // Estadísticas musicales tipo Wrapped
      artistas_mas_escuchados:  artistasRes.rows,
      canciones_mas_reproducidas: cancionesRes.rows,
      generos_mas_escuchados:   generosRepRes.rows,
    };
  },
};
