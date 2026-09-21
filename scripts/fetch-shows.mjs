#!/usr/bin/env node
/**
 * Imports tour dates from the Bandsintown public API into src/data/shows.generated.json.
 *
 * TicketWeb links arrive through this: Bandsintown's `offers[].url` points at whatever
 * platform sells the show, TicketWeb included. There is no direct TicketWeb API.
 *
 * ── You need an app_id ────────────────────────────────────────────────────────
 * Bandsintown's OpenAPI spec states the app_id is "assigned to you by Bandsintown"
 * and requires explicit written consent. Self-assigned values return 403.
 * Request one, then put it in .env.local as BANDSINTOWN_APP_ID.
 *   docs: https://help.artists.bandsintown.com/en/articles/9186477-api-documentation
 *
 * ── Usage ────────────────────────────────────────────────────────────────────
 *   npm run shows           # fetch and write
 *   npm run shows -- --dry  # print what it WOULD write, touch nothing
 *
 * Generated rows carry source:'ticketweb'. Hand-written rows in shows.ts keep
 * source:'manual' and are never touched by this script.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(root, 'src/data/shows.generated.json')
const DRY = process.argv.includes('--dry')

const BASE = 'https://rest.bandsintown.com'
const THROTTLE_MS = 1200

// Your Bandsintown artist name → the band slug in bands.ts.
// The API matches on the artist's Bandsintown profile name, so if a lookup comes back
// empty, check the exact spelling on their Bandsintown page first.
const ARTISTS = [
  { bandsintown: 'Hoster',            slug: 'hoster' },
  { bandsintown: "Mary's White Lie",  slug: 'maryswhitelie' },
  { bandsintown: 'Head Banned',       slug: 'headbanned' },
  { bandsintown: 'zeroindex',         slug: 'zeroindex' },
  { bandsintown: "Roger's Only Son",  slug: 'rogersonlyson' },
]

/** Reads BANDSINTOWN_APP_ID out of .env.local without needing dotenv. */
function appId() {
  if (process.env.BANDSINTOWN_APP_ID) return process.env.BANDSINTOWN_APP_ID
  try {
    const env = readFileSync(join(root, '.env.local'), 'utf8')
    const m = env.match(/^BANDSINTOWN_APP_ID=(.+)$/m)
    if (m) return m[1].trim()
  } catch { /* no env file */ }
  return null
}

/** Bandsintown artist names -> our slugs, for resolving a shared bill. */
const NAME_TO_SLUG = new Map(
  ARTISTS.map(a => [a.bandsintown.toLowerCase().replace(/[^a-z0-9]/g, ''), a.slug])
)
const normalise = s => s.toLowerCase().replace(/[^a-z0-9]/g, '')

function mapEvent(ev, ownerSlug) {
  // lineup names that are ours become slugs; everyone else is a guest act
  const lineup = new Set([ownerSlug])
  const alsoPlaying = []
  for (const name of ev.lineup ?? []) {
    const slug = NAME_TO_SLUG.get(normalise(name))
    if (slug) lineup.add(slug)
    else if (name) alsoPlaying.push(name)
  }

  const offers = ev.offers ?? []
  const ticket = offers.find(o => /ticket/i.test(o.type ?? '')) ?? offers[0]
  const soldOut = offers.some(o => /sold\s*out/i.test(o.status ?? ''))

  const v = ev.venue ?? {}
  const city = [v.city, v.region || v.country].filter(Boolean).join(', ')

  return {
    id: `bit-${ev.id}`,
    date: ev.datetime,
    venue: v.name ?? 'TBA',
    city: city || 'TBA',
    lineup: [...lineup],
    ...(alsoPlaying.length ? { alsoPlaying } : {}),
    // offers[].url is where a TicketWeb link shows up; ev.url is the BIT event page
    ticketUrl: ticket?.url ?? ev.url,
    ...(soldOut ? { status: 'soldout' } : {}),
    source: 'ticketweb',
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function main() {
  const id = appId()
  if (!id) {
    console.error('No BANDSINTOWN_APP_ID found in .env.local or the environment.')
    console.error('Request one: https://help.artists.bandsintown.com/en/articles/9186477-api-documentation')
    process.exit(1)
  }

  const all = []
  let failures = 0

  for (const [i, artist] of ARTISTS.entries()) {
    const url =
      `${BASE}/artists/${encodeURIComponent(artist.bandsintown)}/events/` +
      `?app_id=${encodeURIComponent(id)}&date=upcoming`

    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      const body = await res.text()

      if (!res.ok) {
        failures++
        console.error(`  ${res.status}  ${artist.bandsintown}`)
        if (res.status === 403) {
          console.error('        403 means the app_id was rejected. Bandsintown must issue it.')
        }
        console.error(`        ${body.slice(0, 160)}`)
        continue
      }

      let data
      try {
        data = JSON.parse(body)
      } catch {
        failures++
        console.error(`  bad JSON for ${artist.bandsintown}: ${body.slice(0, 160)}`)
        continue
      }

      // A name with no profile can come back as {} or an error object rather than []
      if (!Array.isArray(data)) {
        console.error(`  ${artist.bandsintown}: expected an array, got ${JSON.stringify(data).slice(0, 120)}`)
        console.error('        Usually means no Bandsintown profile under that exact name.')
        failures++
        continue
      }

      const mapped = data.map(ev => mapEvent(ev, artist.slug))
      all.push(...mapped)
      console.log(`  ok    ${artist.bandsintown}: ${mapped.length} upcoming`)
    } catch (err) {
      failures++
      console.error(`  fail  ${artist.bandsintown}: ${err.message}`)
    }

    if (i < ARTISTS.length - 1) await sleep(THROTTLE_MS)
  }

  // A shared bill appears once per artist — merge duplicates by event id
  const byId = new Map()
  for (const show of all) {
    const existing = byId.get(show.id)
    if (existing) {
      existing.lineup = [...new Set([...existing.lineup, ...show.lineup])]
    } else {
      byId.set(show.id, show)
    }
  }
  const shows = [...byId.values()].sort((a, b) => +new Date(a.date) - +new Date(b.date))

  console.log(`\n${shows.length} unique show(s), ${failures} artist lookup(s) failed`)

  if (DRY) {
    console.log('\n--dry: nothing written. Would write:\n')
    console.log(JSON.stringify(shows, null, 2))
    return
  }

  writeFileSync(OUT, JSON.stringify(shows, null, 2) + '\n')
  console.log(`Wrote ${shows.length} show(s) to src/data/shows.generated.json`)
  if (failures) console.log('Some lookups failed — see above. Existing manual shows are unaffected.')
}

main().catch(e => { console.error(e); process.exit(1) })
