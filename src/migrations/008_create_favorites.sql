-- 008 · Favoritos: toggle independiente del estado de escucha.
-- Una canción puede estar 'listened' y ser favorita al mismo tiempo.
CREATE TABLE favorites (
  id             BIGSERIAL PRIMARY KEY,
  user_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  catalog_item_id BIGINT NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, catalog_item_id)
);
CREATE INDEX favorites_user_idx ON favorites (user_id);
