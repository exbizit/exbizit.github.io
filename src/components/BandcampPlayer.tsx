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
      <div style={{ border: '1px solid var(--iron)' }}>
        <iframe
          style={{ border: 0, width: '100%', height: '274px' }}
          src={`https://bandcamp.com/EmbeddedPlayer/album=${embedAlbumId}/size=large/bgcol=08080E/linkcol=${linkColor}/tracklist=true/artwork=small/transparent=true/`}
          seamless
          title={`${bandName} on Bandcamp`}
        />
      </div>
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
