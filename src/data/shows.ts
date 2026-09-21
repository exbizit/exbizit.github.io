// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SHOWS.TS — upcoming and past dates.
//
// A show lists every band on the bill in `lineup`. That one entry then appears
// on the /shows page AND on each of those bands' EPK pages automatically — so a
// Hoster + Mary's White Lie double bill is written once, not twice.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import generated from './shows.generated.json'

export type ShowStatus = 'onsale' | 'soldout' | 'free' | 'cancelled'

export interface Show {
  id: string
  /** ISO 8601 local time — '2026-10-15T20:00' */
  date: string
  venue: string
  city: string
  /** Band slugs on the bill (must match a slug in bands.ts) */
  lineup: string[]
  /** Other acts not in our roster, shown as plain text */
  alsoPlaying?: string[]
  ticketUrl?: string
  status?: ShowStatus
  note?: string
  /** 'ticketweb' rows are overwritten by the importer — hand-edit 'manual' rows only */
  source?: 'manual' | 'ticketweb'
}

// ─────────────────────────────────────────────────────────────────────────────
// Add shows here. Example shape (uncomment and edit):
//
// {
//   id: 'will-2026-10-15',
//   date: '2026-10-15T20:00',
//   venue: "Will's Pub",
//   city: 'Orlando, FL',
//   lineup: ['hoster', 'maryswhitelie'],   // appears on BOTH bands' EPK pages
//   alsoPlaying: ['Some Other Band'],
//   ticketUrl: 'https://www.ticketweb.com/event/...',
//   status: 'onsale',
//   source: 'manual',
// },
// ─────────────────────────────────────────────────────────────────────────────

/** Hand-written dates. These are never touched by the Bandsintown importer. */
export const MANUAL_SHOWS: Show[] = [
  {
    id: 'framework-2026-09-26',
    date: '2026-09-26T20:00',
    venue: 'Framework',
    city: 'Orlando, FL',
    lineup: ['maryswhitelie'],
    alsoPlaying: ['Sally Wants', 'velora', 'Eyelash'],
    ticketUrl:
      'https://www.ticketweb.com/event/sally-wants-with-velora-eyelash-framework-tickets/14328064',
    status: 'onsale',
    note: 'All ages · 1201 N Mills Ave',
    source: 'manual',
  },
]

/**
 * Imported from Bandsintown by `npm run shows`. Do not hand-edit — it gets
 * overwritten. Ticket links here point at whatever platform sells the show
 * (TicketWeb included), since that's what Bandsintown's offers[] carries.
 */
const GENERATED_SHOWS = generated as Show[]

/**
 * Everything, manual first. If the same show exists in both (matched on venue +
 * calendar day), the manual row wins — your hand-written detail beats the feed.
 */
export const SHOWS: Show[] = (() => {
  const dayKey = (s: Show) =>
    `${s.venue.toLowerCase().trim()}|${new Date(s.date).toDateString()}`
  const seen = new Set(MANUAL_SHOWS.map(dayKey))
  return [...MANUAL_SHOWS, ...GENERATED_SHOWS.filter(s => !seen.has(dayKey(s)))]
})()

/** Start of today — a show later tonight still counts as upcoming. */
function todayStart(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

const byDateAsc = (a: Show, b: Show) => +new Date(a.date) - +new Date(b.date)

export function getUpcomingShows(): Show[] {
  const cutoff = todayStart()
  return SHOWS.filter(s => +new Date(s.date) >= cutoff && s.status !== 'cancelled').sort(byDateAsc)
}

export function getPastShows(): Show[] {
  const cutoff = todayStart()
  return SHOWS.filter(s => +new Date(s.date) < cutoff).sort((a, b) => byDateAsc(b, a))
}

/** Upcoming shows this band is on the bill for. */
export function getShowsForBand(slug: string): Show[] {
  return getUpcomingShows().filter(s => s.lineup.includes(slug))
}

export function formatShowDate(iso: string): { day: string; month: string; weekday: string; time: string } {
  const d = new Date(iso)
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  }
}
