-- +1s on albums from the Listening page. One row per (album, visitor); the
-- primary key makes it a toggle and stops repeat-clicking from inflating counts.
-- Run once: npx wrangler d1 execute hostersphere-board --remote --file=migrations/0004_album_likes.sql
CREATE TABLE IF NOT EXISTS album_likes (
  album_key  TEXT    NOT NULL,            -- lowercased "artist|||album"
  ip_hash    TEXT    NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (album_key, ip_hash)
);
CREATE INDEX IF NOT EXISTS idx_album_likes_key ON album_likes (album_key);
CREATE INDEX IF NOT EXISTS idx_album_likes_ip_time ON album_likes (ip_hash, created_at);
