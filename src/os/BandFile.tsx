/**
 * A band's EPK as the desktop layout shows it: the same information as
 * BandPage, laid out as a technobrutalist data file. A strict grid with its
 * rules showing, numbered sections, oversized type, tables for the facts.
 * Container queries (bandfile.css) fit it to the window, not the screen.
 */
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BANDS, getBandBySlug, type Band } from '../data/bands'
import { getShowsForBand, formatShowDate } from '../data/shows'
import { getReleases } from '../data/discography'
import AudioFrame from '../components/AudioFrame'
import VideoEmbed from '../components/VideoEmbed'
import Lightbox from '../components/Lightbox'
import { BrandIcon, PLATFORM_LABELS } from '../components/SocialLinks'
import { PLATFORMS } from '../components/ReleaseStrip'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useBandFonts } from '../hooks/useBandFonts'
import PlayInAmp from './PlayInAmp'
import './bandfile.css'

export const pad = (n: number) => String(n).padStart(2, '0')
const isTodo = (s: string) => s.startsWith('//')
// Simple Icons slugs; anything else (a plain website) gets a generic mark
const SOCIAL_ICONS: Record<string, string> = {
  bandcamp: 'bandcamp',
  spotify: 'spotify',
  applemusic: 'applemusic',
  instagram: 'instagram',
  youtube: 'youtube',
  twitter: 'x',
  tiktok: 'tiktok',
  soundcloud: 'soundcloud',
}

export function Section({ n, title, meta, className = '', children }: { n: number; title: string; meta?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`bf-cell ${className}`}>
      <header className="bf-sec-head">
        <span className="bf-sec-n">{pad(n)}</span>
        <h2 className="bf-sec-title">{title}</h2>
        <span className="bf-sec-rule" aria-hidden />
        {meta != null && <span className="bf-sec-meta">{meta}</span>}
      </header>
      {children}
    </section>
  )
}

