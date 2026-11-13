-- 003 · Migración ADITIVA (no modifica las 7 tablas existentes).
-- Historial de reproducciones (reales o simuladas) para alimentar las
-- estadísticas de "más escuchado" y "hábitos de escucha" que la consigna
-- exige para música. actividad registra acciones de la app, no cada play.
-- FKs verificadas contra 001_init_v2.sql: usuarios(id), contenidos(id).
BEGIN;
CREATE TABLE reproducciones (
   id              SERIAL PRIMARY KEY,
   usuario_id      INTEGER NOT NULL REFERENCES usuarios(id)   ON DELETE CASCADE,
   contenido_id    INTEGER NOT NULL REFERENCES contenidos(id) ON DELETE CASCADE,
   reproducido_en  TIMESTAMPTZ NOT NULL,
   duracion_seg    INTEGER CHECK (duracion_seg IS NULL OR duracion_seg > 0),
   es_simulada     BOOLEAN NOT NULL DEFAULT FALSE,
   creado_en       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reproducciones_usuario_fecha ON reproducciones (usuario_id, reproducido_en);
CREATE INDEX idx_reproducciones_contenido    ON reproducciones (contenido_id);
COMMIT;
