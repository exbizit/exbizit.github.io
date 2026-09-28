import { Link } from 'react-router-dom'
import { getUpcomingShows, getPastShows, formatShowDate, type Show } from '../data/shows'
import { getBandBySlug, bandPath } from '../data/bands'
import PastShowWall from '../components/PastShowWall'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import SysFile from './SysFile'
import { Section, pad } from './BandFile'

const STATUS: Record<string, string> = { soldout: 'SOLD OUT', free: 'FREE', cancelled: 'CANCELLED' }

/** The Shows page as the desktop shows it: a schedule, then the flyer wall. */
export default function ShowsFile() {
  useDocumentTitle('Shows')
  const upcoming = getUpcomingShows()
  const past = getPastShows()

  return (
    <SysFile no={1} file="SHOWS.CAL" meta={`${pad(upcoming.length)} UPCOMING · ${pad(past.length)} PAST`}>
      <header className="sf-hero">
        <p className="sf-kicker">LIVE</p>
        <h1 className="sf-title">SHOWS</h1>
      </header>

      <Section n={1} title="Upcoming" meta={pad(upcoming.length)} className="bf-full">
        {upcoming.length === 0 ? (
          <p className="sf-empty">No dates announced.</p>
        ) : (
          <ol className="sf-list">
            {upcoming.map(s => (
              <ShowRow key={s.id} show={s} />
            ))}
          </ol>
        )}
      </Section>

      {past.length > 0 && (
        <Section n={2} title="Past" meta={pad(past.length)} className="bf-full">
          <PastShowWall shows={past} />
        </Section>
      )}
    </SysFile>
  )
}

function ShowRow({ show }: { show: Show }) {
  const { day, month, weekday, time } = formatShowDate(show.date)
  const roster = show.lineup.map(getBandBySlug).filter((b): b is NonNullable<typeof b> => Boolean(b))
  const accent = roster[0]?.accentColor ?? 'hsl(var(--sys-h) calc(var(--sys-sat) * 100%) 78%)'
  const off = show.status === 'soldout' || show.status === 'cancelled'
  return (
    <li className={`sf-row${off ? ' is-off' : ''}`} style={{ ['--row-accent' as string]: accent }}>
      <div className="sf-date">
        <span className="sf-day">{day}</span>
        <span className="sf-mon">
          {month}
          <br />
          {weekday}
        </span>
      </div>
      <div className="sf-bill">
        <p className="sf-bands">
          {roster.map((b, i) => (
            <span key={b.slug}>
              {i > 0 && ' + '}
              <Link to={bandPath(b.slug)} style={{ color: b.accentColor }}>
                {b.name}
              </Link>
            </span>
          ))}
        </p>
        {show.alsoPlaying && show.alsoPlaying.length > 0 && <p className="bf-dim">w/ {show.alsoPlaying.join(', ')}</p>}
        {show.note && <p className="bf-dim">{show.note}</p>}
      </div>
      <div className="sf-where">
        <p className="sf-venue">{show.venue}</p>
        <p className="bf-dim">
          {show.city} · {time}
        </p>
      </div>
      <div className="sf-act">
        {show.status && STATUS[show.status] && <span className="sf-status">{STATUS[show.status]}</span>}
        {show.ticketUrl && !off && (
          <a className="bf-show-tix" href={show.ticketUrl} target="_blank" rel="noopener noreferrer">
            Tickets ↗
          </a>
        )}
      </div>
    </li>
  )
}
