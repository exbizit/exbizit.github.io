/**
 * Each band's releases, for the cover strip under the hero links.
 *
 * discography.generated.json is written by `npm run discography` (Spotify for
 * covers, plus Apple Music and Bandcamp matches). discography.links.json holds
 * links set by hand, keyed by Spotify album id, and always wins.
 */
import generated from './discography.generated.json'
import manual from './discography.links.json'

export interface Release {
  id: string
  title: string
  type?: string          // 'album' | 'single' | 'compilation'
  date?: string          // YYYY, YYYY-MM or YYYY-MM-DD
  cover: string | null
  spotify: string | null
  appleMusic: string | null
  bandcamp: string | null
  /** Best-effort 30s clip from iTunes search — see Listen.previewUrl for why it's often null. */
  previewUrl?: string | null
}

type Links = Partial<Pick<Release, 'spotify' | 'appleMusic' | 'bandcamp'>>

const BANDS = (generated as { bands: Record<string, Release[]> }).bands ?? {}
const MANUAL = manual as unknown as Record<string, Links | string>

export function getReleases(slug: string): Release[] {
  return (BANDS[slug] ?? [])
    .filter(r => r.cover)
    .map(r => {
      const m = MANUAL[r.id]
      return typeof m === 'object' ? { ...r, ...m } : r
    })
}
