import type { SocialLink } from '../data/bands'

const PLATFORM_LABELS: Record<string, string> = {
  bandcamp:   'Bandcamp',
  spotify:    'Spotify',
  applemusic: 'Apple Music',
  youtube:    'YouTube',
  instagram:  'Instagram',
  twitter:    'Twitter / X',
  tiktok:     'TikTok',
  soundcloud: 'SoundCloud',
  website:    'Website',
}

interface SocialLinksProps {
  socials: SocialLink[]
  accentColor: string
}

export default function SocialLinks({ socials, accentColor }: SocialLinksProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {socials.map((social, i) => (
        <a
          key={i}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          className="label px-3 py-2 transition-all"
          style={{
            background: 'var(--void)',
            border: '1px solid var(--iron)',
            color: 'var(--bone)',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.borderColor = accentColor
            el.style.color = accentColor
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.borderColor = 'var(--iron)'
            el.style.color = 'var(--bone)'
          }}
        >
          {social.label ?? PLATFORM_LABELS[social.platform] ?? social.platform} ↗
        </a>
      ))}
    </div>
  )
}
