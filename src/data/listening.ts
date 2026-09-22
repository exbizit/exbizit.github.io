// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LISTENING.TS — what's on repeat.
//
// Two sources, merged:
//   generated  `npm run listening` pulls from Spotify (see scripts/fetch-listening.mjs)
//   manual     MANUAL_LISTENING below, for anything you want pinned with a note
//
// Manual entries come first and win on conflict, so a record you've written
// about won't be pushed out by the algorithm.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import generated from './listening.generated.json'

export interface Listen {
  artist: string
  album: string
  /** Set on Spotify pulls — which track specifically */
  track?: string
  /** Every track you've been playing off this album, for the hover panel */
  tracks?: string[]
  /** One line on why it's here. Worth adding to anything you pin manually. */
  note?: string
  /** Spotify supplies this; set it by hand for anything not on streaming */
  coverUrl?: string | null
  /**
   * A 30s clip, straight from Spotify's track object. Spotify stopped handing
   * these out reliably to apps created after Nov 2024, so this is often null
   * even when everything else on the track came through fine.
   */
  previewUrl?: string | null
  /** Optional: tie the pick to one of your projects (a slug from bands.ts) */
  forBand?: string
  url?: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Pinned by hand. Example:
//
// { artist: 'Deftones', album: 'White Pony', forBand: 'hoster',
//   note: 'The reason the guitars on side B sound like that.' },
// ─────────────────────────────────────────────────────────────────────────────

export const MANUAL_LISTENING: Listen[] = [
  // Nothing pinned.
]

export interface TopArtist {
  name: string
  imageUrl: string | null
  genres: string[]
  url: string | null
  /** Their tracks you've been playing, for the hover panel */
  tracks?: string[]
}

interface GeneratedPayload {
  updated: string | null
  profileUrl: string | null
  artists: TopArtist[]
  items: Listen[]
}

const payload = generated as GeneratedPayload

/** When the Spotify pull last ran — null until `npm run listening` runs. */
export const listeningUpdated: string | null = payload.updated

/** Linked from the page footer, so visitors can go to the source. */
export const spotifyProfileUrl: string | null = payload.profileUrl

/** Top artists for the same 4-week window. */
export const TOP_ARTISTS: TopArtist[] = payload.artists ?? []

/** Stable id for an album, shared with the worker's `+1` counts. */
export const albumKey = (l: Listen) => `${l.artist}|||${l.album}`.toLowerCase().replace(/\s+/g, ' ').trim()

export const LISTENING: Listen[] = (() => {
  const pinned = new Set(MANUAL_LISTENING.map(albumKey))
  return [...MANUAL_LISTENING, ...(payload.items ?? []).filter(i => !pinned.has(albumKey(i)))]
})()

/** Manual override, then whatever Spotify gave us, then null for a text tile. */
export function getCoverUrl(l: Listen): string | null {
  return l.coverUrl ?? null
}
