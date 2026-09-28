/**
 * HosterAmp's playlists.
 *
 * Full-length tracks come from each band's Bandcamp (bandcamp.generated.json,
 * written by `npm run bandcamp`), streamed through the Worker's
 * /bandcamp/stream relay, which fetches a fresh link on play and adds the CORS
 * headers Webamp needs. Releases that aren't on Bandcamp fall back to their 30s
 * preview clip.
 */
import generated from './bandcamp.generated.json'
import { BANDS, type Band } from './bands'
import { getReleases } from './discography'
import { BOARD_API } from './board'

interface BandcampRelease {
  url: string
  title: string
  date: string | null
  art: string | null
  tracks: { id: number; num: number; title: string; duration: number }[]
}

export interface AmpTrack {
  url: string
  duration?: number
  metaData: { artist: string; title: string; album?: string; albumArtUrl?: string }
  /** For the player's own bookkeeping; Webamp ignores unknown fields */
  band: string
}

const BANDCAMP = (generated as { bands: Record<string, BandcampRelease[]> }).bands ?? {}
// Overridable so the relay can be tested against `wrangler dev`
const STREAM_API: string = import.meta.env.VITE_AMP_API || BOARD_API

const norm = (s: string) => s.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]/g, '')

export function bandTracks(band: Band): AmpTrack[] {
  const bc = BANDCAMP[band.slug] ?? []
  const full: AmpTrack[] = bc.flatMap(r =>
    r.tracks.map(t => ({
      url: `${STREAM_API}/bandcamp/stream?album=${encodeURIComponent(r.url)}&track=${t.id}`,
      duration: t.duration,
      metaData: { artist: band.name, title: t.title, album: r.title, albumArtUrl: r.art ?? undefined },
      band: band.slug,
    }))
  )
  const onBandcamp = new Set(bc.map(r => norm(r.title)))
  const previews: AmpTrack[] = getReleases(band.slug)
    .filter(r => r.previewUrl && !(r.bandcamp && bc.some(b => b.url === r.bandcamp)) && !onBandcamp.has(norm(r.title)))
    .map(r => ({
      url: r.previewUrl as string,
      duration: 30,
      metaData: { artist: band.name, title: `${r.title} (preview)`, album: r.title, albumArtUrl: r.cover ?? undefined },
      band: band.slug,
    }))
  return [...full, ...previews]
}

/** Everything, starting with `firstSlug`'s tracks. */
export function allTracks(firstSlug?: string | null): AmpTrack[] {
  const order = [...BANDS].sort((a, b) => Number(b.slug === firstSlug) - Number(a.slug === firstSlug))
  return order.flatMap(bandTracks)
}
