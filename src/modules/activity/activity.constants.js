// Valores válidos de actividad.tipo. Deben coincidir con el CHECK de la tabla.
// Centralizados acá para que el validador y el repositorio no se acoplen entre sí.
export const VALID_ACTIVITY_TYPES = [
  'agregar_biblioteca', 'quitar_biblioteca', 'cambiar_estado',
  'marcar_favorito', 'quitar_favorito', 'puntuar',
  'crear_reseña', 'editar_reseña', 'borrar_reseña',
  'crear_coleccion', 'borrar_coleccion',
  'agregar_a_coleccion', 'quitar_de_coleccion',
];
