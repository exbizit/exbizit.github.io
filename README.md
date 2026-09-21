# hoster.band EPK

Electronic Press Kit for: **Hoster**, **Mary's White Lie**, **zeroindex**, **Roger's Only Son**, **Head Banned**

---

## Quick start

```bash
cd band-epk-site
npm install          # first time only
npm run dev          # opens http://localhost:5173
```

---

## Editing content

**All band content lives in one file:**

```
src/data/bands.ts
```

Search for `// TODO` to find every placeholder. Each band is one object — update the fields and the site rebuilds automatically (hot reload).

### To add photos
- **Easy:** Upload to a free Cloudinary account (cloudinary.com, free tier is generous). Paste the URL into `photos: [...]` for the band.
- **Simple:** Drop `.jpg` files into `public/photos/` and reference them as `'/photos/filename.jpg'`.

### To enable the Bandcamp inline player
1. Go to your Bandcamp album → click **Share / Embed** → **Embed this album**
2. Copy the embed code — find the number after `album=` in the `src` URL
3. Paste that number as `embedAlbumId: '1234567890'` in the band's config

---

## Contact form delivery

### Setup (~10 min, one time)

Recipients live in the **Web3Forms dashboard**, never in this repo. Your code holds only
opaque access keys, so no email address is in the source, in git, or in the deployed bundle.

For each address below, go to [web3forms.com](https://web3forms.com), enter the address,
copy the key it gives you, and paste it into `.env.local`:

| Register a key for | Paste into | Receives |
|---|---|---|
| your catch-all address | `VITE_W3F_KEY_PRIMARY` | every inquiry |
| the Hoster address | `VITE_W3F_KEY_HOSTER` | Hoster inquiries |
| the Mary's White Lie address | `VITE_W3F_KEY_MARYS` | Mary's White Lie inquiries |
| the Roger's Only Son address | `VITE_W3F_KEY_ROGERS` | Roger's Only Son inquiries |

```bash
cp .env.example .env.local   # then paste your keys in
```

Head Banned and zeroindex have no project key — they route to `VITE_W3F_KEY_PRIMARY` only.

### How routing works

Submitting posts **once per key**: always to `PRIMARY`, plus the project's own key when it
has one. Each key delivers to whatever address it was registered to, so a Hoster inquiry
lands in two inboxes without either address ever reaching the browser.

To add a recipient for a project, register another key and add one line to `PROJECT_KEYS`
in `src/data/contact.ts`.

### On access keys and secrecy

Web3Forms access keys are **public by design** — their own docs put them directly in
client-side HTML. A key is not a credential and reveals nothing about the address behind it,
so committing one is not a leak. They live in env only so you can rotate without editing code.
Restrict submissions to `hoster.band` in the Web3Forms dashboard to stop the keys being
used from other sites.

Free tier is 250 submissions/month. A two-recipient inquiry counts as two.

### If the form isn't configured

With `.env.local` missing, the submit button disables itself and the form says so, rather
than appearing to work and dropping messages.

---

## Shows

`src/data/shows.ts` holds the dates. Each show lists every band on the bill in `lineup`:

```ts
{
  id: 'will-2026-10-15',
  date: '2026-10-15T20:00',
  venue: "Will's Pub",
  city: 'Orlando, FL',
  lineup: ['hoster', 'marys-white-lie'],   // shows on BOTH bands' EPK pages
  ticketUrl: 'https://www.ticketweb.com/event/...',
  status: 'onsale',                         // onsale | soldout | free | cancelled
}
```

Write a double bill **once** and it appears on `/shows` and on each listed band's EPK page,
where the lineup renders as "w/ Mary's White Lie" with that band linked. Past dates move to
a Past section automatically; `getUpcomingShows()` treats a show later tonight as upcoming.


## Deploy to GitHub Pages (free)

### 1. Create the repo

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin git@github.com:YOUR_USERNAME/hoster-band-epk.git
git push -u origin main
```

### 2. Deploy

```bash
npm run deploy
```

This builds the site and pushes it to the `gh-pages` branch automatically.

### 3. Enable GitHub Pages

In your repo on GitHub: **Settings → Pages → Source → Deploy from a branch → gh-pages → / (root)**

Your site will be live at `https://YOUR_USERNAME.github.io/hoster-band-epk/`

> **Note:** If you deploy to a subdirectory (not a root domain), update `vite.config.ts`:
> ```ts
> base: '/hoster-band-epk/',
> ```

### 4. Hook up hoster.band

In your domain registrar (wherever you bought hoster.band), add these DNS records:

| Type  | Host | Value                   |
|-------|------|-------------------------|
| A     | @    | 185.199.108.153         |
| A     | @    | 185.199.109.153         |
| A     | @    | 185.199.110.153         |
| A     | @    | 185.199.111.153         |
| CNAME | www  | YOUR_USERNAME.github.io |

Then in GitHub Pages settings, add `hoster.band` as your custom domain. DNS propagation takes up to 24h.

The `public/CNAME` file is already set to `hoster.band` so deploys will keep the domain configured.

---

## Adding a new band

1. Open `src/data/bands.ts`
2. Copy any existing band object
3. Change `slug`, `name`, and all fields
4. Add it to the `BANDS` array — it auto-appears in the nav and home grid

---

## Project structure

```
src/
  data/
    bands.ts          ← THE file to edit for all content
  components/
    Nav.tsx           ← top navigation
    VideoEmbed.tsx    ← YouTube / Vimeo iframe
    BandcampPlayer.tsx
    SpotifyEmbed.tsx
    SocialLinks.tsx
    MembersList.tsx
  pages/
    Home.tsx          ← landing / roster grid
    BandPage.tsx      ← individual EPK page (used for all bands)
    Contact.tsx       ← booking / contact form
public/
  CNAME             ← hoster.band (for GitHub Pages custom domain)
  404.html          ← makes React Router work on GitHub Pages
  photos/           ← put local photos here (or use Cloudinary)
```

---

## Tech stack

- **Vite** + **React** + **TypeScript**
- **Tailwind CSS**
- **React Router v6** (BrowserRouter with GH Pages 404 fix)
- **gh-pages** for deployment
