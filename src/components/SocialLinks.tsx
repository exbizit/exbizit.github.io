import type { SocialLink } from '../data/bands'

// Brand marks are Simple Icons' official SVGs (CC0), not hand-drawn. They're
// loaded from jsDelivr rather than installed from npm, so the site has no build
// dependency on the package. Pinned to a version whose files were verified to
// exist. Each SVG is used as a CSS mask over `currentColor`, so the icon follows
// the button's hover colour exactly like the label does. If the CDN is ever
// unreachable, a failed mask paints nothing: the icon disappears, nothing errors.
const SIMPLE_ICONS = 'https://cdn.jsdelivr.net/npm/simple-icons@16.32.0/icons'

const ICON_SLUGS: Partial<Record<SocialLink['platform'], string>> = {
  bandcamp: 'bandcamp',
  spotify: 'spotify',
  applemusic: 'applemusic',
  instagram: 'instagram',
  youtube: 'youtube',
}

function BrandIcon({ slug }: { slug: string }) {
  const url = `url(${SIMPLE_ICONS}/${slug}.svg)`
  return (
    <span
      aria-hidden="true"
      className="shrink-0 inline-block"
      style={{
        width: 14,
        height: 14,
        backgroundColor: 'currentColor',
        WebkitMaskImage: url,
        maskImage: url,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }}
    />
  )
}

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
      {socials.map((social, i) => {
        const slug = ICON_SLUGS[social.platform]
        return (
          <a
            key={i}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="label px-3 py-2 transition-all inline-flex items-center gap-2"
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
            {slug && <BrandIcon slug={slug} />}
            <span>{social.label ?? PLATFORM_LABELS[social.platform] ?? social.platform}</span>
            <span aria-hidden="true" style={{ opacity: 0.5 }}>↗</span>
          </a>
        )
      })}
    </div>
  )
}
