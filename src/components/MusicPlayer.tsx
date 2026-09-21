import { useEffect, useState } from 'react'
import { BrandIcon } from './SocialLinks'

/**
 * Floating "PLAY MUSIC" button, bottom-right. It opens a panel with the band's
 * Bandcamp and/or Spotify player, switchable by tab.
 *
 * Each player loads the first time its tab is shown, then stays mounted while
 * hidden (collapsed panel or other tab), so the music keeps playing as you
 * scroll. Switching tabs doesn't pause the other player; pause it there first.
 */
type Source = 'bandcamp' | 'spotify'

const FONT_ID = 'play-music-font'
// Glitched, sliced sans
const FONT_FAMILY = "'Rubik Glitch', system-ui, sans-serif"

/** Loads just the glyphs the button uses from Google Fonts, once. */
function useButtonFont() {
  useEffect(() => {
    if (document.getElementById(FONT_ID)) return
    const link = document.createElement('link')
    link.id = FONT_ID
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Rubik+Glitch&display=swap&text=' +
      encodeURIComponent('PLAY MUSIC')
    document.head.appendChild(link)
  }, [])
}

export default function MusicPlayer({
  bandName,
  accentColor,
  bandcamp,
  spotifyArtistId,
  defaultSource,
  spotifyAlbumId,
}: {
  bandName: string
  accentColor: string
  bandcamp?: { embedAlbumId: string; albumUrl: string }
  spotifyArtistId?: string | null
  defaultSource?: Source
  /** Pin one album in the Spotify tab instead of the artist profile */
  spotifyAlbumId?: string
}) {
  useButtonFont()
  const sources: Source[] = [
    ...(bandcamp ? (['bandcamp'] as const) : []),
    ...(spotifyArtistId || spotifyAlbumId ? (['spotify'] as const) : []),
  ]
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Source>(
    defaultSource && sources.includes(defaultSource) ? defaultSource : sources[0] ?? 'bandcamp'
  )
  const [loaded, setLoaded] = useState<Record<Source, boolean>>({ bandcamp: false, spotify: false })

  if (sources.length === 0) return null

  const show = (s: Source) => {
    setTab(s)
    setLoaded(l => ({ ...l, [s]: true }))
  }
  const toggle = () => {
    setLoaded(l => ({ ...l, [tab]: true }))
    setOpen(o => !o)
  }

  const linkColor = accentColor.replace('#', '')
  const frame = { border: 0, width: '100%', height: '352px', display: 'block' } as const

  return (
    <div className="fixed z-40 flex flex-col items-end gap-3" style={{ right: 16, bottom: 16 }}>
      {(loaded.bandcamp || loaded.spotify) && (
        <div
          id="music-panel"
          className="transition-all duration-200 origin-bottom-right"
          style={{
            width: 'min(360px, calc(100vw - 32px))',
            background: '#000',
            border: '1px solid var(--iron)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            opacity: open ? 1 : 0,
            transform: open ? 'none' : 'translateY(8px) scale(0.98)',
            visibility: open ? 'visible' : 'hidden',
            pointerEvents: open ? 'auto' : 'none',
          }}
        >
          {sources.length > 1 && (
            <div className="flex" role="tablist" style={{ borderBottom: '1px solid var(--iron)' }}>
              {sources.map(s => (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={tab === s}
                  onClick={() => show(s)}
                  className="label flex-1 flex items-center justify-center gap-2 py-2 transition-colors"
                  style={{
                    color: tab === s ? accentColor : 'var(--ash)',
                    borderBottom: `2px solid ${tab === s ? accentColor : 'transparent'}`,
                  }}
                >
                  <BrandIcon slug={s} size={14} />
                  {s === 'bandcamp' ? 'Bandcamp' : 'Spotify'}
                </button>
              ))}
            </div>
          )}

          {bandcamp && loaded.bandcamp && (
            <iframe
              style={{ ...frame, display: tab === 'bandcamp' ? 'block' : 'none' }}
              src={`https://bandcamp.com/EmbeddedPlayer/album=${bandcamp.embedAlbumId}/size=large/bgcol=000000/linkcol=${linkColor}/tracklist=true/artwork=small/transparent=true/`}
              seamless
              title={`${bandName} on Bandcamp`}
            >
              <a href={bandcamp.albumUrl}>{bandName} on Bandcamp</a>
            </iframe>
          )}
          {(spotifyArtistId || spotifyAlbumId) && loaded.spotify && (
            <iframe
              style={{ ...frame, display: tab === 'spotify' ? 'block' : 'none' }}
              src={`https://open.spotify.com/embed/${
                spotifyAlbumId ? `album/${spotifyAlbumId}` : `artist/${spotifyArtistId}`
              }?utm_source=generator&theme=0`}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              title={`${bandName} on Spotify`}
            />
          )}
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="music-panel"
        aria-label={open ? 'Hide music player' : `Play ${bandName}`}
        className="flex items-center gap-2 rounded-full transition-transform duration-200 hover:scale-105 hover:-rotate-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{
          height: 52,
          padding: open ? '0' : '0 20px 0 16px',
          width: open ? 52 : undefined,
          justifyContent: 'center',
          background: accentColor,
          color: '#000',
          boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
          outlineColor: accentColor,
        }}
      >
        {open ? (
          <span aria-hidden="true" style={{ fontSize: '1.6rem', lineHeight: 1 }}>×</span>
        ) : (
          <>
            <span aria-hidden="true" style={{ fontSize: '1.4rem', lineHeight: 1 }}>♫</span>
            <span style={{ fontFamily: FONT_FAMILY, fontSize: '1.15rem', letterSpacing: '0.03em', lineHeight: 1 }}>
              PLAY MUSIC
            </span>
          </>
        )}
      </button>
    </div>
  )
}
