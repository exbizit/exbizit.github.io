import { Link } from 'react-router-dom'
import { type Show, formatShowDate } from '../data/shows'
import { getBandBySlug } from '../data/bands'

/**
 * The band's next show as a small alert card, with a link to tickets and a
 * count of any further dates. Sits to the left of the release covers.
 */
export default function NextShowAlert({
  shows,
  bandSlug,
  accentColor,
  className = '',
}: {
  shows: Show[]
  bandSlug: string
  accentColor: string
  className?: string
}) {
  const next = shows[0]
  if (!next) return null
  const { day, month, weekday, time } = formatShowDate(next.date)
  const others = [
    ...next.lineup.filter(s => s !== bandSlug).map(s => getBandBySlug(s)?.name ?? s),
    ...(next.alsoPlaying ?? []),
  ]
  const more = shows.length - 1
  const off = next.status === 'soldout' || next.status === 'cancelled'

  return (
    <aside
      aria-label="Next show"
      className={className}
      style={{
        width: 'min(300px, 100%)',
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(6px)',
        border: '1px solid var(--iron)',
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      <div className="p-3">
        <p className="label flex items-center gap-2" style={{ color: accentColor }}>
          <span className="relative flex" style={{ width: 8, height: 8 }} aria-hidden>
            <span
              className="absolute inset-0 rounded-full animate-ping motion-reduce:animate-none"
              style={{ background: accentColor, opacity: 0.6 }}
            />
            <span className="relative rounded-full" style={{ width: 8, height: 8, background: accentColor }} />
          </span>
          Next show
        </p>

        <p className="mt-1.5 font-semibold" style={{ color: 'var(--bone)', fontSize: '1.05rem' }}>
          {weekday} {day} {month}
          <span style={{ color: 'var(--ash)', fontWeight: 400 }}> · {time}</span>
        </p>
        <p style={{ color: 'var(--bone)', fontSize: '0.9rem' }}>
          {next.venue}
          <span style={{ color: 'var(--ash)' }}>, {next.city}</span>
        </p>
        {others.length > 0 && (
          <p className="mt-0.5" style={{ color: 'var(--ash)', fontSize: '0.8rem' }}>
            w/ {others.join(', ')}
          </p>
        )}

        <div className="mt-2.5 flex items-center gap-4">
          {next.status === 'soldout' || next.status === 'cancelled' ? (
            <span className="label" style={{ color: 'var(--dust)' }}>
              {next.status === 'soldout' ? 'Sold out' : 'Cancelled'}
            </span>
          ) : next.ticketUrl ? (
            <a
              href={next.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="label px-2.5 py-1 transition-opacity hover:opacity-80"
              style={{ background: accentColor, color: '#000' }}
            >
              Tickets
            </a>
          ) : null}
          <Link
            to="/shows"
            className="label transition-colors hover:text-white"
            style={{ color: off ? accentColor : 'var(--ash)' }}
          >
            {more > 0 ? `+${more} more ${more === 1 ? 'date' : 'dates'}` : 'All shows'}
          </Link>
        </div>
      </div>
    </aside>
  )
}
