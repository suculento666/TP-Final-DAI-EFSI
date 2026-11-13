-- 005 · Seed de reproducciones simuladas para la cuenta demo.
-- Requiere: 001_init_v2.sql, 002_seed_prueba.sql, 003_reproducciones.sql.
-- Genera hábitos de escucha realistas: artistas top, géneros, horas del día.
--
-- Idempotente: ON CONFLICT (usuario_id, contenido_id, reproducido_en) DO NOTHING
-- garantiza que volver a ejecutar este script no duplique registros.
--
-- Los timestamps están expresados en hora de Argentina (UTC-3) para que
-- las estadísticas de hábitos por hora sean coherentes con el huso local.
BEGIN;

WITH u AS (SELECT id FROM usuarios WHERE email = 'demo@sonora.app'),
     c AS (SELECT id, spotify_id FROM contenidos)
INSERT INTO reproducciones (usuario_id, contenido_id, reproducido_en, duracion_seg, es_simulada)
SELECT u.id, c.id, data.ts, data.dur, TRUE
FROM u, c
JOIN (VALUES
  -- Mr. Brightside (The Killers) — muy escuchada, horario nocturno ARG (23 hs)
  ('4iV5W9uYEdYUVa79Axb7Rh', (now() - '2 days'::interval)  AT TIME ZONE 'America/Argentina/Buenos_Aires' + '23 hours'::interval, 223),
  ('4iV5W9uYEdYUVa79Axb7Rh', (now() - '5 days'::interval)  AT TIME ZONE 'America/Argentina/Buenos_Aires' + '23 hours'::interval, 223),
  ('4iV5W9uYEdYUVa79Axb7Rh', (now() - '10 days'::interval) AT TIME ZONE 'America/Argentina/Buenos_Aires' + '22 hours'::interval, 223),
  ('4iV5W9uYEdYUVa79Axb7Rh', (now() - '14 days'::interval) AT TIME ZONE 'America/Argentina/Buenos_Aires' + '22 hours'::interval, 223),
  ('4iV5W9uYEdYUVa79Axb7Rh', (now() - '20 days'::interval) AT TIME ZONE 'America/Argentina/Buenos_Aires' + '21 hours'::interval, 223),
  -- Knights of Cydonia (Muse) — tarde ARG (18-21 hs)
  ('7ouMYWpwJ422jRcDASZB7P', (now() - '3 days'::interval)  AT TIME ZONE 'America/Argentina/Buenos_Aires' + '18 hours'::interval, 367),
  ('7ouMYWpwJ422jRcDASZB7P', (now() - '8 days'::interval)  AT TIME ZONE 'America/Argentina/Buenos_Aires' + '19 hours'::interval, 367),
  ('7ouMYWpwJ422jRcDASZB7P', (now() - '15 days'::interval) AT TIME ZONE 'America/Argentina/Buenos_Aires' + '20 hours'::interval, 367),
  ('7ouMYWpwJ422jRcDASZB7P', (now() - '25 days'::interval) AT TIME ZONE 'America/Argentina/Buenos_Aires' + '21 hours'::interval, 367),
  -- Do I Wanna Know? (Arctic Monkeys) — noche tarde ARG
  ('3AJwUDP919kvQ9QcozQPxg', (now() - '1 day'::interval)   AT TIME ZONE 'America/Argentina/Buenos_Aires' + '23 hours'::interval, 272),
  ('3AJwUDP919kvQ9QcozQPxg', (now() - '6 days'::interval)  AT TIME ZONE 'America/Argentina/Buenos_Aires' + '22 hours'::interval, 272),
  ('3AJwUDP919kvQ9QcozQPxg', (now() - '12 days'::interval) AT TIME ZONE 'America/Argentina/Buenos_Aires' + '21 hours'::interval, 272),
  -- Bohemian Rhapsody (Queen) — tarde-noche ARG
  ('1mea3bSkSGXuIRvnydlB5b', (now() - '4 days'::interval)  AT TIME ZONE 'America/Argentina/Buenos_Aires' + '20 hours'::interval, 354),
  ('1mea3bSkSGXuIRvnydlB5b', (now() - '9 days'::interval)  AT TIME ZONE 'America/Argentina/Buenos_Aires' + '19 hours'::interval, 354),
  ('1mea3bSkSGXuIRvnydlB5b', (now() - '18 days'::interval) AT TIME ZONE 'America/Argentina/Buenos_Aires' + '20 hours'::interval, 354),
  -- Blinding Lights (The Weeknd) — mañana ARG (8-10 hs)
  ('6rPO02ozF3bM7NnOV4h6s2', (now() - '2 days'::interval)  AT TIME ZONE 'America/Argentina/Buenos_Aires' + '8 hours'::interval,  200),
  ('6rPO02ozF3bM7NnOV4h6s2', (now() - '7 days'::interval)  AT TIME ZONE 'America/Argentina/Buenos_Aires' + '9 hours'::interval,  200),
  ('6rPO02ozF3bM7NnOV4h6s2', (now() - '16 days'::interval) AT TIME ZONE 'America/Argentina/Buenos_Aires' + '10 hours'::interval, 200),
  -- Watermelon Sugar (Harry Styles) — mediodía ARG
  ('0VjIjW4GlUZAMYd2vXMi3b', (now() - '3 days'::interval)  AT TIME ZONE 'America/Argentina/Buenos_Aires' + '14 hours'::interval, 174),
  ('0VjIjW4GlUZAMYd2vXMi3b', (now() - '11 days'::interval) AT TIME ZONE 'America/Argentina/Buenos_Aires' + '15 hours'::interval, 174),
  -- good 4 u (Olivia Rodrigo) — tarde ARG
  ('1dGr1c8CrMLDpV6mPbImSI', (now() - '5 days'::interval)  AT TIME ZONE 'America/Argentina/Buenos_Aires' + '16 hours'::interval, 178),
  ('1dGr1c8CrMLDpV6mPbImSI', (now() - '13 days'::interval) AT TIME ZONE 'America/Argentina/Buenos_Aires' + '17 hours'::interval, 178),
  -- Never Gonna Give You Up (Rick Astley) — mediodía ARG
  ('5ghIJDpPoe3CfHMGu71E6T', (now() - '7 days'::interval)  AT TIME ZONE 'America/Argentina/Buenos_Aires' + '12 hours'::interval, 213)
) AS data(sid, ts, dur) ON c.spotify_id = data.sid
ON CONFLICT (usuario_id, contenido_id, reproducido_en) DO NOTHING;

COMMIT;
