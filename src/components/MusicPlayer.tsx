import { useEffect, useState } from 'react'
import { BrandIcon } from './SocialLinks'
import AudioFrame from './AudioFrame'
import { usePageSlug } from './MusicContext'
import { getBandBySlug, type Band } from '../data/bands'

/**
 * Site-wide floating "PLAY MUSIC" button, bottom-right, mounted once in App.tsx
 * so it survives page changes: start a record, wander the site, it keeps going.
 *
 * - On a band page it offers that band's Bandcamp / Spotify (tabs when both).
 * - Elsewhere it shows whatever you last had loaded.
 * - A player keeps running while hidden. Clicking into any other player on the
 *   site (another band's, a video, a Spotify embed) stops this one, and vice
 *   versa (lib/audioFocus.ts), so only one source plays at a time.
 */
type Source = 'bandcamp' | 'spotify'
type Session = { slug: string; source: Source }

const FONT_ID = 'play-music-font'
// Glitched, sliced sans
const FONT_FAMILY = "'Rubik Glitch', system-ui, sans-serif"

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

function spotifyArtistId(band: Band) {
  return (
    band.socials
      .find(s => s.platform === 'spotify')
      ?.url.match(/open\.spotify\.com\/artist\/([A-Za-z0-9]+)/)?.[1] ?? null
  )
}

function sourcesFor(band: Band): Source[] {
  const out: Source[] = []
  if (band.bandcamp?.embedAlbumId) out.push('bandcamp')
  if (band.spotifyPlayerAlbumId || spotifyArtistId(band)) out.push('spotify')
  return out
}

function frameSrc(band: Band, source: Source) {
  if (source === 'bandcamp') {
    const link = band.accentColor.replace('#', '')
    return `https://bandcamp.com/EmbeddedPlayer/album=${band.bandcamp!.embedAlbumId}/size=large/bgcol=000000/linkcol=${link}/tracklist=true/artwork=small/transparent=true/`
  }
  const target = band.spotifyPlayerAlbumId
    ? `album/${band.spotifyPlayerAlbumId}`
    : `artist/${spotifyArtistId(band)}`
  return `https://open.spotify.com/embed/${target}?utm_source=generator&theme=0`
}

export default function MusicPlayer() {
  useButtonFont()
  const pageSlug = usePageSlug()
  const [sessions, setSessions] = useState<Session[]>([])
  const [open, setOpen] = useState(false)
  const [tabs, setTabs] = useState<Record<string, Source>>({})

  const pageBand = pageSlug ? getBandBySlug(pageSlug) : undefined
  const lastSlug = sessions[sessions.length - 1]?.slug ?? null
  // The band the button is for: this page's, else whatever was last loaded
  const band = pageBand && sourcesFor(pageBand).length ? pageBand : lastSlug ? getBandBySlug(lastSlug) : undefined
  const sources = band ? sourcesFor(band) : []
  const tab: Source | undefined = band
    ? tabs[band.slug] ??
      (band.playerDefault && sources.includes(band.playerDefault) ? band.playerDefault : sources[0])
    : undefined

  // Arriving on a different band's page folds the panel away; its button then
  // opens that band. Anything already playing carries on underneath.
  useEffect(() => {
    setOpen(false)
  }, [pageSlug])

  if (!band || !tab) return null

  const has = (slug: string, source: Source) =>
    sessions.some(s => s.slug === slug && s.source === source)
  const ensure = (slug: string, source: Source) =>
    setSessions(ss => (ss.some(s => s.slug === slug && s.source === source) ? ss : [...ss, { slug, source }]))
  const drop = (slug: string, source?: Source) =>
    setSessions(ss => ss.filter(s => !(s.slug === slug && (!source || s.source === source))))

  const toggle = () => {
    ensure(band.slug, tab)
    setOpen(o => !o)
  }
  const show = (s: Source) => {
    setTabs(t => ({ ...t, [band.slug]: s }))
    ensure(band.slug, s)
  }

  const elsewhere = [...new Set(sessions.filter(s => s.slug !== band.slug).map(s => s.slug))]
    .map(getBandBySlug)
    .filter((b): b is Band => Boolean(b))

  const accent = band.accentColor
  const frame = { border: 0, width: '100%', height: '352px' } as const

  return (
    <div className="fixed z-40 flex flex-col items-end gap-3" style={{ right: 16, bottom: 16 }}>
      {sessions.length > 0 && (
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
          {elsewhere.length > 0 && (
            <div
              className="label flex items-center gap-2 px-3 py-1.5"
              style={{ color: 'var(--ash)', borderBottom: '1px solid var(--iron)' }}
            >
              <span>Still loaded: {elsewhere.map(b => b.name).join(', ')}</span>
              <button
                type="button"
                onClick={() => elsewhere.forEach(b => drop(b.slug))}
                className="ml-auto hover:text-white"
                style={{ color: 'var(--bone)' }}
              >
                Stop
              </button>
            </div>
          )}

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
                    color: tab === s ? accent : 'var(--ash)',
                    borderBottom: `2px solid ${tab === s ? accent : 'transparent'}`,
                  }}
                >
                  <BrandIcon slug={s} size={14} />
                  {s === 'bandcamp' ? 'Bandcamp' : 'Spotify'}
                </button>
              ))}
            </div>
          )}

          {/* Every loaded player stays mounted (so it keeps playing); only the
              current band + tab is shown. */}
          {sessions.map(s => {
            const b = getBandBySlug(s.slug)
            if (!b) return null
            const visible = s.slug === band.slug && s.source === tab
            return (
              <AudioFrame
                key={`${s.slug}:${s.source}`}
                stopWith="custom"
                onStop={() => drop(s.slug, s.source)}
                src={frameSrc(b, s.source)}
                title={`${b.name} on ${s.source === 'bandcamp' ? 'Bandcamp' : 'Spotify'}`}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                style={{ ...frame, display: visible ? 'block' : 'none' }}
              />
            )
          })}
          {!has(band.slug, tab) && open && (
            <p className="p-4" style={{ color: 'var(--dust)' }}>Loading…</p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="music-panel"
        aria-label={open ? 'Hide music player' : `Play ${band.name}`}
        className="flex items-center gap-2 rounded-full transition-transform duration-200 hover:scale-105 hover:-rotate-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{
          height: 52,
          padding: open ? '0' : '0 20px 0 16px',
          width: open ? 52 : undefined,
          justifyContent: 'center',
          background: accent,
          color: '#000',
          boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
          outlineColor: accent,
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
