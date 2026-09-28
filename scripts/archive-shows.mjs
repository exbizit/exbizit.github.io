#!/usr/bin/env node
/**
 * Moves shows that have happened out of the upcoming lists and into
 * src/data/shows.past.json. Run every 2 days by the "Archive past shows"
 * GitHub Action; safe to run by hand any time.
 *
 *   - "Happened" means its date is before today in Orlando. A show tonight
 *     stays upcoming until tomorrow.
 *   - Taken out of shows.manual.json and shows.generated.json.
 *   - The flyer is saved into public/photos/shows/<id>.<ext>, since ticketing
 *     sites take event art down once a show is over.
 *   - Cancelled shows are dropped rather than archived.
 *   - Entries already in the archive are never touched, so links or a better
 *     flyer added by hand stay put.
 *
 * Usage:  npm run archive-shows           # archive and write
 *         npm run archive-shows -- --dry  # print what would move, write nothing
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const MANUAL = join(root, 'src/data/shows.manual.json')
const GENERATED = join(root, 'src/data/shows.generated.json')
const PAST = join(root, 'src/data/shows.past.json')
const FLYERS = join(root, 'public/photos/shows')
const DRY = process.argv.includes('--dry')
const TZ = 'America/New_York'

const readJson = p => JSON.parse(readFileSync(p, 'utf8'))
const writeJson = (p, v) => writeFileSync(p, JSON.stringify(v, null, 2) + '\n')

// en-CA formats as YYYY-MM-DD, which compares correctly as a string
const today = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const happened = s => s.date.slice(0, 10) < today

async function saveFlyer(show) {
  if (!show.poster || !/^https?:\/\//.test(show.poster)) return show.poster
  const ext = (show.poster.match(/\.(jpe?g|png|webp|gif)(?:$|\?)/i)?.[1] ?? 'jpg').toLowerCase().replace('jpeg', 'jpg')
  const file = `${show.id.replace(/[^a-z0-9-]/gi, '-')}.${ext}`
  const local = `/photos/shows/${file}`
  if (existsSync(join(FLYERS, file))) return local
  try {
    const res = await fetch(show.poster)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    if (!DRY) {
      mkdirSync(FLYERS, { recursive: true })
      writeFileSync(join(FLYERS, file), Buffer.from(await res.arrayBuffer()))
    }
    return local
  } catch (e) {
    // Keep the remote link; the next run tries again
    console.warn(`  ! flyer for ${show.id}: ${e.message}`)
    return show.poster
  }
}

/** The archived form: no ticket links or on-sale status, room for hand-added links. */
function toPast(show, poster) {
  const { ticketUrl, status, source, ...rest } = show
  return { ...rest, ...(poster ? { poster } : {}), links: show.links ?? [] }
}

const manual = readJson(MANUAL)
const generated = readJson(GENERATED)
const past = readJson(PAST)
const archivedIds = new Set(past.shows.map(s => s.id))

const moved = []
const dropped = []
for (const show of [...manual.shows, ...generated]) {
  if (!happened(show)) continue
  if (show.status === 'cancelled') {
    dropped.push(show.id)
    continue
  }
  if (archivedIds.has(show.id)) continue
  archivedIds.add(show.id)
  moved.push(toPast(show, await saveFlyer(show)))
}

// Anything archived earlier whose flyer is still remote gets another go
const retried = []
for (const s of past.shows) {
  if (s.poster && /^https?:\/\//.test(s.poster)) {
    const local = await saveFlyer(s)
    if (local !== s.poster) {
      s.poster = local
      retried.push(s.id)
    }
  }
}

const upcomingManual = manual.shows.filter(s => !happened(s))
const upcomingGenerated = generated.filter(s => !happened(s))
const changed =
  moved.length || retried.length || upcomingManual.length !== manual.shows.length || upcomingGenerated.length !== generated.length

console.log(`Today in Orlando: ${today}`)
for (const s of moved) console.log(`  archived  ${s.date.slice(0, 10)}  ${s.venue}  (${s.id})`)
for (const id of dropped) console.log(`  dropped   cancelled show ${id}`)
for (const id of retried) console.log(`  flyer     saved for ${id}`)
if (!changed) console.log('Nothing to archive.')

if (changed && !DRY) {
  past.shows = [...moved, ...past.shows].sort((a, b) => b.date.localeCompare(a.date))
  writeJson(PAST, past)
  writeJson(MANUAL, { ...manual, shows: upcomingManual })
  writeJson(GENERATED, upcomingGenerated)
}
