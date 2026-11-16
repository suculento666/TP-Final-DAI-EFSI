-- 004 · Migración ADITIVA — amplía el CHECK de actividad.tipo.
-- Agrega: 'quitar_puntuacion', 'editar_coleccion'.
-- Compatible con bases ya inicializadas: solo altera el constraint.
BEGIN;

ALTER TABLE actividad
  DROP CONSTRAINT IF EXISTS actividad_tipo_check;

ALTER TABLE actividad
  ADD CONSTRAINT actividad_tipo_check CHECK (tipo IN (
    'agregar_biblioteca', 'quitar_biblioteca', 'cambiar_estado',
    'marcar_favorito', 'quitar_favorito',
    'puntuar', 'quitar_puntuacion',
    'crear_reseña', 'editar_reseña', 'borrar_reseña',
    'crear_coleccion', 'editar_coleccion', 'borrar_coleccion',
    'agregar_a_coleccion', 'quitar_de_coleccion'
  ));

COMMIT;
