-- Fresh Bandcamp stream links for HosterAmp, pushed every 6 hours by the
-- "Refresh Bandcamp streams" GitHub Action (Bandcamp's pages refuse requests
-- from Cloudflare, so the Worker can't look them up itself). Links expire
-- after about a day; `expires` is the unix time from the link's ts= param.
CREATE TABLE IF NOT EXISTS bandcamp_streams (
  track_id   TEXT PRIMARY KEY,
  url        TEXT NOT NULL,
  expires    INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
