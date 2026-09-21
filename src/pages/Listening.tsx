import { Link } from 'react-router-dom'
import {
  LISTENING,
  TOP_ARTISTS,
  getCoverUrl,
  listeningUpdated,
  spotifyProfileUrl,
  type Listen,
} from '../data/listening'
import { getBandBySlug, bandPath } from '../data/bands'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

/**
 * One album tile. The grid reads as a wall of art; detail arrives on hover.
 *
 * Hover doesn't exist on touch, so below `md` the caption is always visible —
 * otherwise half the visitors get an unlabelled grid of squares.
 */
/**
 * Hover panel listing what's actually been playing.
 *
 * It escapes the tile rather than cramming a track list into a ~130px square,
 * so it needs a stacking context above the grid and a parent that doesn't clip.
 * Desktop only — there is no hover on touch, where the caption shows instead.
 */
function HoverPanel({
  title,
  subtitle,
  tracks,
}: {
  title: string
  subtitle?: string
  tracks?: string[]
}) {
  const shown = (tracks ?? []).slice(0, 5)
  const extra = (tracks ?? []).length - shown.length

  return (
    <div
      className="absolute left-1/2 bottom-full z-30 hidden md:block opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
      style={{ transform: 'translateX(-50%)', width: '208px', marginBottom: '8px' }}
    >
      <div
        className="p-3 text-left"
        style={{ background: 'var(--void)', border: '1px solid var(--bone)' }}
      >
        <p className="font-semibold leading-tight" style={{ color: 'var(--bone)', fontSize: '0.8rem' }}>
          {title}
        </p>
        {subtitle && (
          <p className="label mt-0.5 truncate" style={{ color: 'var(--ash)' }}>{subtitle}</p>
        )}

        {shown.length > 0 && (
          <ul className="mt-2.5 space-y-1" style={{ borderTop: '1px solid var(--iron)', paddingTop: '0.5rem' }}>
            {shown.map(t => (
              <li key={t} className="flex gap-1.5" style={{ fontSize: '0.7rem', color: 'var(--ash)' }}>
                <span style={{ color: 'var(--iron)' }}>—</span>
                <span className="leading-snug">{t}</span>
              </li>
            ))}
            {extra > 0 && (
              <li className="label pt-0.5" style={{ color: 'var(--dust)' }}>+{extra} more</li>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}

function Cover({ listen }: { listen: Listen }) {
  const art = getCoverUrl(listen)
  const band = listen.forBand ? getBandBySlug(listen.forBand) : undefined

  const inner = (
    <>
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '1', background: 'var(--void)', border: '1px solid var(--iron)' }}
      >
        {art ? (
          <img
            src={art}
            alt={`${listen.album} by ${listen.artist}`}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 md:group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col justify-end p-2">
            <span className="label truncate" style={{ color: 'var(--ash)' }}>{listen.artist}</span>
            <span className="label truncate" style={{ color: 'var(--dust)' }}>{listen.album}</span>
          </div>
        )}

        <div
          className="absolute inset-0 hidden md:block opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.45)' }}
        />
      </div>

      <HoverPanel
        title={listen.album}
        subtitle={listen.artist}
        tracks={listen.tracks ?? (listen.track ? [listen.track] : [])}
      />

      <div className="mt-1.5 md:hidden">
        <p className="truncate" style={{ color: 'var(--bone)', fontSize: '0.72rem' }}>
          {listen.track ?? listen.album}
        </p>
        <p className="label truncate" style={{ color: 'var(--ash)' }}>{listen.artist}</p>
      </div>

      {band && (
        <Link
          to={bandPath(band.slug)}
          className="label mt-1 inline-block hover:underline"
          style={{ color: band.accentColor }}
        >
          {band.name}
        </Link>
      )}
    </>
  )

  return listen.url ? (
    <a
      href={listen.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block relative"
    >
      {inner}
    </a>
  ) : (
    <div className="group relative">{inner}</div>
  )
}

export default function Listening() {
  useDocumentTitle('Listening')
  const empty = LISTENING.length === 0 && TOP_ARTISTS.length === 0

  return (
    <div style={{ paddingTop: '56px' }}>
      {/* Compact header. This is a utility page — the art carries it, not the
          type — and the meta sits inline rather than claiming its own band. */}
      <div className="max-w-7xl mx-auto px-4 pt-10 pb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h1
            className="display"
            style={{ fontSize: 'clamp(1.6rem, 4vw, 2.75rem)', color: 'var(--bone)' }}
          >
            LISTENING
          </h1>
          <p className="label" style={{ color: 'var(--ash)' }}>
            Music Brett has on repeat
            {listeningUpdated && (
              <>
                <span style={{ color: 'var(--iron)' }}> · </span>
                {spotifyProfileUrl ? (
                  <a
                    href={spotifyProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                    style={{ color: 'var(--ash)' }}
                  >
                    Spotify
                  </a>
                ) : (
                  'Spotify'
                )}
                <span style={{ color: 'var(--iron)' }}> · </span>
                <span style={{ color: 'var(--dust)' }}>
                  {new Date(listeningUpdated).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        {empty ? (
          <p style={{ color: 'var(--dust)', lineHeight: 1.7 }}>
            Nothing here yet. Add your Spotify credentials to .env.local and run{' '}
            <span style={{ color: 'var(--ash)' }}>npm run listening</span>, or pin records by
            hand in src/data/listening.ts.
          </p>
        ) : (
          <>
            {/* Artists small and first — the album wall is the point */}
            {/* wrap, not overflow-x-auto — a scroll container clips hover panels */}
            {TOP_ARTISTS.length > 0 && (
              <div className="flex flex-wrap gap-4 mb-10">
                {TOP_ARTISTS.map(a => (
                  <a
                    key={a.name}
                    href={a.url ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative shrink-0 text-center"
                    style={{ width: '72px' }}
                  >
                    <HoverPanel title={a.name} subtitle={a.genres?.[0]} tracks={a.tracks} />
                    <div
                      className="relative overflow-hidden mb-1.5"
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        background: 'var(--void)',
                        border: '1px solid var(--iron)',
                      }}
                    >
                      {a.imageUrl && (
                        <img
                          src={a.imageUrl}
                          alt={a.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-all duration-500"
                          style={{ filter: 'grayscale(1) contrast(1.1)' }}
                          onMouseEnter={e => (e.currentTarget.style.filter = 'none')}
                          onMouseLeave={e =>
                            (e.currentTarget.style.filter = 'grayscale(1) contrast(1.1)')
                          }
                        />
                      )}
                    </div>
                    <p className="label truncate" style={{ color: 'var(--dust)' }}>
                      {a.name}
                    </p>
                  </a>
                ))}
              </div>
            )}

            {LISTENING.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 md:gap-3">
                {LISTENING.map((listen, i) => (
                  <Cover key={`${listen.artist}-${listen.album}-${i}`} listen={listen} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
