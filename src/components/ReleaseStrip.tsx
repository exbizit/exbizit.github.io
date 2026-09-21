import type { Release } from '../data/discography'
import { BrandIcon } from './SocialLinks'

/**
 * A row of the band's release covers in full colour, under the hero links.
 *
 * Hovering (or tapping, which focuses the tile) lays the platform links over
 * the cover itself. Keeping the menu inside the tile means it can never be
 * clipped by the row's horizontal scroll or run off the page.
 */
const PLATFORMS: { key: 'bandcamp' | 'appleMusic' | 'spotify'; icon: string; label: string }[] = [
  { key: 'bandcamp', icon: 'bandcamp', label: 'Bandcamp' },
  { key: 'appleMusic', icon: 'applemusic', label: 'Apple Music' },
  { key: 'spotify', icon: 'spotify', label: 'Spotify' },
]

export default function ReleaseStrip({
  releases,
  accentColor,
}: {
  releases: Release[]
  accentColor: string
}) {
  if (releases.length === 0) return null

  return (
    <ul
      className="flex gap-2 md:gap-3 overflow-x-auto mt-3"
      style={{ scrollbarWidth: 'thin' }}
      aria-label="Releases"
    >
      {releases.map(r => {
        const links = PLATFORMS.filter(p => r[p.key])
        const year = r.date?.slice(0, 4)
        return (
          <li key={r.id} className="shrink-0">
            <div
              tabIndex={0}
              className="group relative block overflow-hidden outline-none focus-visible:ring-2"
              style={{ ['--tw-ring-color' as string]: accentColor, width: 'clamp(104px, 11vw, 164px)', aspectRatio: '1' }}
            >
              <img
                src={r.cover ?? undefined}
                alt={`${r.title}${year ? ` (${year})` : ''}`}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 group-focus-within:scale-105"
              />
              <div
                className="absolute inset-0 flex flex-col justify-between p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
                style={{ background: 'rgba(0,0,0,0.78)' }}
              >
                <p className="leading-tight" style={{ color: 'var(--bone)', fontSize: '0.7rem' }}>
                  {r.title}
                  {year && <span style={{ color: 'var(--ash)' }}> {year}</span>}
                </p>
                <div className="flex items-center -ml-0.5">
                  {links.map(p => (
                    <a
                      key={p.key}
                      href={r[p.key] ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${r.title} on ${p.label}`}
                      title={p.label}
                      className="p-0.5 transition-colors"
                      style={{ color: 'var(--bone)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = accentColor)}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--bone)')}
                    >
                      <BrandIcon slug={p.icon} size={16} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