function Table({ rows, accent }: { rows: { key: string; cells: ReactNode[] }[]; accent: string }) {
  return (
    <table className="bf-table">
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.key}>
            <td className="bf-table-n" style={{ color: accent }}>
              {pad(i + 1)}
            </td>
            {r.cells.map((c, j) => (
              <td key={j}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function BandFile({ slug }: { slug: string }) {
  const band = getBandBySlug(slug) as Band
  const [lightbox, setLightbox] = useState<number | null>(null)
  useDocumentTitle(band.name, false)
  useBandFonts(band.fonts)

  const accent = band.accentColor
  const f = band.fonts
  const fileNo = BANDS.findIndex(b => b.slug === band.slug) + 1
  const shows = getShowsForBand(band.slug)
  const next = shows[0]
  const releases = getReleases(band.slug)
  const genres = band.genre.filter(g => !isTodo(g))
  const heroSrc = band.heroImage ?? band.photos[0]?.src

  let n = 0
  const num = () => ++n

  return (
    <article
      className="bf"
      style={{
        ['--bf-accent' as string]: accent,
        ['--bf-display' as string]: f?.display ?? "'Chakra Petch', sans-serif",
        ['--bf-display-weight' as string]: String(f?.displayWeight ?? 700),
        ['--bf-display-tracking' as string]: f?.displayTracking ?? '-0.03em',
      }}
    >
      {/* ── File header ──────────────────────────────────────────────── */}
      <div className="bf-strip">
        <span className="bf-strip-tag">FILE {pad(fileNo)}/{pad(BANDS.length)}</span>
        <span>{band.slug.toUpperCase()}.EPK</span>
        <span className="bf-strip-fill" aria-hidden />
        <span>{genres.join(' / ').toUpperCase()}</span>
        <span className={`bf-status${band.isActive ? ' is-on' : ''}`}>{band.isActive ? 'ACTIVE' : 'DORMANT'}</span>
      </div>

      {/* ── Identity ─────────────────────────────────────────────────── */}
      <section className="bf-hero">
        <div className="bf-id">
          {band.logo && <img className="bf-logo" src={band.logo} alt="" aria-hidden />}
          <h1 className="bf-name">
            {band.wordmark ? <img className="bf-wordmark" src={band.wordmark} alt={band.name} /> : band.name}
          </h1>
          <div className="bf-accent-bar" aria-hidden />
          {band.tagline && <p className={`bf-tagline${isTodo(band.tagline) ? ' is-todo' : ''}`}>{band.tagline}</p>}
        </div>
        {heroSrc && (
          <figure className="bf-hero-img">
            <img src={heroSrc} alt="" style={{ objectPosition: band.heroPosition ?? 'center' }} />
            <figcaption>
              FIG.00 — {heroSrc.split('/').pop()?.toUpperCase()}
            </figcaption>
          </figure>
        )}
        <p className="bf-vert" aria-hidden>
          {band.name}
        </p>
      </section>

      {/* ── Playback / links / next show ─────────────────────────────── */}
      <div className="bf-grid bf-grid-2">
        <Section n={num()} title="Transmit" meta={`${band.socials.length} LINKS`}>
          <PlayInAmp slug={band.slug} />
          <ul className="bf-icons" aria-label="Links">
            {band.socials.map(s => {
              const label = s.label ?? PLATFORM_LABELS[s.platform] ?? s.platform
              const icon = SOCIAL_ICONS[s.platform]
              return (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
                    {icon ? <BrandIcon slug={icon} size={18} /> : <span aria-hidden>◆</span>}
                  </a>
                </li>
              )
            })}
          </ul>
        </Section>

        {next && (
          <Section n={num()} title="Next show" meta={shows.length > 1 ? `+${shows.length - 1} MORE` : undefined}>
            <NextShow show={next} bandSlug={band.slug} />
          </Section>
        )}
      </div>

      {releases.length > 0 && (
        <Section n={num()} title="Discography" meta={`${pad(releases.length)} RELEASES`} className="bf-full">
          <ol className="bf-disco">
            {releases.map((r, i) => {
              const links = PLATFORMS.filter(p => r[p.key])
              return (
                <li key={r.id} className="bf-disco-item">
                  <div className="bf-disco-cover">
                    <img src={r.cover ?? undefined} alt="" loading="lazy" />
                    <span className="bf-disco-n">R{pad(releases.length - i)}</span>
                  </div>
                  <p className="bf-disco-title">{r.title}</p>
                  <p className="bf-disco-meta">
                    {[r.type?.toUpperCase(), r.date?.slice(0, 4)].filter(Boolean).join(' · ')}
                  </p>
                  <div className="bf-disco-links">
                    {links.map(p => (
                      <a
                        key={p.key}
                        href={r[p.key] ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${r.title} on ${p.label}`}
                        title={p.label}
                      >
                        <BrandIcon slug={p.icon} size={14} />
                      </a>
                    ))}
                  </div>
                </li>
              )
            })}
          </ol>
        </Section>
      )}

      {/* ── Main column + side column ────────────────────────────────── */}
      <div className="bf-body">
        <div className="bf-main">
          {band.latestRelease && (
            <Section
              n={num()}
              title="Latest release"
              meta={[band.latestRelease.type, band.latestRelease.date].filter(Boolean).join(' · ').toUpperCase() || undefined}
            >
              <p className="bf-big">{band.latestRelease.title}</p>
              {band.latestRelease.spotifyAlbumId && (
                <AudioFrame
                  src={`https://open.spotify.com/embed/album/${band.latestRelease.spotifyAlbumId}?utm_source=generator&theme=0`}
                  title={`${band.latestRelease.title} by ${band.name} on Spotify`}
                  width="100%"
                  height="352"
                  loading="lazy"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  style={{ border: 0, borderRadius: '12px', display: 'block' }}
                />
              )}
            </Section>
          )}

          {band.press && band.press.length > 0 && (
            <Section n={num()} title="Press" meta={`${pad(band.press.length)} QUOTES`}>
              <div className="bf-press">
                {band.press.map((q, i) => (
                  <blockquote key={i}>
                    <p>{q.quote}</p>
                    <footer>
                      {q.url ? (
                        <a href={q.url} target="_blank" rel="noopener noreferrer">
                          {q.source}
                        </a>
                      ) : (
                        q.source
                      )}
                      {q.author && ` · ${q.author}`}
                      {q.date && ` · ${q.date}`}
                    </footer>
                  </blockquote>
                ))}
              </div>
            </Section>
          )}

          <Section n={num()} title="About">
            <p className={`bf-about${isTodo(band.description) ? ' is-todo' : ''}`}>{band.description}</p>
          </Section>

          {band.videos.length > 0 && (
            <Section n={num()} title="Video" meta={`${pad(band.videos.length)} CLIPS`}>
              <div className="bf-videos">
                {band.videos.map((v, i) => (
                  <figure key={i}>
                    <VideoEmbed {...v} />
                    {!isTodo(v.title) && <figcaption>VID.{pad(i + 1)} — {v.title}</figcaption>}
                  </figure>
                ))}
              </div>
            </Section>
          )}

          {band.featuredOn && band.featuredOn.length > 0 && (
            <Section n={num()} title="Featured on">
              <div className="bf-stack">
                {band.featuredOn.map(fo => (
                  <AudioFrame
                    key={fo.spotifyAlbumId}
                    src={`https://open.spotify.com/embed/album/${fo.spotifyAlbumId}?utm_source=generator&theme=0`}
                    title={`${fo.title} by ${fo.artist} on Spotify`}
                    width="100%"
                    height="152"
                    loading="lazy"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    style={{ border: 0, borderRadius: '12px', display: 'block' }}
                  />
                ))}
              </div>
            </Section>
          )}

          {band.photos.length > 0 && (
            <Section n={num()} title="Photos" meta={`${pad(band.photos.length)} FILES`}>
              <div className="bf-photos">
                {band.photos.map((p, i) => (
                  <figure key={p.src}>
                    <button
                      type="button"
                      onClick={() => setLightbox(i)}
                      aria-label={`Enlarge ${p.caption ?? `photo ${i + 1}`}`}
                    >
                      <img src={p.src} alt={p.caption ?? `${band.name}, photo ${i + 1}`} loading="lazy" />
                      <span className="bf-photo-n">IMG.{pad(i + 1)}</span>
                    </button>
                    {(p.caption || p.credit) && (
                      <figcaption>
                        {p.caption}
                        {p.caption && p.credit && ' · '}
                        {p.credit && <span className="bf-dim">Art by {p.credit}</span>}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </Section>
          )}
        </div>

        <aside className="bf-side">
          <Section n={num()} title={band.isSoloBrett ? 'Project' : 'Members'} meta={pad(band.members.length)}>
            <Table accent={accent} rows={band.members.map((m, i) => ({ key: `${m.name}-${i}`, cells: [m.name, <span className="bf-dim">{m.role ?? ''}</span>] }))} />
          </Section>

          {band.contributors && band.contributors.length > 0 && (
            <Section n={num()} title="Contributing artists" meta={pad(band.contributors.length)}>
              <Table accent={accent} rows={band.contributors.map((m, i) => ({ key: `${m.name}-${i}`, cells: [m.name, <span className="bf-dim">{m.role ?? ''}</span>] }))} />
            </Section>
          )}

          {band.visualArtists && band.visualArtists.length > 0 && (
            <Section n={num()} title={band.visualArtistsLabel ?? 'Visual artists'} meta={pad(band.visualArtists.length)}>
              <Table
                accent={accent}
                rows={band.visualArtists.map(a => ({
                  key: a.handle,
                  cells: [
                    <a href={`https://instagram.com/${a.handle}`} target="_blank" rel="noopener noreferrer" className="bf-link">
                      {a.name ?? `@${a.handle}`}
                    </a>,
                    <span className="bf-dim">{a.name ? `@${a.handle}` : ''}</span>,
                  ],
                }))}
              />
            </Section>
          )}

          <Link to={`/contact?band=${band.slug}`} className="bf-book">
            <span className="bf-book-k">Book / Contact</span>
            <span className="bf-book-name">{band.name}</span>
            <span className="bf-book-arrow" aria-hidden>
              →
            </span>
          </Link>
        </aside>
      </div>

      <footer className="bf-foot" aria-hidden>
        <span>END OF FILE</span>
        <span className="bf-strip-fill" />
        <span>{band.slug.toUpperCase()}.EPK · {pad(n)} SECTIONS</span>
      </footer>

      <Lightbox
        photos={band.photos}
        index={lightbox}
        onClose={() => setLightbox(null)}
        onNavigate={setLightbox}
        label={band.name}
      />
    </article>
  )
}

function NextShow({ show, bandSlug }: { show: ReturnType<typeof getShowsForBand>[number]; bandSlug: string }) {
  const { day, month, weekday, time } = formatShowDate(show.date)
  const others = [
    ...show.lineup.filter(s => s !== bandSlug).map(s => getBandBySlug(s)?.name ?? s),
    ...(show.alsoPlaying ?? []),
  ]
  const off = show.status === 'soldout' || show.status === 'cancelled'
  return (
    <div className="bf-show">
      <p className="bf-show-day">{day}</p>
      <div className="bf-show-info">
        <p className="bf-show-when">
          {month} · {weekday} · {time}
        </p>
        <p className="bf-show-venue">{show.venue}</p>
        <p className="bf-dim">{show.city}</p>
        {others.length > 0 && <p className="bf-dim">w/ {others.join(', ')}</p>}
        {show.note && <p className="bf-dim">{show.note}</p>}
        {show.ticketUrl && !off && (
          <a className="bf-show-tix" href={show.ticketUrl} target="_blank" rel="noopener noreferrer">
            Tickets ↗
          </a>
        )}
        {off && <p className="bf-show-off">{show.status === 'soldout' ? 'SOLD OUT' : 'CANCELLED'}</p>}
        {show.poster && (
          <a className="bf-show-poster" href={show.poster} target="_blank" rel="noopener noreferrer" aria-label={`Flyer for ${show.venue}`}>
            <img src={show.poster} alt="" loading="lazy" />
          </a>
        )}
      </div>
    </div>
  )
}
