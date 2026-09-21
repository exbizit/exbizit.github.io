import { Link } from 'react-router-dom'
import { BANDS, bandPath } from '../data/bands'
import { SITE_NAME } from '../hooks/useDocumentTitle'

/**
 * The other projects, at the foot of every band page.
 *
 * With no landing page, this is the only way a visitor discovers the rest of the
 * roster — a press contact who arrives on one band's EPK from a link would
 * otherwise never learn the other four exist.
 */
export default function RosterStrip({ currentSlug }: { currentSlug: string }) {
  const others = BANDS.filter(b => b.slug !== currentSlug)
  if (others.length === 0) return null

  return (
    <section
      className="max-w-7xl mx-auto px-4 py-14"
      style={{ borderTop: '1px solid var(--iron)' }}
    >
      <p className="label mb-8">Also in {SITE_NAME}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: 'var(--iron)' }}>
        {others.map(band => (
          <Link
            key={band.slug}
            to={bandPath(band.slug)}
            className="group relative px-5 py-7 overflow-hidden transition-colors"
            style={{ background: 'var(--void)' }}
          >
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: `linear-gradient(135deg, ${band.accentColor}16 0%, transparent 70%)` }}
            />
            <span
              className="relative block mb-1.5"
              style={{ width: '28px', height: '2px', background: band.accentColor }}
            />
            <h3
              className="relative font-semibold leading-tight"
              style={{ fontSize: '1.05rem', color: 'var(--bone)' }}
            >
              {band.name}
            </h3>
            <p className="relative label mt-1" style={{ color: 'var(--dust)' }}>
              {band.genre.filter(g => !g.startsWith('//'))[0] ?? 'EPK'}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
