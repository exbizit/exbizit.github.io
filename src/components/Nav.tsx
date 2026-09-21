import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BANDS, bandPath, type Band } from '../data/bands'
import { useNavFonts } from '../hooks/useNavFonts'

/**
 * A wordmark drawn as a colour mask rather than an image. The PNG's shape cuts
 * out a block of `currentColor`, so the artwork recolours exactly like text:
 * grey at rest, white on hover, the band's accent on its own page.
 *
 * The invisible <img> underneath only exists to give the box the artwork's
 * true proportions, so no aspect ratios need hard-coding.
 */
function MaskedWordmark({ band }: { band: Band }) {
  // Scales down with the window, but never below 20px tall (it used to shrink
  // to nothing when the nav ran out of room).
  const h = `clamp(20px, 3.4vw, ${band.fonts?.navSize ?? '26px'})`
  const src = band.wordmark!
  const mask = {
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'left center',
    maskPosition: 'left center',
  } as React.CSSProperties

  return (
    <span className="relative inline-block" style={{ height: h }}>
      <img src={src} alt="" aria-hidden style={{ height: h, width: 'auto', opacity: 0, display: 'block' }} />
      <span
        aria-hidden
        className="absolute inset-0 transition-colors duration-300"
        style={{ backgroundColor: 'currentColor', ...mask }}
      />
    </span>
  )
}

export default function Nav() {
  const { pathname } = useLocation()
  useNavFonts()

  // The utility links wrap to a second row on narrow windows, so the nav's
  // height varies. Publish it as --nav-h; pages pad their tops by it.
  const navRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = navRef.current
    if (!el) return
    const set = () =>
      document.documentElement.style.setProperty('--nav-h', `${el.offsetHeight}px`)
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <nav
      ref={navRef}
      style={{ borderBottom: '1px solid var(--iron)', background: 'rgba(0,0,0,0.92)' }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center">
        {/* Bands. Scrolls sideways only if the bands alone overflow the window. */}
        <div className="flex items-center overflow-x-auto min-w-0">
          {BANDS.map(band => {
            const to = bandPath(band.slug)
            const active = pathname === to
            return (
              <Link
                key={band.slug}
                to={to}
                aria-current={active ? 'page' : undefined}
                aria-label={band.wordmark ? band.name : undefined}
                className="nav-item h-14 px-3 flex items-center whitespace-nowrap shrink-0"
                style={{ ['--accent' as string]: band.accentColor }}
              >
                {band.wordmark ? (
                  <MaskedWordmark band={band} />
                ) : (
                  <span
                    style={{
                      fontFamily: band.fonts?.display,
                      fontWeight: band.fonts?.displayWeight ?? 700,
                      fontSize: band.fonts?.navSize ?? '1rem',
                      letterSpacing: '0.005em',
                      lineHeight: 1,
                    }}
                  >
                    {band.name}
                  </span>
                )}
              </Link>
            )
          })}

        </div>

        {/* Utility pages. When there isn't room beside the bands, this whole
            group wraps onto its own row rather than hiding off-screen. */}
        <div className="flex items-center">
          <span
            className="mx-2 shrink-0 hidden md:block"
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
              aria-current={pathname === item.to ? 'page' : undefined}
              className="nav-item label h-10 md:h-14 px-3 flex items-center whitespace-nowrap shrink-0"
              style={{ ['--accent' as string]: 'var(--bone)' }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
