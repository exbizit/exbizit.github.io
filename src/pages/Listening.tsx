import { Link } from 'react-router-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  LISTENING,
  TOP_ARTISTS,
  albumKey,
  getCoverUrl,
  listeningUpdated,
  spotifyProfileUrl,
  type Listen,
} from '../data/listening'
import { getBandBySlug, bandPath } from '../data/bands'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { BOARD_API } from '../data/board'

/** count + whether this visitor has +1'd it, per album key */
type LikeState = { count: number; mine: boolean }

/**
 * Top-artist circles above the album grid. Hidden for now (albums only);
 * set to true to bring them back, in full colour. The data is still fetched
 * by `npm run listening`, so nothing else needs to change.
 */
const SHOW_ARTISTS = false

/** Directions the click-burst's sparks fly off in, computed once. */
const SPARK_COUNT = 8
const SPARK_RADIUS = 22
const SPARKS = Array.from({ length: SPARK_COUNT }, (_, i) => {
  const angle = (i / SPARK_COUNT) * Math.PI * 2
  return { x: Math.cos(angle) * SPARK_RADIUS, y: Math.sin(angle) * SPARK_RADIUS }
})

/** How long the +1 takes to fly from the button up into the corner tally. */
const FLIGHT_MS = 620

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
 *
 * Placement is measured each time the pointer enters the tile: the panel is
 * nudged sideways to stay inside the window, and flips below the tile when
 * there isn't room above it (under the fixed nav).
 */
