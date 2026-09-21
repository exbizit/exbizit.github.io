-- Reactions: one row per (post, reaction, visitor). The primary key makes a
-- visitor's reaction a toggle and stops repeat-clicking from inflating counts.
-- Run once: npx wrangler d1 execute hostersphere-board --remote --file=migrations/0003_reactions.sql
CREATE TABLE IF NOT EXISTS reactions (
  post_id    INTEGER NOT NULL,
  kind       TEXT    NOT NULL,            -- one of REACTIONS in src/index.js
  ip_hash    TEXT    NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (post_id, kind, ip_hash)
);
CREATE INDEX IF NOT EXISTS idx_reactions_ip_time ON reactions (ip_hash, created_at);
