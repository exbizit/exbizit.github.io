#!/usr/bin/env node
/**
 * Resolves album artwork for src/data/listening.ts via Apple's iTunes Search API.
 *
 * No API key needed, but Apple limits it to ~20 requests/minute, so this runs at
 * build time and caches to src/data/covers.generated.json. The site reads only the
 * cache — it never calls Apple — so covers can't fail to load under traffic.
 *
 * Usage:  npm run covers
 * Safe to re-run: albums already in the cache are skipped.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const LISTENING_TS = join(root, 'src/data/listening.ts')
const CACHE_JSON = join(root, 'src/data/covers.generated.json')

// Apple caps at ~20/min. 3.2s between calls keeps us comfortably under.
const THROTTLE_MS = 3200
const ARTWORK_SIZE = '600x600bb'

const coverKey = (artist, album) =>
  `${artist}|||${album}`.toLowerCase().replace(/\s+/g, ' ').trim()

/**
 * Pulls { artist, album } pairs out of the LISTENING array without importing TS.
 * Only reads entries that lack a manual coverUrl.
 */
function parseListening() {
  const src = readFileSync(LISTENING_TS, 'utf8')
  const start = src.indexOf('export const LISTENING')
  if (start === -1) throw new Error('Could not find LISTENING array')
  const body = src.slice(start, src.indexOf('\n]', start))

  const entries = []
  // Match object literals, ignoring commented-out lines
  for (const raw of body.split(/\},?/)) {
    const line = raw
      .split('\n')
      .filter(l => !l.trim().startsWith('//'))
      .join('\n')
    const artist = line.match(/artist:\s*['"`]([^'"`]+)['"`]/)
    const album = line.match(/album:\s*['"`]([^'"`]+)['"`]/)
    const manual = /coverUrl:\s*['"`]/.test(line)
    if (artist && album && !manual) {
      entries.push({ artist: artist[1], album: album[1] })
    }
  }
  return entries
}

async function lookup(artist, album) {
  const url =
    'https://itunes.apple.com/search?' +
    new URLSearchParams({
      term: `${artist} ${album}`,
      entity: 'album',
      limit: '1',
    })

  const res = await fetch(url, { headers: { 'User-Agent': 'hoster.band cover fetch' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const { results } = await res.json()
  if (!results?.length) return null

  // artworkUrl100 ends in /100x100bb.jpg — swap for a larger render
  return results[0].artworkUrl100?.replace(/\/\d+x\d+bb\./, `/${ARTWORK_SIZE}.`) ?? null
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function main() {
  let cache = {}
  try {
    cache = JSON.parse(readFileSync(CACHE_JSON, 'utf8'))
  } catch {
    /* first run */
  }

  const entries = parseListening()
  const todo = entries.filter(e => !cache[coverKey(e.artist, e.album)])

  console.log(`${entries.length} album(s) in listening.ts · ${todo.length} need artwork`)
  if (todo.length === 0) {
    console.log('Nothing to fetch. Cache is current.')
    return
  }

  let found = 0
  for (const [i, e] of todo.entries()) {
    const label = `${e.artist} — ${e.album}`
    try {
      const art = await lookup(e.artist, e.album)
      if (art) {
        cache[coverKey(e.artist, e.album)] = art
        found++
        console.log(`  ok    ${label}`)
      } else {
        console.log(`  none  ${label}  (add a coverUrl by hand)`)
      }
    } catch (err) {
      console.log(`  fail  ${label}  (${err.message})`)
    }
    if (i < todo.length - 1) await sleep(THROTTLE_MS)
  }

  writeFileSync(CACHE_JSON, JSON.stringify(cache, null, 2) + '\n')
  console.log(`\nResolved ${found}/${todo.length}. Wrote ${CACHE_JSON.replace(root + '/', '')}`)
  if (found < todo.length) {
    console.log('Unresolved albums render as a text tile — set coverUrl to fix.')
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
