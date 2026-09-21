import { useState } from 'react'
import { BrandIcon } from './SocialLinks'

/**
 * A floating Bandcamp button in the bottom-right corner. Tapping it opens the
 * full player above it; tapping again tucks the player away.
 *
 * The player loads on first open and then stays mounted while collapsed, only
 * hidden, so the music keeps playing as you scroll and close the panel.
 */
export default function StickyBandcamp({
  embedAlbumId,
  albumUrl,
  bandName,
  accentColor,
}: {
  embedAlbumId: string
  albumUrl: string
  bandName: string
  accentColor: string
}) {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const linkColor = accentColor.replace('#', '')

  const toggle = () => {
    setLoaded(true)
    setOpen(o => !o)
  }

  return (
    <div className="fixed z-40 flex flex-col items-end gap-3" style={{ right: 16, bottom: 16 }}>
      {loaded && (
        <div
          id="bandcamp-panel"
          className="transition-all duration-200 origin-bottom-right"
          style={{
            width: 'min(350px, calc(100vw - 32px))',
            background: '#000',
            border: '1px solid var(--iron)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            opacity: open ? 1 : 0,
            transform: open ? 'none' : 'translateY(8px) scale(0.98)',
            visibility: open ? 'visible' : 'hidden',
            // Collapsed: out of the way but still mounted, so audio carries on
            pointerEvents: open ? 'auto' : 'none',
          }}
        >
          <iframe
            style={{ border: 0, width: '100%', height: '340px', display: 'block' }}
            src={`https://bandcamp.com/EmbeddedPlayer/album=${embedAlbumId}/size=large/bgcol=000000/linkcol=${linkColor}/tracklist=true/artwork=small/transparent=true/`}
            seamless
            title={`${bandName} on Bandcamp`}
          >
            <a href={albumUrl}>{bandName} on Bandcamp</a>
          </iframe>
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="bandcamp-panel"
        aria-label={open ? 'Hide Bandcamp player' : `Play ${bandName} on Bandcamp`}
        title={open ? 'Hide player' : 'Listen on Bandcamp'}
        className="flex items-center justify-center rounded-full transition-transform duration-200 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{
          width: 56,
          height: 56,
          background: accentColor,
          color: '#000',
          boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
          outlineColor: accentColor,
        }}
      >
        {open ? (
          <span aria-hidden="true" style={{ fontSize: '1.6rem', lineHeight: 1 }}>×</span>
        ) : (
          <BrandIcon slug="bandcamp" size={24} />
        )}
      </button>
    </div>
  )
}
