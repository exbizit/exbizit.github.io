import ShowList from '../components/ShowList'
import PastShowWall from '../components/PastShowWall'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { getUpcomingShows, getPastShows } from '../data/shows'

export default function Shows() {
  useDocumentTitle('Shows')
  const upcoming = getUpcomingShows()
  const past = getPastShows()

  return (
    <div style={{ paddingTop: 'var(--nav-h, 56px)' }}>
      <section className="px-6 py-20" style={{ borderBottom: '1px solid var(--iron)' }}>
        <div className="max-w-7xl mx-auto">
          <p className="label mb-6">Live</p>
          <h1
            className="display leading-none"
            style={{ fontSize: 'clamp(2rem, 7vw, 6rem)', color: 'var(--bone)', letterSpacing: '-0.04em' }}
          >
            SHOWS
          </h1>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-14">
        <section>
          <p className="label mb-4">
            Upcoming{upcoming.length > 0 && ` (${upcoming.length})`}
          </p>
          <ShowList shows={upcoming} />
        </section>

      </div>

      {past.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <p className="label mb-4">
            Past ({past.length})
          </p>
          <PastShowWall shows={past} />
        </section>
      )}
    </div>
  )
}
