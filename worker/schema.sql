-- Run once: npx wrangler d1 execute hostersphere-board --remote --file=schema.sql
CREATE TABLE IF NOT EXISTS posts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  message    TEXT    NOT NULL,
  created_at INTEGER NOT NULL,            -- unix ms
  ip_hash    TEXT    NOT NULL,            -- salted SHA-256, for rate limiting only
  hidden     INTEGER NOT NULL DEFAULT 0,  -- 1 = removed by admin
  color      TEXT,                        -- optional, one of COLORS in src/index.js
  icon       TEXT                         -- optional, one of ICONS in src/index.js
);
CREATE INDEX IF NOT EXISTS idx_posts_visible ON posts (hidden, id);
CREATE INDEX IF NOT EXISTS idx_posts_ip_time ON posts (ip_hash, created_at);
CREATE TABLE IF NOT EXISTS reactions (
  post_id    INTEGER NOT NULL,
  kind       TEXT    NOT NULL,            -- one of REACTIONS in src/index.js
  ip_hash    TEXT    NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (post_id, kind, ip_hash)
);
CREATE INDEX IF NOT EXISTS idx_reactions_ip_time ON reactions (ip_hash, created_at);
CREATE TABLE IF NOT EXISTS album_likes (
  album_key  TEXT    NOT NULL,            -- lowercased "artist|||album"
  ip_hash    TEXT    NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (album_key, ip_hash)
);
CREATE INDEX IF NOT EXISTS idx_album_likes_key ON album_likes (album_key);
CREATE INDEX IF NOT EXISTS idx_album_likes_ip_time ON album_likes (ip_hash, created_at);
