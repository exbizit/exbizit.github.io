import AudioFrame from './AudioFrame'

interface VideoEmbedProps {
  platform: 'youtube' | 'vimeo'
  videoId: string
  title: string
}

export default function VideoEmbed({ platform, videoId, title }: VideoEmbedProps) {
  const src =
    platform === 'youtube'
      ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&color=white&enablejsapi=1`
      : `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`

  return (
    <div style={{ background: 'var(--void)', border: '1px solid var(--iron)' }}>
      <div className="relative" style={{ paddingBottom: '56.25%' }}>
        <AudioFrame
          stopWith={platform === 'youtube' ? 'youtube' : 'reload'}
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
          style={{ border: 'none' }}
        />
      </div>
    </div>
  )
}
