-- 004 · Contenidos del catálogo: canciones y álbumes.
-- album_item_id vincula una canción con su álbum (otro registro de esta misma tabla).
CREATE TABLE catalog_items (
  id            BIGSERIAL PRIMARY KEY,
  provider      TEXT NOT NULL,
  external_id   TEXT NOT NULL,
  item_type     TEXT NOT NULL CHECK (item_type IN ('song', 'album')),
  title         TEXT NOT NULL,
  cover_url     TEXT,
  description   TEXT,
  release_date  DATE,
  metadata      JSONB NOT NULL DEFAULT '{}',
  album_item_id BIGINT REFERENCES catalog_items(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, external_id),
  -- Un álbum no puede tener álbum padre. Una canción puede tenerlo o no.
  CHECK (item_type <> 'album' OR album_item_id IS NULL)
);
CREATE INDEX catalog_items_album_idx ON catalog_items (album_item_id);
CREATE INDEX catalog_items_type_idx  ON catalog_items (item_type);
