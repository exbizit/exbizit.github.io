import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getBandBySlug, bandPath } from '../data/bands'
import { getShowsForBand } from '../data/shows'
import VideoEmbed from '../components/VideoEmbed'
import BandcampPlayer from '../components/BandcampPlayer'
import SpotifyEmbed from '../components/SpotifyEmbed'
import SocialLinks from '../components/SocialLinks'
import ReleaseStrip from '../components/ReleaseStrip'
import { getReleases } from '../data/discography'
import MembersList from '../components/MembersList'
import ShowList from '../components/ShowList'
import Sigil from '../components/Sigil'
import PhotoFrame from '../components/PhotoFrame'
import Lightbox from '../components/Lightbox'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useBandFonts } from '../hooks/useBandFonts'

export default function BandPage({ defaultSlug }: { defaultSlug?: string } = {}) {
  // No :slug param when rendered at the root route, so fall back to defaultSlug.
  const { slug: routeSlug } = useParams<{ slug: string }>()
  const slug = routeSlug ?? defaultSlug
  const band = slug ? getBandBySlug(slug) : undefined
  // Declared before the 404 return below — hook order must stay stable across renders
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  useDocumentTitle(band?.name, false) // band name only
  useBandFonts(band?.fonts)

  if (!band) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-6"
        style={{ paddingTop: '56px' }}
      >
        <Sigil size={180} points={8} opacity={0.35} />
        <p className="label">Band not found</p>
        <Link to="/" className="label hover:text-white" style={{ color: 'var(--bone)' }}>
          ← Hoster
        </Link>
      </div>
    )
  }

  const shows = getShowsForBand(band.slug)
  const isTodo = (s: string) => s.startsWith('//')

  const spotifyLink = band.socials.find(s => s.platform === 'spotify')
  let spotifyArtistId: string | null = null
  if (spotifyLink) {
    try {
      spotifyArtistId = new URL(spotifyLink.url).pathname.split('/').filter(Boolean).pop() ?? null
    } catch { /* ignore malformed */ }
  }

  // Dedicated heroImage when set, otherwise fall back to the first photo.
  const heroSrc = band.heroImage ?? band.photos[0]?.src
  const asHeader = band.heroStyle === 'header' && Boolean(heroSrc)
  const lineUnderLogo = Boolean(band.accentUnderLogo && band.logo)

  const f = band.fonts

  return (
    <div
      style={{
        paddingTop: '56px',
        // Scoped to this page — the nav and utility pages keep the system face
        ...(f && {
          ['--font-display' as string]: f.display,
          ['--font-body' as string]: f.body,
          ['--display-tracking' as string]: f.displayTracking ?? '-0.03em',
          ['--display-weight' as string]: String(f.displayWeight ?? 700),
          fontFamily: f.body,
        }),
      }}
    >
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className={`relative overflow-hidden ${asHeader ? 'px-5 md:px-8 flex flex-col justify-end pt-24 pb-4' : 'px-6 pt-24 pb-6'}`}
        style={{
          borderBottom: '1px solid var(--iron)',
          // A photo header needs room to be seen; the name sits at its foot.
          minHeight: asHeader ? 'clamp(460px, 72vh, 760px)' : undefined,
        }}
      >
        {heroSrc && asHeader && (
          <div className="absolute inset-0" aria-hidden>
            <img
              src={heroSrc}
              alt=""
              className="w-full h-full object-cover"
              style={{
                filter: 'grayscale(1) contrast(1.1)',
                opacity: 0.9,
                objectPosition: band.heroPosition ?? 'center',
              }}
            />
            {band.heroFadeLeft && (
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.82) 30%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.05) 100%)',
                }}
              />
            )}
            {/* Dark fade along the bottom only, so the name stays legible
                without dimming the whole photograph */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  // Covers the full text block at the foot (name, hairline,
                  // tagline, links — ~400px), fading out above it.
                  'linear-gradient(to top, #000 0%, rgba(0,0,0,0.88) 30%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.2) 68%, rgba(0,0,0,0) 82%)',
              }}
            />
          </div>
        )}

        {heroSrc && !asHeader && (
          <div className="absolute inset-0">
            <PhotoFrame
              src={heroSrc}
              alt=""
              treatment="dissolve"
              aspect="auto"
              className="w-full h-full opacity-45"
              objectPosition={band.heroPosition}
              decorative
            />
          </div>
        )}

        {/* The sigil would sit over the crowd in a photo header, so it's
            backdrop-only */}
        {!asHeader && (
          <div
            className="absolute pointer-events-none"
            style={{ right: '-140px', top: '50%', transform: 'translateY(-50%)' }}
          >
            <Sigil size={540} points={12} color={band.accentColor} opacity={0.4} />
          </div>
        )}

        <div className={asHeader ? 'relative' : 'relative max-w-7xl mx-auto'}>
          <div className={`flex items-center gap-4 md:gap-5 flex-wrap ${lineUnderLogo ? 'mb-7' : 'mb-5'}`}>
            {band.logo && (
              // The logo gets its own column so an accent line can sit centred
              // under it, and wrap WITH it on phones instead of landing on the
              // wordmark when the row breaks.
              <div className="shrink-0 flex flex-col items-center gap-4">
                <img
                  src={band.logo}
                  alt=""
                  aria-hidden
                  // Rendered exactly as supplied. Logos are the band's identity:
                  // greyscale would strip Hoster's toaster, and the old 'screen'
                  // blend turned any dark-on-light artwork into a white block.
                  style={{
                    height: asHeader ? 'clamp(80px, 11vw, 168px)' : 'clamp(64px, 10vw, 120px)',
                    width: 'auto',
                  }}
                />
                {lineUnderLogo && (
                  <div style={{ width: '96px', height: '2px', background: band.accentColor }} />
                )}
              </div>
            )}
            <h1
              className="display"
              style={{ fontSize: 'clamp(2.4rem, 9vw, 7.5rem)', color: 'var(--bone)' }}
            >
              {band.wordmark ? (
                // Hand-drawn name. The alt text keeps it a real heading for
                // screen readers and search, so nothing is lost by using art.
                <img
                  src={band.wordmark}
                  alt={band.name}
                  style={{
                    height: band.wordmarkHeight ?? 'clamp(88px, 14vw, 230px)',
                    width: 'auto',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    objectPosition: 'left center',
                    display: 'block',
                    // Over a photo header, a soft shadow separates the strokes from
                    // busy midtones behind them. Unneeded on a plain black hero.
                    filter: asHeader ? 'drop-shadow(0 2px 14px rgba(0,0,0,0.9))' : undefined,
                  }}
                />
              ) : (
                band.name
              )}
            </h1>
          </div>

          {/* Single hairline of colour — under the name, unless it sits under the logo */}
          {!lineUnderLogo && (
            <div
              className="mb-6"
              style={{ width: '96px', height: '2px', background: band.accentColor }}
            />
          )}

          {band.tagline && (
            <p
              className="mb-7"
              style={{
                color: isTodo(band.tagline) ? 'var(--dust)' : 'var(--bone)',
                fontStyle: isTodo(band.tagline) ? 'italic' : 'normal',
                maxWidth: '48ch',
                lineHeight: 1.75,
              }}
            >
              {band.tagline}
            </p>
          )}

          <SocialLinks socials={band.socials} accentColor={band.accentColor} />
          <ReleaseStrip releases={getReleases(band.slug)} accentColor={band.accentColor} />
        </div>
      </section>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-5 md:px-8 pt-4 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {band.latestRelease && (
            <section>
              <p className="label mb-3">Latest release</p>
              <h2
                className="display"
                style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: 'var(--bone)' }}
              >
                {band.latestRelease.title}
              </h2>
              {(band.latestRelease.type || band.latestRelease.date) && (
                <p className="label mt-2 mb-3" style={{ color: 'var(--ash)' }}>
                  {[band.latestRelease.type, band.latestRelease.date].filter(Boolean).join(' · ')}
                </p>
              )}
              {band.latestRelease.spotifyAlbumId && (
                <iframe
                  src={`https://open.spotify.com/embed/album/${band.latestRelease.spotifyAlbumId}?utm_source=generator&theme=0`}
                  title={`${band.latestRelease.title} by ${band.name} on Spotify`}
                  width="100%"
                  height="352"
                  loading="lazy"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  // Spotify's player has rounded corners of its own; no outline
                  // around it, and match the radius so nothing peeks at the edges.
                  style={{ border: 0, borderRadius: '12px', display: 'block', maxWidth: '760px' }}
                />
              )}
            </section>
          )}

          {shows.length > 0 && (
            <section>
              <p className="label mb-3">Upcoming</p>
              <ShowList shows={shows} omitBandSlug={band.slug} accentColor={band.accentColor} />
              <Link
                to="/shows"
                className="label inline-block mt-5 hover:text-white"
                style={{ color: band.accentColor }}
              >
                All dates →
              </Link>
            </section>
          )}

          {band.press && band.press.length > 0 && (
            <section>
              <p className="label mb-3">Press</p>
              <div className="space-y-5">
                {band.press.map((q, i) => (
                  <blockquote
                    key={i}
                    style={{ borderLeft: `2px solid ${band.accentColor}`, paddingLeft: '1.5rem' }}
                  >
                    <p
                      style={{
                        color: 'var(--bone)',
                        fontSize: 'clamp(1.05rem, 2.4vw, 1.4rem)',
                        lineHeight: 1.55,
                        fontWeight: 300,
                        maxWidth: '52ch',
                      }}
                    >
                      &ldquo;{q.quote}&rdquo;
                    </p>
                    <footer className="label mt-4">
                      {q.url ? (
                        <a
                          href={q.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-white"
                          style={{ color: 'var(--ash)' }}
                        >
                          {q.source}
                        </a>
                      ) : (
                        <span>{q.source}</span>
                      )}
                      {q.author && <span style={{ color: 'var(--dust)' }}> · {q.author}</span>}
                      {q.date && <span style={{ color: 'var(--dust)' }}> · {q.date}</span>}
                    </footer>
                  </blockquote>
                ))}
              </div>
            </section>
          )}

          <section>
            <p className="label mb-3">About</p>
            <p
              style={{
                color: isTodo(band.description) ? 'var(--dust)' : 'var(--bone)',
                fontStyle: isTodo(band.description) ? 'italic' : 'normal',
                maxWidth: '62ch',
                lineHeight: 1.65,
                fontWeight: 300,
              }}
            >
              {band.description}
            </p>
          </section>

          {band.videos.length > 0 && (
            <section>
              <p className="label mb-3">Video</p>
              <div className="space-y-5">
                {band.videos.map((video, i) => (
                  <div key={i}>
                    <VideoEmbed {...video} />
                    {!isTodo(video.title) && (
                      <p className="label mt-3">{video.title}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {(band.bandcamp || spotifyArtistId) && (
            <section>
              <p className="label mb-3">Music</p>
              <div className="space-y-4">
                {band.bandcamp && (
                  <BandcampPlayer
                    albumUrl={band.bandcamp.albumUrl}
                    embedAlbumId={band.bandcamp.embedAlbumId}
                    bandName={band.name}
                    accentColor={band.accentColor}
                  />
                )}
                {spotifyArtistId && (
                  <SpotifyEmbed artistId={spotifyArtistId} artistName={band.name} />
                )}
              </div>
            </section>
          )}

          {band.featuredOn && band.featuredOn.length > 0 && (
            <section>
              <p className="label mb-3">Featured on</p>
              <div className="space-y-3">
                {band.featuredOn.map(f => (
                  <iframe
                    key={f.spotifyAlbumId}
                    src={`https://open.spotify.com/embed/album/${f.spotifyAlbumId}?utm_source=generator&theme=0`}
                    title={`${f.title} by ${f.artist} on Spotify`}
                    width="100%"
                    height="152"
                    loading="lazy"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    style={{ border: 0, borderRadius: '12px', display: 'block', maxWidth: '760px' }}
                  />
                ))}
              </div>
            </section>
          )}

          {band.photos.length > 0 && (
            <section>
              <p className="label mb-3">Photos</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {band.photos.map((photo, i) => (
                  <figure key={photo.src}>
                    <button
                      type="button"
                      onClick={() => setLightboxIndex(i)}
                      aria-label={`Enlarge ${photo.caption ?? `photo ${i + 1}`}`}
                      className="block w-full transition-opacity hover:opacity-75"
                      style={{ cursor: 'zoom-in' }}
                    >
                      <PhotoFrame
                        src={photo.src}
                        alt={photo.caption ?? `${band.name}, photo ${i + 1}`}
                        treatment="dissolve"
                      />
                    </button>
                    {(photo.caption || photo.credit) && (
                      <figcaption className="label mt-2">
                        {photo.caption}
                        {photo.caption && photo.credit && (
                          <span style={{ color: 'var(--iron)' }}> · </span>
                        )}
                        {photo.credit && (
                          <span style={{ color: 'var(--dust)' }}>Art by {photo.credit}</span>
                        )}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside className="space-y-6">
          <div style={{ borderTop: `2px solid ${band.accentColor}`, paddingTop: '1.25rem' }}>
            <p className="label mb-3">{band.isSoloBrett ? 'Project' : 'Members'}</p>
            <MembersList members={band.members} accentColor={band.accentColor} />
          </div>

          {band.contributors && band.contributors.length > 0 && (
            <div style={{ borderTop: '1px solid var(--iron)', paddingTop: '1.25rem' }}>
              <p className="label mb-3">Contributing artists</p>
              <MembersList members={band.contributors} accentColor={band.accentColor} />
            </div>
          )}

          {band.visualArtists && band.visualArtists.length > 0 && (
            <div style={{ borderTop: '1px solid var(--iron)', paddingTop: '1.25rem' }}>
              <p className="label mb-3">{band.visualArtistsLabel ?? 'Visual artists'}</p>
              <ul className="space-y-2">
                {band.visualArtists.map(a => (
                  <li key={a.handle} className="flex items-baseline gap-2 text-sm">
                    <span style={{ color: band.accentColor }} aria-hidden>—</span>
                    <a
                      href={`https://instagram.com/${a.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                      style={{ color: 'var(--bone)' }}
                    >
                      {a.name ?? `@${a.handle}`}
                    </a>
                    {a.name && (
                      <span className="label" style={{ color: 'var(--dust)' }}>@{a.handle}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {band.genre.some(g => !g.startsWith('//')) && (
            <div style={{ borderTop: '1px solid var(--iron)', paddingTop: '1.25rem' }}>
              <p className="label mb-3">Genre</p>
              <div className="flex flex-wrap gap-2">
                {band.genre
                  .filter(g => !g.startsWith('//'))
                  .map(g => (
                    <span
                      key={g}
                      className="label px-2.5 py-1"
                      style={{ border: '1px solid var(--iron)', color: 'var(--ash)' }}
                    >
                      {g}
                    </span>
                  ))}
              </div>
            </div>
          )}

          <Link
            to={`/contact?band=${band.slug}`}
            className="group relative flex items-center justify-center gap-3 py-4 overflow-hidden transition-colors duration-300"
            style={{ border: `1px solid ${band.accentColor}`, color: band.accentColor }}
          >
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: band.accentColor }}
            />
            <span
              className="relative label transition-colors duration-300 group-hover:text-black"
              style={{ color: 'inherit' }}
            >
              Book / Contact
            </span>
          </Link>
        </aside>
      </div>

      <Lightbox
        photos={band.photos}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
        label={band.name}
      />
    </div>
  )
}
