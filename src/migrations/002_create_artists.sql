-- 002 · Artistas (catálogo global, identificados por proveedor + external_id)
CREATE TABLE artists (
  id          BIGSERIAL PRIMARY KEY,
  provider    TEXT NOT NULL,
  external_id TEXT NOT NULL,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, external_id)
);
CREATE INDEX artists_name_idx ON artists (name);
