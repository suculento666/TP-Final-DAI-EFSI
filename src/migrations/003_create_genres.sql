-- 003 · Géneros (catálogo global). El nombre se normaliza para que
-- diferencias de mayúsculas y espacios no generen duplicados.
CREATE TABLE genres (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX genres_name_normalized_uniq ON genres (lower(btrim(name)));
