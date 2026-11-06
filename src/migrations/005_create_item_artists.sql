-- 005 · Relación contenido ↔ artista (un contenido puede tener varios artistas)
CREATE TABLE item_artists (
  catalog_item_id BIGINT NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  artist_id       BIGINT NOT NULL REFERENCES artists(id)       ON DELETE CASCADE,
  PRIMARY KEY (catalog_item_id, artist_id)
);
