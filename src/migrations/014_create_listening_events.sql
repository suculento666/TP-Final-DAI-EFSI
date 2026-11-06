-- 014 · Historial de reproducciones (reales o simuladas).
-- Distinto de activity: esto alimenta las estadísticas de "más escuchado".
-- is_simulated distingue reproducciones reales de simuladas; nunca se
-- afirma que una reproducción fue real si fue simulada.
CREATE TABLE listening_events (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  catalog_item_id BIGINT NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  occurred_at     TIMESTAMPTZ NOT NULL,
  duration_sec    INTEGER,
  is_simulated    BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX listening_user_time_idx ON listening_events (user_id, occurred_at);
CREATE INDEX listening_item_idx      ON listening_events (catalog_item_id);
