// ─────────────────────────────────────────────────────────────────────────────
// UNROUTED. Hoster now serves as the root page (see App.tsx), so this landing
// page isn't reachable. Kept in case you want a roster page back — wire it to a
// route like /projects. Safe to delete.
// ─────────────────────────────────────────────────────────────────────────────
import { Link } from 'react-router-dom'
import { BANDS, bandPath } from '../data/bands'
import Sigil from '../components/Sigil'
import { useDocumentTitle, SITE_NAME } from '../hooks/useDocumentTitle'

export default function Home() {
  useDocumentTitle() // bare site name on the landing page

  return (
    <div style={{ paddingTop: '56px' }}>
      {/* ── Hero: the sigil is the hero, type sits inside it ──────────────── */}
      <section
        className="relative flex flex-col justify-center px-6 overflow-hidden"
        style={{ minHeight: '88vh', borderBottom: '1px solid var(--iron)' }}
      >
        {/* Sigil, centred behind the wordmark */}
        <div
          className="absolute left-1/2 top-1/2 pointer-events-none"
          style={{ transform: 'translate(-50%, -50%)' }}
        >
          <Sigil size={760} points={14} opacity={0.30} />
        </div>
        <div
          className="absolute left-1/2 top-1/2 pointer-events-none"
          style={{ transform: 'translate(-50%, -50%)' }}
        >
          <Sigil size={420} points={8} opacity={0.5} reverse />
        </div>

        <div className="relative max-w-7xl mx-auto w-full text-center">
          <h1
            className="display mb-8"
            style={{ fontSize: 'clamp(2.2rem, 8vw, 6.5rem)', color: 'var(--bone)' }}
          >
            {SITE_NAME.toUpperCase()}
          </h1>
          <p
            className="mx-auto"
            style={{ color: 'var(--ash)', maxWidth: '36ch', fontSize: '0.95rem', lineHeight: 1.8 }}
          >
            A collection of Orlando bands.
          </p>
        </div>
      </section>

      {/* ── Roster ───────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <p className="label mb-10">Projects</p>

        <div style={{ borderTop: '1px solid var(--iron)' }}>
          {BANDS.map((band, i) => (
            <Link
              key={band.slug}
              to={bandPath(band.slug)}
              className="group relative flex items-center justify-between px-2 sm:px-6 py-10 overflow-hidden"
              style={{ borderBottom: '1px solid var(--iron)' }}
            >
              {/* Splash of colour, only on hover — the one place colour enters */}
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `linear-gradient(90deg, ${band.accentColor}14 0%, transparent 55%)`,
                }}
              />

              <div className="relative flex items-center gap-5 sm:gap-8 min-w-0">
                <span
                  className="shrink-0 tabular-nums"
                  style={{ color: 'var(--iron)', fontSize: '0.7rem', letterSpacing: '0.1em' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <h2
                    className="display truncate transition-colors duration-300"
                    style={{ fontSize: 'clamp(1.6rem, 5vw, 3rem)', color: 'var(--bone)' }}
                  >
                    {band.name}
                  </h2>
                  <div className="flex flex-wrap gap-x-3 mt-1.5">
                    {band.genre
                      .filter(g => !g.startsWith('//'))
                      .map(g => (
                        <span
                          key={g}
                          className="label"
                          style={{ color: 'var(--dust)' }}
                        >
                          {g}
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              {/* Thorn marker, sharpens on hover */}
              <span
                className="relative shrink-0 ml-4 transition-all duration-300 opacity-40 group-hover:opacity-100"
                style={{ color: band.accentColor }}
              >
                <Sigil size={46} points={6} color="currentColor" drift={false} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-4 pb-16 flex items-center justify-between">
        <span className="label" style={{ color: 'var(--dust)' }}>Orlando, FL</span>
        <Link to="/contact" className="label transition-colors hover:text-white">
          Booking
        </Link>
      </footer>
    </div>
  )
}