const EDGE = 12   // min gap between the panel and the window edge / nav
const GAP = 8     // gap between the panel and its tile
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

  const ref = useRef<HTMLDivElement>(null)
  const [shift, setShift] = useState(0)
  const [below, setBelow] = useState(false)

  useEffect(() => {
    const panel = ref.current
    const host = panel?.parentElement
    if (!panel || !host) return
    const place = () => {
      const tile = host.getBoundingClientRect()
      const width = panel.offsetWidth
      const centredLeft = tile.left + tile.width / 2 - width / 2
      const maxLeft = document.documentElement.clientWidth - EDGE - width
      setShift(Math.max(EDGE, Math.min(centredLeft, maxLeft)) - centredLeft)
      const navBottom = document.querySelector('nav')?.getBoundingClientRect().bottom ?? 0
      setBelow(tile.top - GAP - panel.offsetHeight < Math.max(navBottom, 0) + EDGE)
    }
    host.addEventListener('pointerenter', place)
    return () => host.removeEventListener('pointerenter', place)
  }, [])

  return (
    <div
      ref={ref}
      className={`absolute left-1/2 ${below ? 'top-full' : 'bottom-full'} z-30 hidden md:block opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none`}
      style={{
        transform: `translateX(calc(-50% + ${shift}px))`,
        width: '208px',
        ...(below ? { marginTop: `${GAP}px` } : { marginBottom: `${GAP}px` }),
      }}
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

function Cover({
  listen,
  like,
  onLike,
}: {
  listen: Listen
  like?: LikeState
  onLike?: (key: string) => void
}) {
  const art = getCoverUrl(listen)
  const band = listen.forBand ? getBandBySlug(listen.forBand) : undefined
  const key = albumKey(listen)
  const mine = like?.mine ?? false
  const count = like?.count ?? 0

  // The corner tally lags behind `count` while a +1 is still mid-flight, so the
  // number only ticks up once the flying chip actually arrives.
  const [displayCount, setDisplayCount] = useState(count)
  const [flight, setFlight] = useState<{ dx: number; dy: number } | null>(null)
  const [burstId, setBurstId] = useState<number | null>(null)
  const [popKey, setPopKey] = useState(0)
  const flyingRef = useRef(false)
  const timerRef = useRef<number>()
  const btnRef = useRef<HTMLButtonElement>(null)
  const badgeRef = useRef<HTMLSpanElement>(null)
  const countRef = useRef(count)
  countRef.current = count

  useEffect(() => {
    if (!flyingRef.current) setDisplayCount(count)
  }, [count])

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!onLike) return

    window.clearTimeout(timerRef.current)
    flyingRef.current = false
    setFlight(null)
    setBurstId(null)

    if (!mine && btnRef.current && badgeRef.current) {
      const from = btnRef.current.getBoundingClientRect()
      const to = badgeRef.current.getBoundingClientRect()
      flyingRef.current = true
      setFlight({
        dx: to.left + to.width / 2 - (from.left + from.width / 2),
        dy: to.top + to.height / 2 - (from.top + from.height / 2),
      })
      setBurstId(Date.now())
      timerRef.current = window.setTimeout(() => {
        flyingRef.current = false
        setDisplayCount(countRef.current)
        setPopKey(k => k + 1)
        setFlight(null)
        setBurstId(null)
      }, FLIGHT_MS)
    }

    onLike(key)
  }

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

        {onLike && (
          // Stays mounted even at zero so there's always a real position to
          // fly the +1 toward — just invisible until there's a count to show.
          <span
            ref={badgeRef}
            aria-hidden={displayCount === 0}
            className="absolute top-1 right-1 z-10 flex items-center rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold leading-none"
            style={{
              background: 'rgba(0,0,0,0.6)',
              color: 'var(--bone)',
              border: '1px solid rgba(232,230,225,0.4)',
              backdropFilter: 'blur(2px)',
              opacity: displayCount > 0 ? 1 : 0,
              pointerEvents: 'none',
            }}
          >
            {displayCount > 0 && (
              <span key={popKey} className={popKey > 0 ? 'plus1-count-pop' : undefined}>
                +{displayCount}
              </span>
            )}
          </span>
        )}

        {onLike && (
          <button
            ref={btnRef}
            type="button"
            onClick={handleLike}
            aria-pressed={mine}
            aria-label={mine ? `Remove your +1 from ${listen.album}` : `+1 ${listen.album}`}
            title={mine ? 'Remove your +1' : '+1 this album'}
            className="plus1-btn absolute bottom-1 right-1 z-10 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold leading-none transition-transform duration-150 hover:scale-110 active:scale-95"
            style={{
              background: mine ? 'var(--bone)' : 'rgba(0,0,0,0.6)',
              color: mine ? '#000' : 'var(--bone)',
              border: `1px solid ${mine ? 'var(--bone)' : 'rgba(232,230,225,0.4)'}`,
              backdropFilter: 'blur(2px)',
            }}
          >
            <span aria-hidden style={{ position: 'relative', zIndex: 1 }}>+1</span>

            {burstId && (
              <span key={burstId} className="plus1-burst" aria-hidden>
                <span className="plus1-burst-flash" />
                {SPARKS.map((s, i) => (
                  <span
                    key={i}
                    className="plus1-burst-spark"
                    style={{ '--sx': `${s.x}px`, '--sy': `${s.y}px`, animationDelay: `${i * 8}ms` } as React.CSSProperties}
                  />
                ))}
              </span>
            )}
          </button>
        )}

        {flight && (
          <span
            aria-hidden
            className="plus1-fly absolute bottom-1 right-1"
            style={{ '--dx': `${flight.dx}px`, '--dy': `${flight.dy}px` } as React.CSSProperties}
          >
            +1
          </span>
        )}
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

  const [likes, setLikes] = useState<Record<string, LikeState>>({})

  useEffect(() => {
    if (!BOARD_API || LISTENING.length === 0) return
    let cancelled = false
    const keys = LISTENING.map(albumKey)
    fetch(`${BOARD_API}/albums/likes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys }),
    })
      .then(res => res.json())
      .then(data => {
        if (!cancelled) setLikes(data.likes ?? {})
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // Toggle this visitor's +1. Updates at once, then settles on the server's
  // count (or rolls back if the request fails).
  const toggleLike = useCallback(async (key: string) => {
    if (!BOARD_API) return
    let before: LikeState | undefined
    setLikes(prev => {
      before = prev[key]
      const had = before?.mine ?? false
      const count = Math.max(0, (before?.count ?? 0) + (had ? -1 : 1))
      return { ...prev, [key]: { count, mine: !had } }
    })
    try {
      const res = await fetch(`${BOARD_API}/albums/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLikes(prev => ({ ...prev, [key]: { count: data.count, mine: data.mine } }))
    } catch {
      setLikes(prev => ({ ...prev, [key]: before ?? { count: 0, mine: false } }))
    }
  }, [])

  return (
    <div style={{ paddingTop: 'var(--nav-h, 56px)' }}>
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

        {/* What the +1 button does: a little tag that pops open on hover, focus or tap */}
        {BOARD_API && !empty && (
          <div className="group relative mt-3 inline-block">
            <button
              type="button"
              aria-describedby="plus1-explainer"
              className="label px-2.5 py-1 rounded-full transition-transform duration-200 group-hover:-rotate-3 group-focus-within:-rotate-3"
              style={{ border: '1px dashed var(--bone)', color: 'var(--bone)' }}
            >
              +1 an album ✦
            </button>
            <div
              id="plus1-explainer"
              role="tooltip"
              className="absolute left-0 top-full mt-2 z-20 w-72 p-4 rounded-2xl -rotate-1 invisible opacity-0 translate-y-1 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0"
              style={{
                background: '#0b0b0b',
                border: '1px dashed var(--bone)',
                boxShadow: '4px 4px 0 var(--iron)',
              }}
            >
              <p className="mb-2" style={{ color: 'var(--bone)', fontWeight: 600 }}>
                what's the +1? ✦
              </p>
              <p style={{ color: 'var(--ash)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Click <span style={{ color: 'var(--bone)' }}>+1</span> on any cover to vouch for it.
                Every visitor's clicks add up into one running count for that album — click again
                to take your +1 back.
              </p>
            </div>
          </div>
        )}
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
            {SHOW_ARTISTS && TOP_ARTISTS.length > 0 && (
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
                          className="w-full h-full object-cover"
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
                  <Cover
                    key={`${listen.artist}-${listen.album}-${i}`}
                    listen={listen}
                    like={likes[albumKey(listen)]}
                    onLike={BOARD_API ? toggleLike : undefined}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
