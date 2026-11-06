-- 009 · Puntuaciones (1 a 5, una por usuario y contenido)
CREATE TABLE ratings (
  id             BIGSERIAL PRIMARY KEY,
  user_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  catalog_item_id BIGINT NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  score           SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, catalog_item_id)
);
CREATE INDEX ratings_user_idx ON ratings (user_id);
