-- Run once: npx wrangler d1 execute hostersphere-board --remote --file=schema.sql
CREATE TABLE IF NOT EXISTS posts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  message    TEXT    NOT NULL,
  created_at INTEGER NOT NULL,            -- unix ms
  ip_hash    TEXT    NOT NULL,            -- salted SHA-256, for rate limiting only
  hidden     INTEGER NOT NULL DEFAULT 0   -- 1 = removed by admin
);
CREATE INDEX IF NOT EXISTS idx_posts_visible ON posts (hidden, id);
CREATE INDEX IF NOT EXISTS idx_posts_ip_time ON posts (ip_hash, created_at);
