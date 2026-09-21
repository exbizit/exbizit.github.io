interface SpotifyEmbedProps {
  artistId: string
  artistName: string
}

export default function SpotifyEmbed({ artistId, artistName }: SpotifyEmbedProps) {
  return (
    <div style={{ border: '1px solid var(--iron)' }}>
      <iframe
        src={`https://open.spotify.com/embed/artist/${artistId}?utm_source=generator&theme=0`}
        width="100%"
        height="352"
        allowFullScreen
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        style={{ border: 'none', display: 'block' }}
        title={`${artistName} on Spotify`}
      />
    </div>
  )
}
