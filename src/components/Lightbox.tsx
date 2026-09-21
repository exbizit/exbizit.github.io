import { useCallback, useEffect, useRef } from 'react'
import type { Photo } from '../data/bands'

/**
 * Full-size photo viewer.
 *
 * Photos appear here in FULL COLOUR and unmasked — the grid treatment is styling,
 * but if someone clicks to enlarge a photo they want to see the actual photograph.
 * Press photos also get reused by journalists, so the real image matters.
 *
 * Keyboard: Esc closes · ← → move between photos.
 */

interface LightboxProps {
  photos: Photo[]
  /** null = closed */
  index: number | null
  onClose: () => void
  onNavigate: (index: number) => void
  label?: string
}

export default function Lightbox({ photos, index, onClose, onNavigate, label }: LightboxProps) {
  const open = index !== null && index >= 0 && index < photos.length
  const closeRef = useRef<HTMLButtonElement>(null)
  // Remember what was focused so focus can go back there on close
  const restoreRef = useRef<Element | null>(null)

  const go = useCallback(
    (delta: number) => {
      if (index === null) return
      onNavigate((index + delta + photos.length) % photos.length)
    },
    [index, photos.length, onNavigate]
  )

  // Key handling
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(1) }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, go])

  // Lock background scroll, move focus in, restore it on close
  useEffect(() => {
    if (!open) return
    restoreRef.current = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
      if (restoreRef.current instanceof HTMLElement) restoreRef.current.focus()
    }
  }, [open])

  if (!open) return null
  const photo = photos[index!]
  const many = photos.length > 1

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label ? `${label} photos` : 'Photo viewer'}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.94)', padding: 'clamp(1rem, 4vw, 3rem)' }}
    >
      {/* Close */}
      <button
        ref={closeRef}
        onClick={onClose}
        aria-label="Close photo viewer"
        className="absolute transition-opacity hover:opacity-60"
        style={{ top: '1.25rem', right: '1.25rem', color: 'var(--bone)', lineHeight: 1 }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
          <path d="M3 3 L19 19 M19 3 L3 19" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>

      {many && (
        <>
          <button
            onClick={e => { e.stopPropagation(); go(-1) }}
            aria-label="Previous photo"
            className="absolute transition-opacity hover:opacity-60"
            style={{ left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--bone)' }}
          >
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
              <path d="M16 4 L7 13 L16 22" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>
          <button
            onClick={e => { e.stopPropagation(); go(1) }}
            aria-label="Next photo"
            className="absolute transition-opacity hover:opacity-60"
            style={{ right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--bone)' }}
          >
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
              <path d="M10 4 L19 13 L10 22" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>
        </>
      )}

      {/* The photo: full colour, unmasked, untinted */}
      <img
        src={photo.src}
        alt={photo.caption ?? label ?? 'Band photo'}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '100%',
          maxHeight: many ? '78vh' : '82vh',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
        }}
      />

      {/* Caption / credit / counter */}
      <div
        className="mt-5 text-center"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '60ch' }}
      >
        {photo.caption && (
          <p style={{ color: 'var(--bone)', fontSize: '0.95rem' }}>{photo.caption}</p>
        )}
        {photo.credit && (
          <p className="label mt-1">Art by {photo.credit}</p>
        )}
        {many && (
          <p className="label mt-2" style={{ color: 'var(--dust)' }}>
            {index! + 1} / {photos.length}
            <span className="hidden sm:inline"> · arrow keys to move · esc to close</span>
          </p>
        )}
      </div>
    </div>
  )
}
