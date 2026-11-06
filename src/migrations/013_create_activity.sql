-- 013 · Actividad: acciones realizadas dentro de la app.
-- catalog_item_id es opcional (SET NULL si se borra el contenido) para
-- conservar el registro histórico aunque el contenido desaparezca.
CREATE TABLE activity (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,
  catalog_item_id BIGINT REFERENCES catalog_items(id) ON DELETE SET NULL,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX activity_user_idx ON activity (user_id, created_at DESC);
