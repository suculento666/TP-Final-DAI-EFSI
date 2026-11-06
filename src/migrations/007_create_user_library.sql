-- 007 · Biblioteca personal del usuario + enum de estados de escucha.
-- Estados de progreso (Favorito es un toggle independiente, ver 008).
CREATE TYPE listen_status AS ENUM ('want_to_listen', 'listening', 'listened');

CREATE TABLE user_library (
  id             BIGSERIAL PRIMARY KEY,
  user_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  catalog_item_id BIGINT NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  status          listen_status NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, catalog_item_id)
);
CREATE INDEX user_library_user_idx   ON user_library (user_id);
CREATE INDEX user_library_status_idx ON user_library (user_id, status);
