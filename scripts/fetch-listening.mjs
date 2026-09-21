#!/usr/bin/env node
/**
 * Pulls what Brett actually has on repeat from Spotify into
 * src/data/listening.generated.json.
 *
 * ── Why this runs at build time, not in the browser ─────────────────────────
 * Spotify has no anonymous API. Every read needs an OAuth token, and a static
 * site cannot hold a secret — anything in the bundle is readable by anyone. So
 * this runs on your machine or in a GitHub Action, where the credentials stay
 * server-side, and commits a plain JSON file the site reads. Album art comes
 * from Spotify's CDN, so no separate cover lookup is needed.
 *
 * ── Source: two options ─────────────────────────────────────────────────────
 * SPOTIFY_PLAYLIST_ID  — a specific playlist. Your "On Repeat" has its own id,
 *                        but it's an algorithmic playlist and the API is
 *                        inconsistent about serving it. Grab the id from the
 *                        share link if you want to try.
 * (unset)              — falls back to /me/top/tracks?time_range=short_term,
 *                        Spotify's own "your top tracks, last 4 weeks". This is
 *                        an official endpoint, needs no id, and is the more
 *                        reliable read of "on repeat". Recommended.
 *
 * ── One-time setup ──────────────────────────────────────────────────────────
 *   1. developer.spotify.com/dashboard -> create an app
 *   2. Note the Client ID and Client Secret
 *   3. Get a refresh token with scope `user-top-read` (and
 *      `playlist-read-private` if you use a playlist id)
 *   4. Put all three in .env.local — it is gitignored
 *
 * Usage:  npm run listening           # fetch and write
 *         npm run listening -- --dry  # print, write nothing
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(root, 'src/data/listening.generated.json')
const DRY = process.argv.includes('--dry')
// Spotify caps limit at 50 per request. The three time ranges stack on the SAME
// `user-top-read` scope, so the grid fills without asking for more access.
// Order matters: short_term lands first, so current listening sits at the top
// and older favourites fill in behind it.
const PER_RANGE = 50
const RANGES = ['short_term', 'medium_term', 'long_term']
const MAX_ALBUMS = 64      // 8 rows of 8 on desktop; raise for more
const ARTIST_LIMIT = 16

/**
 * Band names from bands.ts, so the page showcases OTHER artists rather than
 * turning into self-promotion. Parsed from source rather than hardcoded, so
 * adding a band to bands.ts updates this automatically.
 */
