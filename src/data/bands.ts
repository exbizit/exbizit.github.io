// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BANDS.TS — edit this file to update all band content on the site.
// Search for "// TODO" to find every placeholder that needs your copy.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface SocialLink {
  platform:
    | 'bandcamp' | 'spotify' | 'applemusic' | 'youtube'
    | 'instagram' | 'twitter' | 'tiktok' | 'soundcloud' | 'website'
  url: string
  label?: string
}

export interface VideoEmbed {
  platform: 'youtube' | 'vimeo'
  videoId: string
  title: string
}

export interface BandcampEmbed {
  /** Direct link to the album or artist page */
  albumUrl: string
  /**
   * Optional: the numeric album ID for the embedded player.
   * To get it: Bandcamp album page → Share/Embed → Copy embed code → find the number after "album="
   * Leave undefined to show a styled "Listen on Bandcamp" link instead.
   */
  embedAlbumId?: string
}

export interface Photo {
  src: string
  /** Shown as "Art by ..." beneath the image. Always credit work that isn't yours. */
  credit?: string
  caption?: string
}

export interface PressQuote {
  /** Verbatim. Never paraphrase a publication and present it as a quote. */
  quote: string
  source: string
  author?: string
  url?: string
  date?: string
}

/**
 * Per-band typography. Chakra Petch is the system voice (nav, shows, listening,
 * booking); each band overrides it on its own page so the five projects don't
 * read as one brand with five colours.
 */
export interface BandFonts {
  /** CSS font-family for headings and the band name */
  display: string
  /** CSS font-family for body copy and labels */
  body: string
  /** Google Fonts css2 query, loaded only when that band's page is open */
  googleSpec: string
  /** Display tracking — grotesques want negative, serifs and condensed want ~0 */
  displayTracking?: string
  /**
   * Weight for display type. Most of these families ship ONE weight (Archivo
   * Black, Instrument Serif and Bebas Neue are 400 only), so asking for 700
   * makes the browser synthesise a fake bold and smear the letterforms.
   */
  displayWeight?: number
}

export interface Band {
  slug: string
  name: string
  /** Short one-liner shown under the name on the home grid */
  tagline: string
  /** 2–4 sentence bio for press and booking agents */
  description: string
  genre: string[]
  members: { name: string; role?: string }[]
  isActive: boolean
  isSoloBrett?: boolean
  accentColor: string   // hex — each band gets its own identity color
  fonts?: BandFonts
  /** Wordmark / logo shown beside the name on the EPK page */
  logo?: string
  /** Full-bleed dissolved backdrop behind the hero */
  heroImage?: string
  /** Press quotes — the most valuable thing on an EPK */
  press?: PressQuote[]
  /** Past members and guests who played on the records, credited separately from the lineup */
  contributors?: { name: string; role?: string }[]
  socials: SocialLink[]
  videos: VideoEmbed[]
  bandcamp?: BandcampEmbed
  /** Files live in public/photos/<slug>/ and are referenced from /photos/... */
  photos: Photo[]
}

