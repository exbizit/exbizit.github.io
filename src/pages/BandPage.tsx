import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getBandBySlug, bandPath } from '../data/bands'
import { getShowsForBand } from '../data/shows'
import VideoEmbed from '../components/VideoEmbed'
import BandcampPlayer from '../components/BandcampPlayer'
import SpotifyEmbed from '../components/SpotifyEmbed'
import SocialLinks from '../components/SocialLinks'
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
  useDocumentTitle(band?.name)
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
        className="relative px-6 py-24 overflow-hidden"
        style={{ borderBottom: '1px solid var(--iron)' }}
      >
        {heroSrc && (
          <div className="absolute inset-0">
            <PhotoFrame
              src={heroSrc}
              alt=""
              treatment="dissolve"
              aspect="auto"
              className="w-full h-full opacity-45"
              decorative
            />
          </div>
        )}

        <div
          className="absolute pointer-events-none"
          style={{ right: '-140px', top: '50%', transform: 'translateY(-50%)' }}
        >
          <Sigil size={540} points={12} color={band.accentColor} opacity={0.4} />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="flex items-center gap-6 mb-6 flex-wrap">
            {band.logo && (
              <img
                src={band.logo}
                alt=""
                aria-hidden
                className="shrink-0"
                style={{
                  height: 'clamp(56px, 9vw, 104px)',
                  width: 'auto',
                  filter: 'grayscale(1) contrast(1.15)',
                  mixBlendMode: 'screen',
                }}
              />
            )}
            <h1
              className="display"
              style={{ fontSize: 'clamp(2.4rem, 9vw, 7.5rem)', color: 'var(--bone)' }}
            >
              {band.name}
            </h1>
          </div>

          {/* Single hairline of colour */}
          <div
            className="mb-8"
            style={{ width: '96px', height: '2px', background: band.accentColor }}
          />

          {band.tagline && (
            <p
              className="mb-10"
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
        </div>
      </section>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-16">

          {shows.length > 0 && (
            <section>
              <p className="label mb-6">Upcoming</p>
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
              <p className="label mb-6">Press</p>
              <div className="space-y-8">
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
            <p className="label mb-6">About</p>
            <p
              style={{
                color: isTodo(band.description) ? 'var(--dust)' : 'var(--bone)',
                fontStyle: isTodo(band.description) ? 'italic' : 'normal',
                maxWidth: '62ch',
                lineHeight: 1.8,
                fontWeight: 300,
              }}
            >
              {band.description}
            </p>
          </section>

          {band.videos.length > 0 && (
            <section>
              <p className="label mb-6">Video</p>
              <div className="space-y-8">
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
              <p className="label mb-6">Music</p>
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

          {band.photos.length > 0 && (
            <section>
              <p className="label mb-6">Photos</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
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
        <aside className="space-y-10">
          <div style={{ borderTop: `2px solid ${band.accentColor}`, paddingTop: '1.25rem' }}>
            <p className="label mb-5">{band.isSoloBrett ? 'Project' : 'Members'}</p>
            <MembersList members={band.members} accentColor={band.accentColor} />
          </div>

          {band.contributors && band.contributors.length > 0 && (
            <div style={{ borderTop: '1px solid var(--iron)', paddingTop: '1.25rem' }}>
              <p className="label mb-5">Contributing artists</p>
              <MembersList members={band.contributors} accentColor={band.accentColor} />
            </div>
          )}

          {band.genre.some(g => !g.startsWith('//')) && (
            <div style={{ borderTop: '1px solid var(--iron)', paddingTop: '1.25rem' }}>
              <p className="label mb-5">Genre</p>
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
