-- Cubefield leaderboard.
-- Run once: npx wrangler d1 execute hostersphere-board --remote --file=migrations/0005_cubefield_scores.sql
CREATE TABLE IF NOT EXISTS cubefield_scores (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  seconds    REAL    NOT NULL,
  created_at INTEGER NOT NULL,            -- unix ms
  ip_hash    TEXT    NOT NULL,            -- salted SHA-256, for rate limiting only
  hidden     INTEGER NOT NULL DEFAULT 0   -- 1 = removed by admin
);
CREATE INDEX IF NOT EXISTS idx_cubefield_visible ON cubefield_scores (hidden, seconds DESC);
CREATE INDEX IF NOT EXISTS idx_cubefield_ip_time ON cubefield_scores (ip_hash, created_at);
