interface BandcampPlayerProps {
  albumUrl: string
  embedAlbumId?: string
  bandName: string
  accentColor: string
}

export default function BandcampPlayer({ albumUrl, embedAlbumId, bandName, accentColor }: BandcampPlayerProps) {
  if (embedAlbumId) {
    const linkColor = accentColor.replace('#', '')
    return (
      // No outline: Bandcamp's player stops growing at ~700px, so a border drawn
      // around a full-width frame ran on past the player around empty space.
      // Background matches the page's true black, not an off-black.
      <iframe
        style={{ border: 0, width: '100%', maxWidth: '700px', height: '274px', display: 'block' }}
        src={`https://bandcamp.com/EmbeddedPlayer/album=${embedAlbumId}/size=large/bgcol=000000/linkcol=${linkColor}/tracklist=true/artwork=small/transparent=true/`}
        seamless
        title={`${bandName} on Bandcamp`}
      />
    )
  }

  return (
    <a
      href={albumUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 font-mono text-sm transition-opacity hover:opacity-70 p-4"
      style={{ background: 'var(--void)', border: `1px solid ${accentColor}66`, color: accentColor }}
    >
      {/* Bandcamp logo */}
      <svg viewBox="0 0 24 24" width="18" height="18" fill={accentColor}>
        <path d="M0 18.75l7.437-12.5H24l-7.438 12.5z" />
      </svg>
      <span>Listen on Bandcamp →</span>
    </a>
  )
}
