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
  /** Font size for this band's name in the nav — faces differ a lot at small sizes */
  navSize?: string
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
  /**
   * Hand-drawn name artwork (white on transparent). When set it replaces the
   * typed band name in the hero; the name stays in the markup for screen
   * readers and search.
   */
  wordmark?: string
  /**
   * Featured at the top of the band's page. Spotify album id (from the album's
   * share link) renders Spotify's player with the full tracklist.
   */
  latestRelease?: {
    title: string
    type?: string          // 'Album', 'EP', 'Single'
    date?: string          // as it should read on the page
    spotifyAlbumId?: string
  }
  /** Which tab the floating music player opens on when both exist (default Bandcamp) */
  playerDefault?: 'bandcamp' | 'spotify'
  /** Spotify album the music player shows instead of the artist's whole profile */
  spotifyPlayerAlbumId?: string
  /** Other artists' releases this project appears on (Spotify album/single ids) */
  featuredOn?: {
    title: string
    artist: string
    spotifyAlbumId: string
  }[]
  /** Centre the accent line under the logo rather than under the name */
  accentUnderLogo?: boolean
  /** CSS height for the wordmark in the hero. Wide artwork needs a smaller value. */
  wordmarkHeight?: string
  /** Full-bleed dissolved backdrop behind the hero */
  heroImage?: string
  /**
   * 'backdrop' (default): faint, dissolved atmosphere behind the name.
   * 'header': the photo IS the header — near full strength, a dark fade only
   * along the bottom for legibility, no sigil over it. Suits real photographs;
   * graphics and cover art usually read better as a backdrop.
   */
  heroStyle?: 'backdrop' | 'header'
  /** CSS object-position for the hero image (either style) — which part of the frame to keep */
  heroPosition?: string
  /** Header mode: also darken from the left, for bright artwork behind the name */
  heroFadeLeft?: boolean
  /** Press quotes — the most valuable thing on an EPK */
  press?: PressQuote[]
  /**
   * Visual artists and photographers behind the band's imagery. Instagram
   * handles without the @; `name` only when we actually know it.
   */
  visualArtists?: { handle: string; name?: string }[]
  /** Heading for that block — defaults to "Visual artists" */
  visualArtistsLabel?: string
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
      'Indie Rock blending multiple songwriters and styles. Influenced by artists like Wednesday, The Hold Steady, Madison Cunningham, and The Districts. Their first single "Before Again" was released in October 2024, followed by their EP "A Little Strange" in July 2025. In 2026, Hoster performed on WPRK Flower Hour, and they released a live recording from that session , "Gnocchi".',
    genre: ['indie rock', 'alternative', 'rock'],
    members: [
      { name: 'Mason K' },
      { name: 'Austin T' },
      { name: 'Brett B' },
      { name: 'Austin P' },
      { name: 'Rachel G' }
    ],
    isActive: true,
    accentColor: '#63909C', // toaster teal — sampled from the logo, lifted to 6:1 on black
    logo: '/photos/hoster/logo.png',
    heroImage: '/photos/hoster/house-show.jpg',
    heroStyle: 'header',
    visualArtistsLabel: 'Visual artists & photographers',
    visualArtists: [
      { handle: 'paolashung' },
      { handle: 'photosbymaddog' },
      { handle: 'headbannedband' },
      { handle: 'theaustinpalmer' },
      { handle: 'allycantdance' },
    ],
    wordmark: '/photos/hoster/wordmark.png',

    // Sturdy American grotesque — gig-poster weight without the novelty
    fonts: {
      display: "'Archivo Black', sans-serif",
      body: "'Archivo', sans-serif",
      googleSpec: 'family=Archivo+Black&family=Archivo:wght@300;400;500',
      displayTracking: '-0.035em',
      displayWeight: 400, // Archivo Black IS the black weight
      navSize: '34px',     // wordmark height in the nav
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
      { src: '/photos/hoster/band-photo.jpg' },
      { src: '/photos/hoster/house-show.jpg', caption: 'House show' },
      { src: '/photos/hoster/performing.jpg' },
      { src: '/photos/hoster/punk-rock-pizza.jpg', caption: 'Live at Punk Rock Pizza' },
      { src: '/photos/hoster/punk-rock-pizza-show.jpg', caption: 'Live at Punk Rock Pizza' },
      { src: '/photos/hoster/river-jams.jpg', caption: 'River jams' },
      { src: '/photos/hoster/stardust-show.jpg', caption: 'Live at Stardust' },
      { src: '/photos/hoster/wprk-interview.jpg', caption: 'WPRK interview' },
      { src: '/photos/hoster/a-little-strange-cover.jpg', caption: 'A Little Strange' },
      { src: '/photos/hoster/gnocchi-cover.jpg', caption: 'Gnocchi — Live on WPRK Flower Hour' },
      { src: '/photos/hoster/sticker.jpg', caption: 'Sticker' },
      { src: '/photos/hoster/catpuppy.jpg', caption: 'Catpuppies' },
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
      "artists Head Banned and Roger's Only Son. Debut EP Stable of Stone arrived August 2026 and features " +
      'three originals plus adjusted-speed "nightcore" bonus versions. ' +
      'The EP is self-produced and mastered by Mason Krüg. Mary\'s White Lie is influenced by artists like Eric\'s Trip, Alex G, Elliott Smith, Deadharrie, Julie, Total Wife, and countless others.',
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
      navSize: '34px',     // thin smoke strokes go soft much below this
    },
    logo: '/photos/maryswhitelie/logo.png',
    accentUnderLogo: true,
    // Just the pen drawing, cropped out of the square composition's black margins
    heroImage: '/photos/maryswhitelie/hero-drawing.jpg',
    heroStyle: 'header',
    heroPosition: 'center 22%',   // keep the hills, road and house
    heroFadeLeft: true,
    // smoky lettering from the top of smoke-text.jpeg; ~6.6:1, so shorter than Hoster's
    wordmark: '/photos/maryswhitelie/wordmark.png',
    wordmarkHeight: 'clamp(56px, 9vw, 150px)',
    visualArtists: [
      { handle: 'eastdocht', name: 'East' },
      { handle: 'hklineart', name: 'Hannah Kline' },
      { handle: 'photosbymaddog' },
      { handle: 'travlorkian' },
    ],
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
      "Head Banned starting writing and producing music in 2015; amounting to 7 full length albums, a live album, and a split EP with zeroindex. While Head Banned continues as a solo project, it played full band shows in Orlando from 2017-2021.",
    genre: ['indie folk', 'singer-songwriter', 'psychedelia', 'indie-electronic'],
    members: [
      { name: 'Brett B', role: 'songwriting & production' },
    ],
    contributors: [
      { name: 'Austin P' },
      { name: 'Cody L' },
      { name: 'Freddy H' },
      { name: 'Benny Q' },
    ],
    heroImage: '/photos/headbanned/phishing-cover.jpg',
    playerDefault: 'spotify',   // Bandcamp only has part of the catalogue
    spotifyPlayerAlbumId: '3SM7BZN93605bQDOOydIWk',   // Keep Phishing
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
      navSize: '1.25rem',  // condensed caps read small
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
    photos: [
      { src: '/photos/headbanned/headbanned.jpg' },
      { src: '/photos/headbanned/phishing-cover.jpg', caption: 'Keep Phishing' },
    ],
  },
  // ─────────────────────────────────────────────────────
  {
    slug: 'zeroindex',
    name: 'zeroindex',
    tagline: "samplers, synthesizers, dnb",
    description:
      "Mashing together breakbeats, early 2000's pop, underground rap, and Rachel doing bubble noises.",
    genre: ['electronic', 'dnb', 'sample-based music'],
    members: [
      { name: 'Brett B', role: 'production, synth, sampler' },
    ],
    isActive: true,
    isSoloBrett: true,
    accentColor: '#C8FF00', // volt lime (Hoster's old colour; cyan clashed with the toaster)
    // Monospace throughout. The name is a zero-indexed array joke; the page
    // should read like a terminal.
    fonts: {
      display: "'JetBrains Mono', monospace",
      body: "'JetBrains Mono', monospace",
      googleSpec: 'family=JetBrains+Mono:wght@300;400;700',
      displayTracking: '-0.04em',
      displayWeight: 700,
      navSize: '0.95rem',  // mono runs wide
    },
    socials: [
      { platform: 'spotify', url: 'https://open.spotify.com/artist/1R5IL9qNESIJGhvlDKoYpR', label: 'Spotify' },
      { platform: 'applemusic', url: 'https://music.apple.com/us/artist/zeroindex/1711445843', label: 'Apple Music' },
      { platform: 'instagram', url: 'https://instagram.com/zeroindex', label: '@zeroindex' },
    ],
    videos: [],
    heroPosition: 'center bottom',   // photo's bottom edge pinned to the hero's
    featuredOn: [
      // cqgator, feat. zeroindex & shinji death cult (single, 2024)
      { title: 'around for me', artist: 'cqgator', spotifyAlbumId: '2ty6NyovJ2UnvoxIDsv9Nt' },
    ],
    photos: [
      { src: '/photos/zeroindex/mixing.jpg' },
      { src: '/photos/zeroindex/grindset-cover.jpg', caption: 'Grindset' },
    ],
  },
  // ─────────────────────────────────────────────────────
  {
    slug: 'rogersonlyson',
    name: "Roger's Only Son",
    tagline: "Whispery, Intimate, Analog Singer-Songwriter",
    description:
      "Solo project inspired by Elliott Smith, Guided By Voices, and Roger himself. Recorded on tape.",
    genre: ['singer-songwriter', 'folk', 'indie rock'],
    members: [
      { name: 'Dylon W', role: 'makin\' the music' },
    ],
    isActive: true,
    accentColor: '#FF8C00', // amber
    // Circle-cropped from the ROS portrait (see scripts/build-photos.py)
    logo: '/photos/rogersonlyson/logo.png',
    heroImage: '/photos/rogersonlyson/punk-rock-pizza-1.jpg',
    heroStyle: 'header',
    heroPosition: 'center 30%',   // keep the head and the lit corridor
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
    photos: [
      { src: '/photos/rogersonlyson/ros-1.jpg' },
      { src: '/photos/rogersonlyson/ros-2.jpg' },
      { src: '/photos/rogersonlyson/ros-3.jpg' },
      { src: '/photos/rogersonlyson/punk-rock-pizza-1.jpg', caption: 'Live at Punk Rock Pizza' },
      { src: '/photos/rogersonlyson/punk-rock-pizza-2.jpg', caption: 'Live at Punk Rock Pizza' },
      { src: '/photos/rogersonlyson/taut-pupils-cover.jpg', caption: 'The Taut Pupils For Sore Eyes' },
    ],
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
