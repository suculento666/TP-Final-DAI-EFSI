-- 006 · Relación contenido ↔ género (un contenido puede tener varios géneros)
CREATE TABLE item_genres (
  catalog_item_id BIGINT NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  genre_id        BIGINT NOT NULL REFERENCES genres(id)        ON DELETE CASCADE,
  PRIMARY KEY (catalog_item_id, genre_id)
);
