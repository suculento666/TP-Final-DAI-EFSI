import pool from '../../database/pool.js';
import { RECENT_ACTIVITY_TYPES } from '../activity/activity.constants.js';

// Estadísticas calculadas dinámicamente con SQL real filtrado por usuario.
// Cada indicador documenta su fuente.

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
      // 5. Géneros más frecuentes en biblioteca (en los contenidos guardados).
      //    porcentaje = peso del género sobre TODAS las etiquetas de género de la
      //    biblioteca. La ventana se calcula antes del LIMIT, así el porcentaje no
      //    depende de que solo se devuelvan los 5 primeros.
      pool.query(
        `SELECT g AS genero,
                count(*)::int AS total,
                round(100.0 * count(*) / sum(count(*)) OVER (), 1)::float AS porcentaje,
                sum(count(*)) OVER ()::int AS total_etiquetas
         FROM biblioteca_items bi
         JOIN contenidos c ON c.id = bi.contenido_id
         CROSS JOIN LATERAL unnest(c.generos) AS g
         WHERE bi.usuario_id = $1
         GROUP BY g ORDER BY total DESC, g ASC LIMIT 5`,
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
           AND tipo = ANY($2::text[])
           AND creado_en >= now() - interval '6 months'
         GROUP BY mes ORDER BY mes`,
        [userId, RECENT_ACTIVITY_TYPES]
      ),
    ]);

    // Nota sobre reproducciones: las estadísticas de "artistas más escuchados"
    // y "canciones más reproducidas" requieren la tabla `reproducciones`
    // (definida en 003_reproducciones.sql, pendiente de aplicar).
    // Se informan como pendientes para no inventar valores.
    const reproduccionesInfo = {
      nota:
        'Las estadísticas de artistas y canciones más escuchados requieren ' +
        'la tabla reproducciones (003_reproducciones.sql). Pendiente de aplicar.',
      artistas_mas_escuchados: [],
      canciones_mas_reproducidas: [],
    };

    // Géneros con porcentaje. Si hay más géneros que el top 5, se agrega una fila
    // "Otros" con el resto, así los porcentajes mostrados suman 100 %.
    const totalEtiquetas = generosRes.rows[0]?.total_etiquetas ?? 0;
    const generosFrecuentes = generosRes.rows.map(({ total_etiquetas, ...fila }) => fila);
    const totalTop = generosFrecuentes.reduce((acc, g) => acc + g.total, 0);
    if (totalEtiquetas > totalTop) {
      const totalOtros = totalEtiquetas - totalTop;
      generosFrecuentes.push({
        genero: 'Otros',
        total: totalOtros,
        porcentaje: Math.round((1000 * totalOtros) / totalEtiquetas) / 10,
        es_otros: true,
      });
    }

    return {
      totales_por_tipo: totalRes.rows,
      distribucion_estados: estadosRes.rows,
      favoritos: favoritosRes.rows[0]?.total ?? 0,
      promedio_puntuaciones: promedioRes.rows[0],
      generos_frecuentes: generosFrecuentes,
      total_resenas: resenasRes.rows[0]?.total ?? 0,
      colecciones: coleccionesRes.rows,
      actividad_por_mes: mesRes.rows,
      reproducciones: reproduccionesInfo,
    };
  },
};
