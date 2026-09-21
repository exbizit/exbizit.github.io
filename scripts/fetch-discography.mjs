#!/usr/bin/env node
/**
 * Pulls each band's releases into src/data/discography.generated.json:
 * cover art and Spotify link from the Spotify API, plus the matching Apple Music
 * and Bandcamp pages where they can be found.
 *
 *   Spotify     artist id from the band's Spotify link in bands.ts. Uses the
 *               client-credentials flow, so only SPOTIFY_CLIENT_ID and
 *               SPOTIFY_CLIENT_SECRET are needed (no user login).
 *   Apple Music iTunes lookup API (no key), matched to Spotify by release title.
 *               The band's Apple Music link can be an artist or an album URL.
 *   Bandcamp    no API. Guesses <band>.bandcamp.com/album|track/<title-slug>
 *               and keeps the URL only if the page really exists.
 *
 * Anything it gets wrong or misses: set it by hand in
 * src/data/discography.links.json (keyed by Spotify album id). That file is
 * never overwritten and wins over whatever this script finds.
 *
 * Usage:  npm run discography           # fetch and write
 *         npm run discography -- --dry  # print, write nothing
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(root, 'src/data/discography.generated.json')
const DRY = process.argv.includes('--dry')

function env(key) {
  if (process.env[key]) return process.env[key]
  try {
    const m = readFileSync(join(root, '.env.local'), 'utf8').match(new RegExp(`^${key}=(.+)$`, 'm'))
    if (m) return m[1].trim()
  } catch { /* no env file */ }
  return null
}

const norm = s =>
  (s ?? '')
    .toLowerCase()
    .replace(/\s+-\s+(single|ep)$/i, '') // iTunes appends " - Single" / " - EP"
    .replace(/[^a-z0-9]/g, '')

const sleep = ms => new Promise(r => setTimeout(r, ms))

/** Per-band links, parsed from bands.ts source (no TS import needed). */
function bandsFromSource() {
  const src = readFileSync(join(root, 'src/data/bands.ts'), 'utf8')
  const body = src.slice(src.indexOf('export const BANDS'))
  const blocks = body.split(/\n\s+slug: '/).slice(1)
  return blocks.map(b => {
    const slug = b.slice(0, b.indexOf("'"))
    const spotify = b.match(/open\.spotify\.com\/artist\/([A-Za-z0-9]+)/)?.[1] ?? null
    const apple = b.match(/https:\/\/music\.apple\.com\/[^'"\s]+/)?.[0] ?? null
    const bandcampSub = b.match(/https:\/\/([a-z0-9-]+)\.bandcamp\.com/)?.[1] ?? null
    return { slug, spotify, apple, bandcampSub }
  })
}

async function spotifyToken() {
  const id = env('SPOTIFY_CLIENT_ID')
  const secret = env('SPOTIFY_CLIENT_SECRET')
  if (!id || !secret) throw new Error('SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET missing (.env.local or env)')
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Spotify token ${res.status}: ${text.slice(0, 200)}`)
  return JSON.parse(text).access_token
}

async function spotifyAlbums(artistId, token) {
  const out = []
  // Small pages: newer Spotify dev-mode limits reject large `limit` values.
  let url = `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=10`
  while (url) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    const text = await res.text()
    if (!res.ok) throw new Error(`Spotify albums ${res.status}: ${text.slice(0, 200)}`)
    const page = JSON.parse(text)
    out.push(...(page.items ?? []))
    url = page.next
  }
  return out
}

/** Apple Music releases for this band, keyed by normalised title. */
async function appleReleases(appleUrl) {
  if (!appleUrl) return new Map()
  const id = appleUrl.match(/\/(\d+)(?:\?|$)/)?.[1]
  if (!id) return new Map()
  let artistId = id
  if (appleUrl.includes('/album/')) {
    const r = await (await fetch(`https://itunes.apple.com/lookup?id=${id}`)).json()
    artistId = r.results?.[0]?.artistId
    if (!artistId) return new Map()
  }
  const r = await (await fetch(`https://itunes.apple.com/lookup?id=${artistId}&entity=album&limit=200`)).json()
  const map = new Map()
  for (const x of r.results ?? []) {
    if (x.wrapperType !== 'collection') continue
    map.set(norm(x.collectionName), x.collectionViewUrl.split('?')[0])
  }
  return map
}

const bandcampSlug = s =>
  s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Bandcamp has no API: try the likely URLs and keep one that really resolves. */
async function bandcampUrl(sub, title) {
  if (!sub) return null
  const slug = bandcampSlug(title)
  if (!slug) return null
  for (const kind of ['album', 'track']) {
    const url = `https://${sub}.bandcamp.com/${kind}/${slug}`
    try {
      const res = await fetch(url, { redirect: 'manual' })
      if (res.status === 200) return url
    } catch { /* network hiccup: treat as not found */ }
    await sleep(300)
  }
  return null
}

async function main() {
  const token = await spotifyToken()
  const result = {}

  for (const band of bandsFromSource()) {
    if (!band.spotify) {
      console.log(`- ${band.slug}: no Spotify artist link in bands.ts, skipped`)
      continue
    }
    const albums = await spotifyAlbums(band.spotify, token)
    const apple = await appleReleases(band.apple).catch(e => {
      console.warn(`  ${band.slug}: Apple lookup failed (${e.message})`)
      return new Map()
    })

    // Same release can appear twice (explicit/clean, regional). Keep the first.
    const seen = new Set()
    const releases = []
    for (const a of albums) {
      const key = norm(a.name)
      if (seen.has(key)) continue
      seen.add(key)
      const imgs = a.images ?? []
      releases.push({
        id: a.id,
        title: a.name,
        type: a.album_type,                 // 'album' | 'single' | 'compilation'
        date: a.release_date,
        cover: (imgs.find(i => i.width && i.width <= 320) ?? imgs[0])?.url ?? null,
        spotify: a.external_urls?.spotify ?? null,
        appleMusic: apple.get(key) ?? null,
        bandcamp: await bandcampUrl(band.bandcampSub, a.name),
      })
    }
    releases.sort((x, y) => (y.date ?? '').localeCompare(x.date ?? ''))
    result[band.slug] = releases

    console.log(`- ${band.slug}: ${releases.length} releases`)
    for (const r of releases) {
      const got = ['spotify', r.appleMusic && 'apple', r.bandcamp && 'bandcamp'].filter(Boolean).join(', ')
      console.log(`    ${r.date}  ${r.title}  [${got}]`)
    }
  }

  const json = JSON.stringify({ updated: new Date().toISOString(), bands: result }, null, 2) + '\n'
  if (DRY) console.log('\n(dry run: nothing written)')
  else {
    writeFileSync(OUT, json)
    console.log(`\nWrote ${OUT.replace(root + '/', '')}`)
  }
}

main().catch(e => {
  console.error(e.message)
  process.exit(1)
})
