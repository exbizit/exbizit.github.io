/**
 * Cybersigil — tapered thorns radiating from a vascular core.
 *
 * SVG strokes can't taper, so each thorn is a FILLED path shaped like a needle:
 * wide at the root, curving out to a point. That's what gives the style its
 * sharpness. Thin stroked rings supply the "circuitry" half of the look.
 *
 * Motion is one orchestrated draw-on at mount, then a very slow drift. Both are
 * disabled under prefers-reduced-motion (see index.css).
 */

interface SigilProps {
  /**
   * Rendered px. The viewBox is 200x200 and thorn bases are ~2.4 units wide, so
   * anything under about 120px renders the thorns at sub-pixel width and the
   * whole mark disappears. Don't use this as a small icon — it needs a
   * purpose-drawn glyph at that scale.
   */
  size?: number
  /** Thorn count — 8–16 reads best; higher gets noisy */
  points?: number
  color?: string
  opacity?: number
  drift?: boolean
  reverse?: boolean
  className?: string
  style?: React.CSSProperties
}

// Needle: wide at root (y=100, centre), tapering to a point at the top.
const THORN_LONG  = 'M 99.1 100 C 107 71, 111.5 46, 100 14 C 104.5 46, 101.2 73, 96.7 100 Z'
const THORN_SHORT = 'M 99.4 100 C 104.2 81, 106.5 66, 100 49 C 102.6 66, 100.7 83, 97.5 100 Z'
// Barb branching off a long thorn — the "vascular" detail
const BARB        = 'M 101.5 62 C 109 56, 114 51.5, 119 44 C 112.5 52, 107 58.5, 101.9 64.5 Z'

export default function Sigil({
  size = 420,
  points = 12,
  color = '#FFFFFF',
  opacity = 1,
  drift = true,
  reverse = false,
  className = '',
  style,
}: SigilProps) {
  const angles = Array.from({ length: points }, (_, i) => (360 / points) * i)
  const driftClass = drift ? (reverse ? 'sigil-drift-reverse' : 'sigil-drift') : ''

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ opacity, ...style }}
    >
      <g className={driftClass} style={{ transformOrigin: '100px 100px' }}>
        {/* Thorns — long and short alternating for rhythm */}
        {angles.map((angle, i) => {
          const long = i % 2 === 0
          return (
            <g
              key={angle}
              transform={`rotate(${angle} 100 100)`}
              className="sigil-thorn"
              style={{ animationDelay: `${i * 55}ms` }}
            >
              <path d={long ? THORN_LONG : THORN_SHORT} fill={color} />
              {long && <path d={BARB} fill={color} opacity={0.55} />}
            </g>
          )
        })}

        {/* Circuitry rings — stroked, drawn on */}
        <circle
          cx="100" cy="100" r="34"
          stroke={color} strokeWidth="0.4" opacity="0.5"
          className="sigil-stroke"
          style={{ ['--dash' as string]: 214, animationDelay: '200ms' }}
        />
        <circle
          cx="100" cy="100" r="47"
          stroke={color} strokeWidth="0.25" opacity="0.32"
          className="sigil-stroke"
          style={{ ['--dash' as string]: 295, animationDelay: '420ms' }}
        />

        {/* Core */}
        <circle cx="100" cy="100" r="2.2" fill={color} opacity="0.85" />
      </g>
    </svg>
  )
}