export const BANDS: Band[] = [
  // ─────────────────────────────────────────────────────
  {
    slug: 'hoster',
    name: 'Hoster',
    tagline: 'Some Sorta Rock Music in Central Florida',
    description:
      'Indie Rock featuring a variety of songwriters, singers, and styles. They are influenced by artists like Wednesday, The Hold Steady, Madison Cunningham, and The Districts. Their first single "Before Again" was released in October 2024, followed by their EP "A Little Strange" in July 2025. In 2026, Hoster performed on WPRK Flower Hour, and they released a live recording from that session , "Gnocchi".',
    genre: ['indie rock', 'alternative', 'rock'],
    members: [
      { name: 'Mason K' },
      { name: 'Austin T' },
      { name: 'Brett B' },
      { name: 'Austin P' },
    ],
    isActive: true,
    accentColor: '#C8FF00', // volt yellow
    logo: '/photos/hoster/hosterLogo.png',
    heroImage: '/photos/hoster/punkrockpizza-2.JPG',

    // Sturdy American grotesque — gig-poster weight without the novelty
    fonts: {
      display: "'Archivo Black', sans-serif",
      body: "'Archivo', sans-serif",
      googleSpec: 'family=Archivo+Black&family=Archivo:wght@300;400;500',
      displayTracking: '-0.035em',
      displayWeight: 400, // Archivo Black IS the black weight
    },
    socials: [
      { platform: 'bandcamp', url: 'https://hosterband.bandcamp.com/album/a-little-strange', label: 'A Little Strange' },
      { platform: 'instagram', url: 'https://instagram.com/hoster.band', label: '@hoster.band' },
      { platform: 'spotify', url: 'https://open.spotify.com/artist/1Px4tPlP7lp6GAMzzSnkmX', label: 'Spotify' },
      { platform: 'applemusic', url: 'https://music.apple.com/us/album/a-little-strange-single/1822282849', label: 'Apple Music' },
      { platform: 'youtube', url: 'https://www.youtube.com/watch?v=fwQg3RRtw34', label: 'YouTube' },
    ],
    videos: [
      { platform: 'youtube', videoId: 'fwQg3RRtw34', title: 'WPRK Flower Hour Performance' },
    ],
    bandcamp: {
      albumUrl: 'https://hosterband.bandcamp.com/album/a-little-strange',
      embedAlbumId: '3390669088', // A Little Strange
    },
    photos: [
      { src: '/photos/hoster/stardust-show.jpg',  caption: 'Live at Stardust' },
      { src: '/photos/hoster/wprk-interview.jpg', caption: 'WPRK interview' },
    ],
  },
  // ─────────────────────────────────────────────────────
  {
    slug: 'maryswhitelie',
    name: "Mary's White Lie",
    tagline: 'Orlando Shoegaze Rock',
    // Assembled from the START TRACK review below — rewrite in your own voice when you get a chance.
    description:
      "Mary's White Lie is an Orlando shoegaze project, born as a collaboration between solo " +
      "artists Head Banned and Roger's Only Son. Debut EP Stable of Stone arrived August 2026 — " +
      'three originals plus adjusted-speed bonus versions, moving between shoegaze, folk and indie rock.' +
      'The EP is self-produced and mastered by Mason Krüg. Mary\'s White Lie is influenced by artists like Eric\'s Trip, Deadharrie, Julie, and Total Wife.',
    genre: ['shoegaze', 'indie rock', 'folk'],
    press: [
      {
        // Verbatim apart from the leading ellipsis, which marks the omitted opening
        // clause. The reviewer's own hyphenation is kept as written.
        quote:
          '\u2026a collaboration that scratches my ever-present shoegaze-rock itch ' +
          'with every strum and perfectly-crafted ambience.',
        source: 'START TRACK',
        author: 'Newt Fangs',
        url: 'https://start-track.com/ep-marys-white-lie-stable-of-stone/',
        date: 'August 2026',
      },
    ],
    members: [
      { name: 'Dylon W' },
      { name: 'Brett B' },
      { name: 'Marshall P' },
      { name: 'Dan P' },
    ],
    isActive: true,
    accentColor: '#FF1744', // punk red
    // High-contrast display serif over a warm humanist sans — shoegaze sleeve,
    // and the one serif that suits "perfectly crafted ambience"
    fonts: {
      display: "'Instrument Serif', serif",
      body: "'Karla', sans-serif",
      googleSpec: 'family=Instrument+Serif:ital@0;1&family=Karla:wght@300;400;500',
      displayTracking: '-0.01em',
      displayWeight: 400, // Instrument Serif ships 400 only
    },
    logo: '/photos/maryswhitelie/logo.jpg',
    heroImage: '/photos/maryswhitelie/smoke-text.jpg',
    socials: [
      { platform: 'bandcamp', url: 'https://maryswhitelie.bandcamp.com/album/stable-of-stone', label: 'Stable of Stone' },
      { platform: 'spotify', url: 'https://open.spotify.com/artist/7ATB6jS5IvZnNNonyOzy2o', label: 'Spotify' },
      { platform: 'applemusic', url: 'https://music.apple.com/us/artist/marys-white-lie/6797468984', label: 'Apple Music' },
      { platform: 'instagram', url: 'https://instagram.com/maryswhitelie', label: '@maryswhitelie' },
    ],
    videos: [
      // { platform: 'youtube', videoId: 'VIDEO_ID', title: 'Title' },
    ],
    bandcamp: {
      albumUrl: 'https://maryswhitelie.bandcamp.com/album/stable-of-stone',
      embedAlbumId: '2367107300', // Stable of Stone
    },
    photos: [
      { src: '/photos/maryswhitelie/band-pic.jpg' },
      { src: '/photos/maryswhitelie/band-pic2.jpg' },
      { src: '/photos/maryswhitelie/band-pic3.jpg' },
      { src: '/photos/maryswhitelie/first-show.jpg', caption: 'First show' },
      { src: '/photos/maryswhitelie/kline-art.jpg', credit: 'Hannah Kline' },
      {
        src: '/photos/maryswhitelie/stable-of-stone-cover.jpg',
        caption: 'Stable of Stone',
        credit: 'eastdocht',
      },
    ],
  },
  // ─────────────────────────────────────────────────────
  {
    slug: 'headbanned',
    name: 'Head Banned',
    tagline: "Solo indie-folk project established in 2015",
    description:
      "Head Banned starting writing and producing music in 2015; amounting to 7 full length albums, a live album, and a split EP with zeroindex. While Head Banned continues as a solo project, it played full band shows in Orlando from 2017-2021. Head Banned still plays solo shows and open mics in the area.",
    genre: ['indie folk', 'singer-songwriter', 'psychedelia', 'indie-electronic'],
    members: [
      { name: 'Brett B', role: 'everything' },
    ],
    contributors: [
      { name: 'Austin P' },
      { name: 'Cody L' },
      { name: 'Freddy H' },
      { name: 'Benny Q' },
    ],
    isActive: true,
    isSoloBrett: true,
    accentColor: '#8B00FF', // deep purple
    // Condensed caps over condensed text — xeroxed punk flyer
    fonts: {
      display: "'Bebas Neue', sans-serif",
      body: "'Barlow Condensed', sans-serif",
      googleSpec: 'family=Bebas+Neue&family=Barlow+Condensed:wght@300;400;500',
      displayTracking: '0.01em',
      displayWeight: 400, // Bebas Neue ships 400 only, caps only
    },
    socials: [
      { platform: 'bandcamp', url: 'https://headbanned.bandcamp.com/album/litter-box', label: 'Litter Box' },
      { platform: 'instagram', url: 'https://instagram.com/headbannedband', label: '@headbannedband' },
      { platform: 'spotify', url: 'https://open.spotify.com/artist/1ulYJtDhD4ae4Tc3AGNf7h', label: 'Spotify' },
      { platform: 'applemusic', url: 'https://music.apple.com/us/artist/head-banned/1234098264', label: 'Apple Music' },
    ],
    videos: [],
    bandcamp: {
      albumUrl: 'https://headbanned.bandcamp.com/album/litter-box',
      embedAlbumId: '549311119', // Litter Box
    },
    photos: [],
  },
  // ─────────────────────────────────────────────────────
  {
    slug: 'zeroindex',
    name: 'zeroindex',
    tagline: "sample music, synthesizers, drums n bass",
    description:
      "What happens when you give Brett an SP404 sampler and an analog synthesizer.",
    genre: ['electronic', 'dnb', 'sample-based music'],
    members: [
      { name: 'Brett B', role: 'production, synth, sampler' },
    ],
    isActive: true,
    isSoloBrett: true,
    accentColor: '#00C8FF', // electric cyan
    // Monospace throughout. The name is a zero-indexed array joke; the page
    // should read like a terminal.
    fonts: {
      display: "'JetBrains Mono', monospace",
      body: "'JetBrains Mono', monospace",
      googleSpec: 'family=JetBrains+Mono:wght@300;400;700',
      displayTracking: '-0.04em',
      displayWeight: 700,
    },
    socials: [
      { platform: 'spotify', url: 'https://open.spotify.com/artist/1R5IL9qNESIJGhvlDKoYpR', label: 'Spotify' },
      { platform: 'applemusic', url: 'https://music.apple.com/us/artist/zeroindex/1711445843', label: 'Apple Music' },
      { platform: 'instagram', url: 'https://instagram.com/zeroindex', label: '@zeroindex' },
    ],
    videos: [],
    photos: [],
  },
  // ─────────────────────────────────────────────────────
  {
    slug: 'rogersonlyson',
    name: "Roger's Only Son",
    tagline: "Whispery, Intimate Singer-Songwriter.",
    description:
      "Solo project inspired by Elliott Smith and Guided By Voices -- recorded on tape.",
    genre: ['singer-songwriter', 'folk', 'indie rock'],
    members: [
      { name: 'Dylon W', role: 'everything' },
    ],
    isActive: true,
    accentColor: '#FF8C00', // amber
    // A single light text serif, set large. Literary and quiet — it matches an
    // album titled in lowercase with a b/w side convention.
    fonts: {
      display: "'Newsreader', serif",
      body: "'Newsreader', serif",
      googleSpec: 'family=Newsreader:ital,wght@0,200;0,300;0,400;1,300',
      displayTracking: '-0.015em',
      displayWeight: 300, // set large and light — quiet, not shouty
    },
    socials: [
      { platform: 'bandcamp', url: 'https://rogersonlyson.bandcamp.com/album/lost-project-b-w-emitting-light', label: 'lost project b/w emitting light' },
      { platform: 'spotify', url: 'https://open.spotify.com/artist/4XKVyfk5P65XqcCwEuRHiZ', label: 'Spotify' },
      { platform: 'applemusic', url: 'https://music.apple.com/us/artist/rogers-only-son/1721835129', label: 'Apple Music' },
      { platform: 'instagram', url: 'https://instagram.com/rogersonlyson', label: '@rogersonlyson' },
    ],
    videos: [],
    bandcamp: {
      albumUrl: 'https://rogersonlyson.bandcamp.com/album/lost-project-b-w-emitting-light',
      embedAlbumId: '2533368357', // lost project b/w emitting light
    },
    photos: [],
  },
]

export function getBandBySlug(slug: string): Band | undefined {
  return BANDS.find(b => b.slug === slug)
}

/**
 * Hoster lives at the site root, because hoster.band IS the domain. Every other
 * band sits at /<slug> — e.g. hoster.band/maryswhitelie.
 *
 * Always link through this rather than hardcoding a path — it keeps exactly one
 * canonical URL per band, and keeps band slugs from colliding with the static
 * routes (/shows, /listening, /contact), which are matched first.
 */
export const ROOT_BAND_SLUG = 'hoster'

export function bandPath(slug: string): string {
  return slug === ROOT_BAND_SLUG ? '/' : `/${slug}`
}
