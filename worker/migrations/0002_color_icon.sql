-- Adds the optional colour and icon a poster can pick.
-- Run once: npx wrangler d1 execute hostersphere-board --remote --file=migrations/0002_color_icon.sql
ALTER TABLE posts ADD COLUMN color TEXT;
ALTER TABLE posts ADD COLUMN icon TEXT;
