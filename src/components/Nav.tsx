import { Link, useLocation } from 'react-router-dom'
import { BANDS, bandPath } from '../data/bands'

export default function Nav() {
  const { pathname } = useLocation()

  return (
    <nav
      style={{ borderBottom: '1px solid var(--iron)', background: 'rgba(0,0,0,0.92)' }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        <div className="flex items-center gap-0 overflow-x-auto">
          {BANDS.map(band => {
            const to = bandPath(band.slug)
            const active = pathname === to
            return (
              <Link
                key={band.slug}
                to={to}
                className="label px-3 py-5 whitespace-nowrap transition-colors"
                style={{
                  color: active ? band.accentColor : 'var(--ash)',
                  borderBottom: active ? `2px solid ${band.accentColor}` : '2px solid transparent',
                }}
              >
                {band.name}
              </Link>
            )
          })}
          {/* Utility pages, set apart from the band list */}
          <span
            className="mx-2 shrink-0"
            style={{ width: '1px', height: '14px', background: 'var(--iron)' }}
            aria-hidden
          />
          {[
            { to: '/shows', label: 'SHOWS' },
            { to: '/listening', label: 'LISTENING' },
            { to: '/contact', label: 'BOOKING' },
          ].map(item => (
            <Link
              key={item.to}
              to={item.to}
              className="label px-3 py-5 whitespace-nowrap transition-colors"
              style={{
                color: pathname === item.to ? 'var(--bone)' : 'var(--ash)',
                borderBottom: pathname === item.to ? '2px solid var(--bone)' : '2px solid transparent',
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
