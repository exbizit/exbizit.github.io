# Community board API (Cloudflare Worker + D1)

Run everything below from this `worker/` folder:

```bash
cd worker
npm install
npx wrangler login                 # once; opens the browser
```

## 1. Database

```bash
npx wrangler d1 create hostersphere-board
```
Copy the `database_id` it prints into `wrangler.toml` (replace `REPLACE_WITH_DATABASE_ID`), then:

```bash
npx wrangler d1 execute hostersphere-board --remote --file=schema.sql
```

## 2. Secrets

`secret put` takes the secret's **name**; it then asks you to paste the **value**
at a hidden prompt. Never put a secret value on the command line.

```bash
npx wrangler secret put TURNSTILE_SECRET   # paste the Turnstile secret key at the prompt
npx wrangler secret put ADMIN_TOKEN        # paste any long random string (your delete password)
```

If it asks to create the Worker first, say yes.

## 3. Deploy

```bash
npx wrangler deploy
```
It prints a URL like `https://hostersphere-board.<you>.workers.dev`. Put that in
`src/data/board.ts` as `BOARD_API` (no trailing slash) and push the site.

## Moderating

Visit `/community?admin`, click Delete on a post, and enter your ADMIN_TOKEN once
per browser session. Deleted posts are hidden, not erased.

`/listening?admin` does the same for the Cubefield leaderboard.

Blocked words beyond the built-in English list: add them to `EXTRA_BLOCKED` in
`src/filter.js`, then `npx wrangler deploy`.

## Useful

```bash
npx wrangler tail     # live logs
npx wrangler d1 execute hostersphere-board --remote --command "SELECT id, name, message FROM posts ORDER BY id DESC LIMIT 20"
```

## Migrations

Run each file in `migrations/` once, in order, **before** deploying code that
needs it:

```bash
npx wrangler d1 execute hostersphere-board --remote --file=migrations/0002_color_icon.sql
npx wrangler d1 execute hostersphere-board --remote --file=migrations/0003_reactions.sql
npx wrangler d1 execute hostersphere-board --remote --file=migrations/0004_album_likes.sql
npx wrangler d1 execute hostersphere-board --remote --file=migrations/0005_cubefield_scores.sql
npx wrangler deploy
```

(`schema.sql` already includes every migration, for a brand-new database.)

