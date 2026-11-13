-- 005 · Seed de reproducciones simuladas para la cuenta demo.
-- Requiere: 001_init_v2.sql, 002_seed_prueba.sql, 003_reproducciones.sql.
-- Genera hábitos de escucha realistas: artistas top, géneros, horas del día.
--
-- Idempotente: ON CONFLICT (usuario_id, contenido_id, reproducido_en) DO NOTHING
-- garantiza que volver a ejecutar este script no duplique registros.
--
-- Los timestamps usan TIMESTAMPTZ con offset -03 explícito (Argentina, UTC-3)
-- para que la columna TIMESTAMPTZ almacene el instante correcto.
-- extract(hour ... AT TIME ZONE 'America/Argentina/Buenos_Aires') en las
-- estadísticas devolverá la hora local correcta.
BEGIN;

WITH u AS (SELECT id FROM usuarios WHERE email = 'demo@sonora.app'),
     c AS (SELECT id, spotify_id FROM contenidos)
INSERT INTO reproducciones (usuario_id, contenido_id, reproducido_en, duracion_seg, es_simulada)
SELECT u.id, c.id, data.ts, data.dur, TRUE
FROM u, c
JOIN (VALUES
  -- Mr. Brightside (The Killers) — muy escuchada, horario nocturno ARG (23 hs)
  ('4iV5W9uYEdYUVa79Axb7Rh', (now() - '2 days'::interval)::date  + '23:00:00-03'::timetz, 223),
  ('4iV5W9uYEdYUVa79Axb7Rh', (now() - '5 days'::interval)::date  + '23:00:00-03'::timetz, 223),
  ('4iV5W9uYEdYUVa79Axb7Rh', (now() - '10 days'::interval)::date + '22:30:00-03'::timetz, 223),
  ('4iV5W9uYEdYUVa79Axb7Rh', (now() - '14 days'::interval)::date + '22:00:00-03'::timetz, 223),
  ('4iV5W9uYEdYUVa79Axb7Rh', (now() - '20 days'::interval)::date + '21:45:00-03'::timetz, 223),
  -- Knights of Cydonia (Muse) — tarde ARG (18-21 hs)
  ('7ouMYWpwJ422jRcDASZB7P', (now() - '3 days'::interval)::date  + '18:00:00-03'::timetz, 367),
  ('7ouMYWpwJ422jRcDASZB7P', (now() - '8 days'::interval)::date  + '19:15:00-03'::timetz, 367),
  ('7ouMYWpwJ422jRcDASZB7P', (now() - '15 days'::interval)::date + '20:00:00-03'::timetz, 367),
  ('7ouMYWpwJ422jRcDASZB7P', (now() - '25 days'::interval)::date + '21:00:00-03'::timetz, 367),
  -- Do I Wanna Know? (Arctic Monkeys) — noche tarde ARG
  ('3AJwUDP919kvQ9QcozQPxg', (now() - '1 day'::interval)::date   + '23:30:00-03'::timetz, 272),
  ('3AJwUDP919kvQ9QcozQPxg', (now() - '6 days'::interval)::date  + '22:00:00-03'::timetz, 272),
  ('3AJwUDP919kvQ9QcozQPxg', (now() - '12 days'::interval)::date + '21:30:00-03'::timetz, 272),
  -- Bohemian Rhapsody (Queen) — tarde-noche ARG
  ('1mea3bSkSGXuIRvnydlB5b', (now() - '4 days'::interval)::date  + '20:00:00-03'::timetz, 354),
  ('1mea3bSkSGXuIRvnydlB5b', (now() - '9 days'::interval)::date  + '19:30:00-03'::timetz, 354),
  ('1mea3bSkSGXuIRvnydlB5b', (now() - '18 days'::interval)::date + '20:45:00-03'::timetz, 354),
  -- Blinding Lights (The Weeknd) — mañana ARG (8-10 hs)
  ('6rPO02ozF3bM7NnOV4h6s2', (now() - '2 days'::interval)::date  + '08:00:00-03'::timetz, 200),
  ('6rPO02ozF3bM7NnOV4h6s2', (now() - '7 days'::interval)::date  + '09:15:00-03'::timetz, 200),
  ('6rPO02ozF3bM7NnOV4h6s2', (now() - '16 days'::interval)::date + '10:00:00-03'::timetz, 200),
  -- Watermelon Sugar (Harry Styles) — mediodía ARG
  ('0VjIjW4GlUZAMYd2vXMi3b', (now() - '3 days'::interval)::date  + '14:00:00-03'::timetz, 174),
  ('0VjIjW4GlUZAMYd2vXMi3b', (now() - '11 days'::interval)::date + '15:30:00-03'::timetz, 174),
  -- good 4 u (Olivia Rodrigo) — tarde ARG
  ('1dGr1c8CrMLDpV6mPbImSI', (now() - '5 days'::interval)::date  + '16:00:00-03'::timetz, 178),
  ('1dGr1c8CrMLDpV6mPbImSI', (now() - '13 days'::interval)::date + '17:45:00-03'::timetz, 178),
  -- Never Gonna Give You Up (Rick Astley) — mediodía ARG
  ('5ghIJDpPoe3CfHMGu71E6T', (now() - '7 days'::interval)::date  + '12:00:00-03'::timetz, 213)
) AS data(sid, ts, dur) ON c.spotify_id = data.sid
ON CONFLICT (usuario_id, contenido_id, reproducido_en) DO NOTHING;

COMMIT;
