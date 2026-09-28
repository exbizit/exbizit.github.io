import { useState } from 'react'
import { Link } from 'react-router-dom'
import { type PastShow } from '../data/shows'
import { getBandBySlug, bandPath } from '../data/bands'

/**
 * Past shows as a wall of flyers. Hovering (or focusing, or tapping on a
 * phone) a flyer turns it over to the details: date, who played, where, and
 * any links added to the archive afterwards (videos of the set, photos...).
 */
export default function PastShowWall({ shows }: { shows: PastShow[] }) {
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {shows.map(show => (
        <Flyer key={show.id} show={show} />
      ))}
    </ul>
  )
}

function Flyer({ show }: { show: PastShow }) {
  const [open, setOpen] = useState(false)
  const d = new Date(show.date)
  const dateLong = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  const stamp = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()
  const roster = show.lineup.map(getBandBySlug).filter((b): b is NonNullable<typeof b> => Boolean(b))
  const accent = roster[0]?.accentColor ?? 'var(--bone)'
  const links = show.links ?? []
  const detailsId = `past-${show.id}`

  return (
    <li className="group relative" style={{ ['--flyer-accent' as string]: accent }}>
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: '4 / 5', background: '#0b0b0b', border: '1px solid var(--iron)' }}
      >
        {show.poster ? (
          <img
            src={show.poster}
            alt={`Flyer: ${show.venue}, ${dateLong}`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <TypeFlyer show={show} stamp={stamp} />
        )}

        <span
          className="absolute top-2 left-2 px-1.5 py-0.5 tabular-nums"
          style={{ background: '#000', color: accent, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em' }}
        >
          {stamp}
        </span>

        {/* Tap target for touch screens and keyboards; hover does the same with a mouse */}
        <button
          type="button"
          className="absolute inset-0 w-full h-full cursor-pointer focus-visible:outline-none"
          aria-expanded={open}
          aria-controls={detailsId}
          aria-label={`${open ? 'Hide' : 'Show'} details: ${show.venue}, ${dateLong}`}
          onClick={() => setOpen(o => !o)}
        />

        <div
          id={detailsId}
          className={`past-flyer-details absolute inset-0 flex flex-col justify-end p-3 sm:p-4 transition-opacity duration-200 ${open ? 'is-open' : ''}`}
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.88) 60%, rgba(0,0,0,0.7) 100%)' }}
        >
          <p className="label" style={{ color: accent }}>
            {dateLong}
          </p>
          <p className="mt-1.5 leading-tight" style={{ color: 'var(--bone)', fontWeight: 600, fontSize: '0.95rem' }}>
            {roster.map((b, i) => (
              <span key={b.slug}>
                {i > 0 && ' + '}
                <Link
                  to={bandPath(b.slug)}
                  className="relative z-10 underline decoration-1 underline-offset-2 hover:text-white"
                  style={{ color: b.accentColor }}
                >
                  {b.name}
                </Link>
              </span>
            ))}
            {show.alsoPlaying && show.alsoPlaying.length > 0 && (
              <span style={{ color: 'var(--ash)', fontWeight: 400 }}>
                {roster.length > 0 ? ' w/ ' : ''}
                {show.alsoPlaying.join(', ')}
              </span>
            )}
          </p>
          <p className="mt-1.5 text-xs" style={{ color: 'var(--ash)' }}>
            {show.venue} · {show.city}
          </p>
          {show.note && (
            <p className="mt-1 text-xs" style={{ color: 'var(--dust)' }}>
              {show.note}
            </p>
          )}
          {links.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {links.map(l => (
                <a
                  key={l.url}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative z-10 label px-2 py-1 transition-colors hover:bg-white hover:text-black"
                  style={{ border: `1px solid ${accent}`, color: 'var(--bone)' }}
                >
                  {l.label} ↗
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Always visible, so the wall is scannable without hovering */}
      <p className="mt-2 text-xs truncate" style={{ color: 'var(--ash)' }}>
        <span style={{ color: 'var(--bone)' }}>{show.venue}</span> · {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </p>
    </li>
  )
}

/** Stand-in flyer for a show with no artwork: the bill set in type. */
function TypeFlyer({ show, stamp }: { show: PastShow; stamp: string }) {
  const names = [...show.lineup.map(s => getBandBySlug(s)?.name ?? s), ...(show.alsoPlaying ?? [])]
  return (
    <div
      className="absolute inset-0 flex flex-col justify-between p-4 pt-9"
      style={{ background: 'repeating-linear-gradient(-45deg, #0b0b0b 0 10px, #111 10px 20px)' }}
      aria-hidden
    >
      <div className="space-y-1">
        {names.slice(0, 5).map((n, i) => (
          <p
            key={n}
            className="display uppercase break-words"
            style={{
              fontSize: i === 0 ? 'clamp(1.2rem, 3.4vw, 2rem)' : 'clamp(0.8rem, 2vw, 1.1rem)',
              color: i === 0 ? 'var(--flyer-accent)' : 'var(--bone)',
            }}
          >
            {n}
          </p>
        ))}
      </div>
      <div>
        <p className="display uppercase" style={{ fontSize: 'clamp(1rem, 2.6vw, 1.5rem)', color: 'var(--bone)' }}>
          {show.venue}
        </p>
        <p className="label mt-1">{stamp}</p>
      </div>
    </div>
  )
}