function ownArtists() {
  const src = readFileSync(join(root, 'src/data/bands.ts'), 'utf8')
  const body = src.slice(src.indexOf('export const BANDS'))
  return (body.match(/^\s+name: (?:'|")(.+?)(?:'|"),/gm) ?? [])
    .map(l => l.replace(/^\s+name: (?:'|")/, '').replace(/(?:'|"),$/, ''))
}

const norm = s => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')

function env(key) {
  if (process.env[key]) return process.env[key]
  try {
    const m = readFileSync(join(root, '.env.local'), 'utf8').match(
      new RegExp(`^${key}=(.+)$`, 'm')
    )
    if (m) return m[1].trim()
  } catch { /* no env file */ }
  return null
}

/** Exchange the long-lived refresh token for a short-lived access token. */
async function accessToken(id, secret, refresh) {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh }),
  })
  const body = await res.text()
  if (!res.ok) throw new Error(`token ${res.status}: ${body.slice(0, 200)}`)
  const { access_token } = JSON.parse(body)
  if (!access_token) throw new Error(`no access_token in response: ${body.slice(0, 200)}`)
  return access_token
}

async function get(url, token) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  const body = await res.text()
  if (!res.ok) {
    const hint =
      res.status === 403 ? '  (token lacks the required scope?)' :
      res.status === 404 ? '  (playlist id wrong, or not visible to this account?)' : ''
    throw new Error(`${res.status}${hint}: ${body.slice(0, 200)}`)
  }
  return JSON.parse(body)
}

/** Spotify track object -> our shape. Picks the ~300px art, not the 640px one. */
function mapTrack(t) {
  if (!t || !t.album) return null
  const imgs = t.album.images ?? []
  const art =
    imgs.find(i => i.width && i.width <= 400)?.url ?? imgs[imgs.length - 1]?.url ?? imgs[0]?.url
  return {
    // kept separately: a track can credit several artists and any one of them
    // matching one of ours should exclude it
    artistNames: (t.artists ?? []).map(a => a.name),
    artist: (t.artists ?? []).map(a => a.name).join(', ') || 'Unknown',
    album: t.album.name,
    albumId: t.album.id ?? null,
    track: t.name,
    coverUrl: art ?? null,
    url: t.external_urls?.spotify ?? null,
  }
}

/** Spotify artist object -> our shape. */
function mapArtist(a) {
  if (!a) return null
  const imgs = a.images ?? []
  const img =
    imgs.find(i => i.width && i.width <= 400)?.url ?? imgs[imgs.length - 1]?.url ?? imgs[0]?.url
  return {
    name: a.name,
    imageUrl: img ?? null,
    genres: (a.genres ?? []).slice(0, 2),
    url: a.external_urls?.spotify ?? null,
  }
}

async function main() {
  const id = env('SPOTIFY_CLIENT_ID')
  const secret = env('SPOTIFY_CLIENT_SECRET')
  const refresh = env('SPOTIFY_REFRESH_TOKEN')
  const playlist = env('SPOTIFY_PLAYLIST_ID')

  const missing = [
    !id && 'SPOTIFY_CLIENT_ID',
    !secret && 'SPOTIFY_CLIENT_SECRET',
    !refresh && 'SPOTIFY_REFRESH_TOKEN',
  ].filter(Boolean)

  if (missing.length) {
    console.error(`Missing in .env.local: ${missing.join(', ')}`)
    console.error('See the header of this file for the one-time setup.')
    process.exit(1)
  }

  const token = await accessToken(id, secret, refresh)

  if (playlist && /^37i9dQZF1E/.test(playlist)) {
    console.error(
      '\nSPOTIFY_PLAYLIST_ID looks like an algorithmic playlist (On Repeat,\n' +
      'Discover Weekly, Daily Mix...). Spotify cut third-party API access to\n' +
      'those in Nov 2024 — it will 404 even for your own account.\n' +
      'Leave SPOTIFY_PLAYLIST_ID blank to use top tracks, which is the same data.\n'
    )
  }
  let raw = []

  if (playlist) {
    console.log(`playlist ${playlist}`)
    const data = await get(
      `https://api.spotify.com/v1/playlists/${playlist}/tracks?limit=${PER_RANGE}`,
      token
    )
    raw = (data.items ?? []).map(i => i.track)
  } else {
    console.log('top tracks:')
    // Separate call per range — one failing shouldn't cost us the others.
    for (const range of RANGES) {
      try {
        const data = await get(
          `https://api.spotify.com/v1/me/top/tracks?time_range=${range}&limit=${PER_RANGE}`,
          token
        )
        const items = data.items ?? []
        console.log(`  ${range.padEnd(12)} ${items.length} track(s)`)
        raw.push(...items)
      } catch (e) {
        console.error(`  ${range.padEnd(12)} failed: ${e.message}`)
      }
    }
  }

  const tracks = raw.map(mapTrack).filter(Boolean)

  // Top artists for the same window — a separate endpoint, so a failure here
  // shouldn't lose the tracks we already have.
  let artists = []
  try {
    const a = await get(
      `https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=${ARTIST_LIMIT}`,
      token
    )
    artists = (a.items ?? []).map(mapArtist).filter(Boolean)
    console.log(`${artists.length} top artist(s)`)
  } catch (e) {
    console.error(`top artists failed (continuing without them): ${e.message}`)
  }

  // Drop our own bands — this page exists to point at other people's music
  const own = new Set(ownArtists().map(norm))
  const excluded = []
  const external = tracks.filter(t => {
    const hit = (t.artistNames ?? []).some(n => own.has(norm(n)))
    if (hit) excluded.push(`${t.artist} — ${t.album}`)
    return !hit
  })
  artists = artists.filter(a => !own.has(norm(a.name)))

  if (excluded.length) {
    console.log(`\nexcluded ${excluded.length} (Hostersphere artists):`)
    for (const e of excluded) console.log(`  ${e}`)
    console.log()
  }

  // One tile per album, but the other tracks off that record aren't thrown away —
  // they're merged into `tracks`, which the hover panel lists.
  //
  // Keyed on Spotify's album id, because two tracks off the same record can carry
  // different artist credits (a feature on one), which a name key would split.
  const byAlbum = new Map()
  let merged = 0
  for (const t of external) {
    const k = t.albumId ?? `${(t.artistNames ?? [])[0] ?? ''}|||${t.album}`.toLowerCase()
    const existing = byAlbum.get(k)
    if (existing) {
      if (t.track && !existing.tracks.includes(t.track)) existing.tracks.push(t.track)
      merged++
    } else {
      byAlbum.set(k, { ...t, tracks: t.track ? [t.track] : [] })
    }
  }
  const unique = [...byAlbum.values()]
  if (merged) console.log(`merged ${merged} extra track(s) into their album tiles`)

  // What we've actually been playing by each top artist, for their hover panel.
  const tracksByArtist = new Map()
  for (const t of external) {
    for (const n of t.artistNames ?? []) {
      const k = norm(n)
      if (!tracksByArtist.has(k)) tracksByArtist.set(k, [])
      const list = tracksByArtist.get(k)
      if (t.track && !list.includes(t.track)) list.push(t.track)
    }
  }
  artists = artists.map(a => ({ ...a, tracks: (tracksByArtist.get(norm(a.name)) ?? []).slice(0, 6) }))

  const capped = unique.slice(0, MAX_ALBUMS)
  if (unique.length > MAX_ALBUMS) {
    console.log(`trimmed ${unique.length - MAX_ALBUMS} beyond MAX_ALBUMS (${MAX_ALBUMS})`)
  }

  console.log(`\n${tracks.length} track(s) -> ${capped.length} album(s) on the page`)
  for (const t of capped) console.log(`  ${t.artist} — ${t.album}`)
  if (artists.length) {
    console.log('\ntop artists:')
    for (const a of artists) console.log(`  ${a.name}`)
  }

  const payload = {
    updated: new Date().toISOString(),
    // eslint-disable-next-line no-unused-vars
    ...{},
    profileUrl: env('SPOTIFY_PROFILE_URL') ?? null,
    artists,
    items: capped.map(({ artistNames, albumId, ...rest }) => rest),
  }

  if (DRY) {
    console.log('\n--dry: nothing written.')
    return
  }
  writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n')
  console.log(`\nWrote src/data/listening.generated.json`)
}

main().catch(e => { console.error(`\n${e.message}`); process.exit(1) })
