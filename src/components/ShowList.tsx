import { Link } from 'react-router-dom'
import { type Show, formatShowDate } from '../data/shows'
import { getBandBySlug, bandPath } from '../data/bands'

interface ShowListProps {
  shows: Show[]
  /** When rendering inside a band's EPK, omit that band from the displayed lineup */
  omitBandSlug?: string
  /** Fallback accent when a row has no roster band to colour it */
  accentColor?: string
}

const STATUS_LABEL: Record<string, string> = {
  soldout:   'SOLD OUT',
  free:      'FREE',
  cancelled: 'CANCELLED',
}

export default function ShowList({ shows, omitBandSlug, accentColor = 'var(--bone)' }: ShowListProps) {
  if (shows.length === 0) {
    return (
      <p className="font-mono text-sm" style={{ color: 'var(--dust)' }}>
        No dates announced.
      </p>
    )
  }

  return (
    <div style={{ borderTop: '1px solid var(--iron)' }}>
      {shows.map(show => {
        const { day, month, weekday, time } = formatShowDate(show.date)
        const rosterBands = show.lineup
          .filter(slug => slug !== omitBandSlug)
          .map(getBandBySlug)
          .filter((b): b is NonNullable<typeof b> => Boolean(b))
        const rowAccent = getBandBySlug(show.lineup[0])?.accentColor ?? accentColor
        const isOff = show.status === 'soldout' || show.status === 'cancelled'

        return (
          <div
            key={show.id}
            className="flex flex-col sm:flex-row sm:items-center gap-4 py-5"
            style={{ borderBottom: '1px solid var(--iron)', opacity: isOff ? 0.55 : 1 }}
          >
            {/* Date block */}
            <div className="flex items-baseline gap-2 sm:w-28 shrink-0">
              <span
                className="display leading-none"
                style={{ fontSize: '2rem', color: rowAccent, letterSpacing: '-0.03em' }}
              >
                {day}
              </span>
              <div className="font-mono text-xs leading-tight" style={{ color: 'var(--ash)' }}>
                <div>{month}</div>
                <div style={{ color: 'var(--dust)' }}>{weekday}</div>
              </div>
            </div>

            {/* Venue + lineup */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base" style={{ color: 'var(--bone)' }}>
                {show.venue}
              </p>
              <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--ash)' }}>
                {show.city} · {time}
              </p>

              {(rosterBands.length > 0 || show.alsoPlaying?.length) && (
                <p className="font-mono text-xs mt-1.5" style={{ color: 'var(--dust)' }}>
                  w/{' '}
                  {rosterBands.map((b, i) => (
                    <span key={b.slug}>
                      {i > 0 && ', '}
                      <Link
                        to={bandPath(b.slug)}
                        className="hover:underline"
                        style={{ color: b.accentColor }}
                      >
                        {b.name}
                      </Link>
                    </span>
                  ))}
                  {show.alsoPlaying?.length ? (
                    <span>
                      {rosterBands.length > 0 && ', '}
                      {show.alsoPlaying.join(', ')}
                    </span>
                  ) : null}
                </p>
              )}

              {show.note && (
                <p className="font-mono text-xs mt-1" style={{ color: 'var(--dust)' }}>
                  {show.note}
                </p>
              )}
            </div>

            {/* Ticket action */}
            <div className="shrink-0">
              {show.status && STATUS_LABEL[show.status] ? (
                <span
                  className="font-mono text-xs px-3 py-2 inline-block"
                  style={{ border: '1px solid var(--iron)', color: 'var(--ash)' }}
                >
                  {STATUS_LABEL[show.status]}
                </span>
              ) : show.ticketUrl ? (
                <a
                  href={show.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs font-bold px-4 py-2 inline-block transition-opacity hover:opacity-80"
                  style={{ background: rowAccent, color: 'var(--void)' }}
                >
                  TICKETS →
                </a>
              ) : (
                <span className="label" style={{ color: 'var(--dust)' }}>
                  at the door
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
