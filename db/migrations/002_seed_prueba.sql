-- 002 · Datos de prueba y cuenta de demostración.
-- Usuario demo: email demo@sonora.app / password: demo1234
-- (el hash corresponde a 'demo1234' con bcrypt 10 rondas)
-- No ejecutar sobre una base con datos reales.
BEGIN;

INSERT INTO usuarios (username, email, password_hash, avatar_url, bio, generos_preferidos)
VALUES (
  'demo',
  'demo@sonora.app',
  '$2a$10$XowKxIoILm.u0Q7.3CpkqOwFMzPEBJm9nfHfSJjjnLB4APzPuqkYe',
  'https://i.scdn.co/image/ab67616d00001e02ff9ca10b55ce82ae553d50e8',
  'Amante de la música. Siempre buscando algo nuevo.',
  ARRAY['pop', 'indie', 'rock']
),
(
  'otro',
  'otro@sonora.app',
  '$2a$10$XowKxIoILm.u0Q7.3CpkqOwFMzPEBJm9nfHfSJjjnLB4APzPuqkYe',
  NULL,
  'Usuario de prueba para aislamiento.',
  '{}'
)
ON CONFLICT (email) DO NOTHING;

-- Contenidos (12 para asegurar el mínimo de 10)
INSERT INTO contenidos (spotify_id, tipo, titulo, artista, album, generos, portada_url, duracion_ms, fecha_lanzamiento)
VALUES
  ('4iV5W9uYEdYUVa79Axb7Rh', 'track',  'Mr. Brightside',          'The Killers',    'Hot Fuss',                   ARRAY['indie rock','rock'],           'https://i.scdn.co/image/ab67616d00001e02061776fb6a67571c05e9e88c', 222973, '2003-06-15'),
  ('7ouMYWpwJ422jRcDASZB7P', 'track',  'Knights of Cydonia',      'Muse',           'Black Holes...',             ARRAY['rock','alternative rock'],     'https://i.scdn.co/image/ab67616d00001e02b4d58426bbb0f3fcf13a6fac', 366946, '2006-07-03'),
  ('3AJwUDP919kvQ9QcozQPxg', 'track',  'Do I Wanna Know?',        'Arctic Monkeys', 'AM',                         ARRAY['indie rock','alternative'],    'https://i.scdn.co/image/ab67616d00001e025789fb64c9e50c74c33c0a8d', 272394, '2013-09-09'),
  ('1mea3bSkSGXuIRvnydlB5b', 'track',  'Bohemian Rhapsody',       'Queen',          'A Night at...',              ARRAY['classic rock','arena rock'],    'https://i.scdn.co/image/ab67616d00001e02ce4f1737bc334e6c547b9bb9', 354320, '1975-10-31'),
  ('5ghIJDpPoe3CfHMGu71E6T', 'track',  'Never Gonna Give You Up', 'Rick Astley',    'Whenever You Need Somebody', ARRAY['pop','dance pop'],             'https://i.scdn.co/image/ab67616d00001e0272b61fad069893152d5b0f27', 213573, '1987-07-27'),
  ('6rPO02ozF3bM7NnOV4h6s2', 'track',  'Blinding Lights',         'The Weeknd',     'After Hours',                ARRAY['pop','synth-pop'],             'https://i.scdn.co/image/ab67616d00001e024718e2b124f79258be7bc452', 200040, '2019-11-29'),
  ('0VjIjW4GlUZAMYd2vXMi3b', 'track',  'Watermelon Sugar',        'Harry Styles',   'Fine Line',                  ARRAY['pop','indie pop'],             'https://i.scdn.co/image/ab67616d00001e026b2d5740f6e48dc55be64600', 174000, '2019-12-13'),
  ('1dGr1c8CrMLDpV6mPbImSI', 'track',  'good 4 u',                'Olivia Rodrigo', 'SOUR',                       ARRAY['pop punk','pop'],              'https://i.scdn.co/image/ab67616d00001e02a91c10fe9472d9bd89802e52', 178147, '2021-05-14'),
  ('0tgVpDi06FyKpA1z0VMD4v', 'album',  'Hot Fuss',                'The Killers',    NULL,                         ARRAY['indie rock','rock'],           'https://i.scdn.co/image/ab67616d00001e02061776fb6a67571c05e9e88c', NULL,   '2003-06-15'),
  ('5EyIDBAqhnlkAHcVVqMOfl', 'album',  'AM',                      'Arctic Monkeys', NULL,                         ARRAY['indie rock','alternative'],    'https://i.scdn.co/image/ab67616d00001e025789fb64c9e50c74c33c0a8d', NULL,   '2013-09-09'),
  ('1WDA6MsrSJGWEtJUMqY8SB', 'album',  'After Hours',             'The Weeknd',     NULL,                         ARRAY['pop','r&b'],                   'https://i.scdn.co/image/ab67616d00001e024718e2b124f79258be7bc452', NULL,   '2020-03-20'),
  ('4LH4d3cOWNNsVw41Gqt2kv', 'album',  'SOUR',                    'Olivia Rodrigo', NULL,                         ARRAY['pop punk','pop','indie pop'],  'https://i.scdn.co/image/ab67616d00001e02a91c10fe9472d9bd89802e52', NULL,   '2021-05-21')
