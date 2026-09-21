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
  /** CSS object-position — which part of the photo to keep when it's cropped */
  objectPosition?: string
  /** Renders behind content: out of the a11y tree, no pointer events */
  decorative?: boolean
}

/**
 * The dissolve fades outward from an anchor point. By default that sits just
 * above centre; a photo pinned to the bottom needs the anchor at the bottom
 * too, or its pinned edge would fade away.
 */
function maskFor(t: Treatment, objectPosition?: string): string | undefined {
  if (t === 'edge-fade') return 'linear-gradient(to bottom, #000 30%, transparent 100%)'
  if (t === 'plain') return undefined
  const y = /bottom/.test(objectPosition ?? '') ? '100%' : /top/.test(objectPosition ?? '') ? '0%' : '45%'
  return `radial-gradient(ellipse 78% 78% at 50% ${y}, #000 42%, transparent 100%)`
}

export default function PhotoFrame({
  src,
  alt,
  treatment = 'dissolve',
  aspect = '4/3',
  className = '',
  monochrome = MONOCHROME,
  decorative = false,
  objectPosition,
}: PhotoFrameProps) {
  const mask = maskFor(treatment, objectPosition)

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
          objectPosition,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />
    </div>
  )
}
