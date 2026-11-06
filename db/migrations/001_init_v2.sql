-- Esquema base del proyecto (fuente de verdad del equipo).
-- 7 tablas: usuarios, contenidos, biblioteca_items, resenas,
-- colecciones, coleccion_items, actividad.
-- Aplicar una sola vez sobre una base limpia.
BEGIN;
CREATE TABLE usuarios (
   id              SERIAL PRIMARY KEY,
   username        VARCHAR(30)  NOT NULL UNIQUE,
   email           VARCHAR(255) NOT NULL UNIQUE,
   password_hash   VARCHAR(255) NOT NULL,
   avatar_url      TEXT,
   bio             VARCHAR(300),
   generos_preferidos TEXT[]    NOT NULL DEFAULT '{}',
   creado_en       TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE TABLE contenidos (
   id                SERIAL PRIMARY KEY,
   spotify_id        VARCHAR(50)  NOT NULL UNIQUE,
   tipo              VARCHAR(10)  NOT NULL
                     CHECK (tipo IN ('track', 'album')),
   titulo            VARCHAR(255) NOT NULL,
   artista           VARCHAR(255),
   album             VARCHAR(255),             
   generos           TEXT[]       NOT NULL DEFAULT '{}',
   portada_url       TEXT,
   duracion_ms       INTEGER      CHECK (duracion_ms IS NULL OR duracion_ms > 0),
   total_canciones   SMALLINT     CHECK (total_canciones IS NULL OR total_canciones > 0),
   fecha_lanzamiento VARCHAR(10),
   creado_en         TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE TABLE biblioteca_items (
   id                SERIAL PRIMARY KEY,
   usuario_id        INTEGER NOT NULL REFERENCES usuarios(id)   ON DELETE CASCADE,
   contenido_id      INTEGER NOT NULL REFERENCES contenidos(id) ON DELETE CASCADE,
   estado            VARCHAR(20) NOT NULL DEFAULT 'quiero_escuchar'
                     CHECK (estado IN ('quiero_escuchar', 'escuchando', 'escuchado')),
   es_favorito       BOOLEAN     NOT NULL DEFAULT FALSE,
   puntuacion        SMALLINT    CHECK (puntuacion BETWEEN 1 AND 5),
   agregado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
   actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT now(),
   UNIQUE (usuario_id, contenido_id)
);
CREATE TABLE resenas (
   id              SERIAL PRIMARY KEY,
   usuario_id      INTEGER NOT NULL REFERENCES usuarios(id)   ON DELETE CASCADE,
   contenido_id    INTEGER NOT NULL REFERENCES contenidos(id) ON DELETE CASCADE,
   texto           TEXT    NOT NULL CHECK (length(trim(texto)) > 0),
   creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
   actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
   UNIQUE (usuario_id, contenido_id)
);
CREATE TABLE colecciones (
   id          SERIAL PRIMARY KEY,
   usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
   nombre      VARCHAR(100) NOT NULL,
   descripcion VARCHAR(300),
   color       VARCHAR(7)   CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$'), 
   creado_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
   UNIQUE (usuario_id, nombre)
);
CREATE TABLE coleccion_items (
   coleccion_id INTEGER NOT NULL REFERENCES colecciones(id) ON DELETE CASCADE,
   contenido_id INTEGER NOT NULL REFERENCES contenidos(id)  ON DELETE CASCADE,
   agregado_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
   PRIMARY KEY (coleccion_id, contenido_id)
);
CREATE TABLE actividad (
   id            SERIAL PRIMARY KEY,
   usuario_id    INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
   tipo          VARCHAR(30) NOT NULL
                 CHECK (tipo IN (
                     'agregar_biblioteca', 'quitar_biblioteca', 'cambiar_estado',
                     'marcar_favorito', 'quitar_favorito', 'puntuar',
                     'crear_reseña', 'editar_reseña', 'borrar_reseña',
                     'crear_coleccion', 'borrar_coleccion',
                     'agregar_a_coleccion', 'quitar_de_coleccion'
                 )),
   contenido_id  INTEGER REFERENCES contenidos(id)  ON DELETE SET NULL,
   coleccion_id  INTEGER REFERENCES colecciones(id) ON DELETE SET NULL,
   detalle       JSONB,
   creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_biblioteca_usuario_estado ON biblioteca_items (usuario_id, estado);
CREATE INDEX idx_biblioteca_usuario_fav    ON biblioteca_items (usuario_id) WHERE es_favorito;
CREATE INDEX idx_resenas_contenido         ON resenas (contenido_id);
CREATE INDEX idx_colecciones_usuario       ON colecciones (usuario_id);
CREATE INDEX idx_actividad_usuario_fecha   ON actividad (usuario_id, creado_en DESC);
COMMIT;