ON CONFLICT (spotify_id) DO NOTHING;

-- Biblioteca del usuario demo (todos los estados + favoritos + puntuaciones)
WITH u AS (SELECT id FROM usuarios WHERE email = 'demo@sonora.app'),
     c AS (SELECT id, spotify_id FROM contenidos)
INSERT INTO biblioteca_items (usuario_id, contenido_id, estado, es_favorito, puntuacion)
SELECT u.id, c.id, data.estado, data.fav, data.puntaje
FROM u, c
JOIN (VALUES
  ('4iV5W9uYEdYUVa79Axb7Rh', 'escuchado',       TRUE,  5::smallint),
  ('7ouMYWpwJ422jRcDASZB7P', 'escuchado',       TRUE,  5),
  ('3AJwUDP919kvQ9QcozQPxg', 'escuchado',       FALSE, 4),
  ('1mea3bSkSGXuIRvnydlB5b', 'escuchado',       TRUE,  5),
  ('5ghIJDpPoe3CfHMGu71E6T', 'escuchando',      FALSE, 3),
  ('6rPO02ozF3bM7NnOV4h6s2', 'escuchado',       TRUE,  4),
  ('0VjIjW4GlUZAMYd2vXMi3b', 'escuchando',      FALSE, 4),
  ('1dGr1c8CrMLDpV6mPbImSI', 'quiero_escuchar', FALSE, NULL),
  ('0tgVpDi06FyKpA1z0VMD4v', 'escuchado',       TRUE,  5),
  ('5EyIDBAqhnlkAHcVVqMOfl', 'escuchado',       FALSE, NULL),
  ('1WDA6MsrSJGWEtJUMqY8SB', 'quiero_escuchar', FALSE, NULL),
  ('4LH4d3cOWNNsVw41Gqt2kv', 'escuchando',      FALSE, NULL)
) AS data(sid, estado, fav, puntaje) ON c.spotify_id = data.sid
ON CONFLICT (usuario_id, contenido_id) DO NOTHING;

-- Reseñas del usuario demo (3 mínimo)
WITH u AS (SELECT id FROM usuarios WHERE email = 'demo@sonora.app'),
     c AS (SELECT id, spotify_id FROM contenidos)
INSERT INTO resenas (usuario_id, contenido_id, texto)
SELECT u.id, c.id, data.texto
FROM u, c
JOIN (VALUES
  ('4iV5W9uYEdYUVa79Axb7Rh', 'Un clásico indiscutible. El riff de apertura me lleva directo a la adolescencia. Uno de esos temas que no pasan de moda.'),
  ('1mea3bSkSGXuIRvnydlB5b', 'Opera rock en estado puro. Cuatro minutos de viaje musical con cambios de tempo y registro que todavía sorprenden después de décadas.'),
  ('3AJwUDP919kvQ9QcozQPxg', 'El álbum AM es una joya y esta canción lo resume perfectamente: groove oscuro, letra inteligente y una energía que no para.')
) AS data(sid, texto) ON c.spotify_id = data.sid
ON CONFLICT (usuario_id, contenido_id) DO NOTHING;

