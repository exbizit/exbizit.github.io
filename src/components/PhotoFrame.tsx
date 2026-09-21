/**
 * Band photography, framed so it belongs to the page rather than sitting in a box.
 *
 * No colour is ever applied to a photo — no tint, no accent blend. The only
 * treatment is optional monochrome plus an edge mask that dissolves the
 * rectangle into the black.
 *
 * ── Want photos in full colour in the grid? ──────────────────────────────────
 * Set MONOCHROME to false below. That's the only change needed; the lightbox
 * already shows every photo in full colour regardless of this setting.
 */

/** Grid/hero treatment. false = photos keep their original colour everywhere. */
const MONOCHROME = true

type Treatment = 'dissolve' | 'edge-fade' | 'plain'

interface PhotoFrameProps {
  src: string
  alt: string
  /** dissolve = radial vignette to black · edge-fade = fades downward · plain = full rectangle */
  treatment?: Treatment
  aspect?: string
  className?: string
  /** Overrides MONOCHROME for this one image — the lightbox passes false */
  monochrome?: boolean
  /** Renders behind content: out of the a11y tree, no pointer events */
  decorative?: boolean
}

const MASK: Record<Treatment, string | undefined> = {
  dissolve: 'radial-gradient(ellipse 78% 78% at 50% 45%, #000 42%, transparent 100%)',
  'edge-fade': 'linear-gradient(to bottom, #000 30%, transparent 100%)',
  plain: undefined,
}

export default function PhotoFrame({
  src,
  alt,
  treatment = 'dissolve',
  aspect = '4/3',
  className = '',
  monochrome = MONOCHROME,
  decorative = false,
}: PhotoFrameProps) {
  const mask = MASK[treatment]

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio: aspect, pointerEvents: decorative ? 'none' : undefined }}
      aria-hidden={decorative || undefined}
    >
      <img
        src={src}
        alt={decorative ? '' : alt}
        loading="lazy"
        className="w-full h-full object-cover"
        style={{
          filter: monochrome ? 'grayscale(1) contrast(1.15)' : undefined,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />
    </div>
  )
}
