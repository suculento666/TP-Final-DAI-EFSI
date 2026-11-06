-- 012 · Contenidos dentro de una colección (sin repetidos)
CREATE TABLE collection_items (
  id              BIGSERIAL PRIMARY KEY,
  collection_id   BIGINT NOT NULL REFERENCES collections(id)    ON DELETE CASCADE,
  catalog_item_id BIGINT NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (collection_id, catalog_item_id)
);