-- Colecciones del usuario demo (3 mínimo)
WITH u AS (SELECT id FROM usuarios WHERE email = 'demo@sonora.app')
INSERT INTO colecciones (usuario_id, nombre, descripcion, color)
SELECT u.id, data.nombre, data.descripcion, data.color
FROM u, (VALUES
  ('Clásicos de Rock',  'Lo mejor del rock clásico e indie.',       '#E63946'),
  ('Para el gimnasio',  'Canciones con energía para entrenar.',      '#457B9D'),
  ('Chill de noche',    'Para escuchar tranquilo antes de dormir.',  '#1D3557')
) AS data(nombre, descripcion, color)
ON CONFLICT (usuario_id, nombre) DO NOTHING;

-- Items en colecciones.
-- Reescrito como JOIN explícito para que cada combinación (colección, contenido)
-- se resuelva correctamente sin producto cartesiano.
--
-- Estrategia: construir la tabla de pares (nombre_colección, spotify_id) como
-- VALUES, luego joinear con las tablas reales para obtener los IDs numéricos.
WITH u AS (
  SELECT id FROM usuarios WHERE email = 'demo@sonora.app'
),
pairs (col_nombre, sid) AS (
  VALUES
    ('Clásicos de Rock',  '4iV5W9uYEdYUVa79Axb7Rh'),
    ('Clásicos de Rock',  '7ouMYWpwJ422jRcDASZB7P'),
    ('Clásicos de Rock',  '1mea3bSkSGXuIRvnydlB5b'),
    ('Para el gimnasio',  '7ouMYWpwJ422jRcDASZB7P'),
    ('Para el gimnasio',  '6rPO02ozF3bM7NnOV4h6s2'),
    ('Para el gimnasio',  '3AJwUDP919kvQ9QcozQPxg'),
    ('Chill de noche',    '0VjIjW4GlUZAMYd2vXMi3b'),
    ('Chill de noche',    '1dGr1c8CrMLDpV6mPbImSI')
),
col_ids AS (
  SELECT col.id AS coleccion_id, col.nombre
  FROM colecciones col
  JOIN u ON col.usuario_id = u.id
),
content_ids AS (
  SELECT id AS contenido_id, spotify_id
  FROM contenidos
)
INSERT INTO coleccion_items (coleccion_id, contenido_id)
SELECT col_ids.coleccion_id, content_ids.contenido_id
FROM pairs
JOIN col_ids     ON col_ids.nombre   = pairs.col_nombre
JOIN content_ids ON content_ids.spotify_id = pairs.sid
ON CONFLICT (coleccion_id, contenido_id) DO NOTHING;

-- Actividad del usuario demo
WITH u AS (SELECT id FROM usuarios WHERE email = 'demo@sonora.app'),
     c AS (SELECT id, spotify_id FROM contenidos)
INSERT INTO actividad (usuario_id, tipo, contenido_id, creado_en)
SELECT u.id, data.tipo, c.id, now() - data.hace::interval
FROM u, c
JOIN (VALUES
  ('4iV5W9uYEdYUVa79Axb7Rh', 'agregar_biblioteca', '30 days'),
  ('7ouMYWpwJ422jRcDASZB7P', 'agregar_biblioteca', '28 days'),
  ('1mea3bSkSGXuIRvnydlB5b', 'agregar_biblioteca', '25 days'),
  ('4iV5W9uYEdYUVa79Axb7Rh', 'marcar_favorito',    '24 days'),
  ('7ouMYWpwJ422jRcDASZB7P', 'marcar_favorito',    '23 days'),
  ('4iV5W9uYEdYUVa79Axb7Rh', 'puntuar',            '20 days'),
  ('1mea3bSkSGXuIRvnydlB5b', 'puntuar',            '18 days'),
  ('3AJwUDP919kvQ9QcozQPxg', 'cambiar_estado',     '15 days'),
  ('6rPO02ozF3bM7NnOV4h6s2', 'marcar_favorito',    '10 days'),
  ('4iV5W9uYEdYUVa79Axb7Rh', 'crear_reseña',        '8 days'),
  ('1mea3bSkSGXuIRvnydlB5b', 'crear_reseña',        '5 days'),
  ('3AJwUDP919kvQ9QcozQPxg', 'crear_reseña',        '3 days')
) AS data(sid, tipo, hace) ON c.spotify_id = data.sid;

COMMIT;
