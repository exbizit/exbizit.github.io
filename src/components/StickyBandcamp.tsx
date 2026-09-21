import { useState } from 'react'

/**
 * Bandcamp's slim player, pinned to the bottom of the window so music keeps
 * playing (and stays in view) while the page scrolls. The × hides it for the
 * rest of the visit to this page; it comes back on the next band page.
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
  const [open, setOpen] = useState(true)
  if (!open) return null
  const linkColor = accentColor.replace('#', '')

  return (
    <>
      {/* Spacer so the bar never covers the end of the page */}
      <div aria-hidden="true" style={{ height: '64px' }} />
      <div
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'rgba(0,0,0,0.92)',
          backdropFilter: 'blur(6px)',
          borderTop: '1px solid var(--iron)',
        }}
      >
        <div className="max-w-screen-2xl mx-auto px-5 md:px-8 py-2 flex items-center gap-3">
          <iframe
            style={{ border: 0, width: '100%', maxWidth: '700px', height: '42px', display: 'block' }}
            src={`https://bandcamp.com/EmbeddedPlayer/album=${embedAlbumId}/size=small/bgcol=000000/linkcol=${linkColor}/artwork=small/transparent=true/`}
            seamless
            title={`${bandName} on Bandcamp`}
          >
            <a href={albumUrl}>{bandName} on Bandcamp</a>
          </iframe>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Hide player"
            className="ml-auto shrink-0 px-2 leading-none transition-colors hover:text-white"
            style={{ color: 'var(--ash)', fontSize: '1.25rem' }}
          >
            ×
          </button>
        </div>
      </div>
    </>
  )
}
