#!/usr/bin/env node
/**
 * Looks up fresh stream links for every track in bandcamp.generated.json and
 * hands them to the Worker (PUT /bandcamp/streams), which relays them to
 * HosterAmp. Run every 6 hours by the "Refresh Bandcamp streams" Action: the
 * links expire after about a day, and Bandcamp's pages refuse requests from
 * Cloudflare, so the Worker can't fetch them itself.
 *
 * Needs BANDCAMP_SYNC_TOKEN (env or .env.local), matching the Worker secret.
 * Usage:  node scripts/sync-bandcamp-streams.mjs [--dry]
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const DRY = process.argv.includes('--dry')
// A full browser user-agent gets a page variant without the embedded track data
const UA = 'Mozilla/5.0'

function env(key) {
  if (process.env[key]) return process.env[key]
  try {
    const m = readFileSync(join(root, '.env.local'), 'utf8').match(new RegExp(`^${key}=(.+)$`, 'm'))
    if (m) return m[1].trim()
  } catch { /* no env file */ }
  return null
}

const api = readFileSync(join(root, 'src/data/board.ts'), 'utf8').match(/BOARD_API = '([^']+)'/)?.[1]
const token = env('BANDCAMP_SYNC_TOKEN')
if (!api) throw new Error('BOARD_API not found in src/data/board.ts')
if (!token && !DRY) throw new Error('BANDCAMP_SYNC_TOKEN missing (env or .env.local)')

const unescapeHtml = s =>
  s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

const { bands } = JSON.parse(readFileSync(join(root, 'src/data/bandcamp.generated.json'), 'utf8'))
const streams = {}
let failed = 0
for (const release of Object.values(bands).flat()) {
  try {
    const res = await fetch(release.url, { headers: { 'User-Agent': UA } })
    const m = (await res.text()).match(/data-tralbum="([^"]+)"/)
    if (!res.ok || !m) throw new Error(`HTTP ${res.status}${m ? '' : ', no track data'}`)
    for (const t of JSON.parse(unescapeHtml(m[1])).trackinfo ?? []) {
      const src = t.file?.['mp3-128']
      if (src) streams[String(t.track_id ?? t.id)] = src
    }
  } catch (e) {
    failed++
    console.warn(`  ! ${release.url}: ${e.message}`)
  }
  await new Promise(r => setTimeout(r, 400))
}

console.log(`${Object.keys(streams).length} stream links from ${Object.values(bands).flat().length - failed} releases`)
if (DRY) process.exit(0)

const res = await fetch(`${api}/bandcamp/streams`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ streams }),
})
const out = await res.text()
if (!res.ok) throw new Error(`Worker ${res.status}: ${out}`)
console.log(`Worker: ${out}`)
if (failed) process.exitCode = 1
