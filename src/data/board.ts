/**
 * Community board settings. Both values are public by design.
 *
 * BOARD_API: the Worker URL printed by `npx wrangler deploy` (see worker/README.md).
 *            Empty = the page says the board is coming soon.
 * TURNSTILE_SITE_KEY: the Turnstile widget's site key (the secret key lives
 *            only in Cloudflare, as a Worker secret).
 */
export const BOARD_API = 'https://hostersphere-board.hostersphere-board.workers.dev'
export const TURNSTILE_SITE_KEY = '0x4AAAAAAE_CrzZZSJuVk1Gy'

export const MAX_NAME = 40
export const MAX_MESSAGE = 500

/** Colours a poster can pick. Keep ids in sync with COLORS in worker/src/index.js. */
export const COLORS: { id: string; hex: string; label: string }[] = [
  { id: 'toaster', hex: '#63909C', label: 'Toaster teal' },
  { id: 'ember', hex: '#FF1744', label: 'Ember red' },
  { id: 'grape', hex: '#B066FF', label: 'Grape' },
  { id: 'lime', hex: '#C8FF00', label: 'Lime' },
  { id: 'amber', hex: '#FF8C00', label: 'Amber' },
  { id: 'bubblegum', hex: '#FF6EC7', label: 'Bubblegum' },
  { id: 'sky', hex: '#4FC3F7', label: 'Sky' },
  { id: 'bone', hex: '#E8E6E1', label: 'Bone' },
]

/** Icons a poster can pick. Keep ids in sync with ICONS in worker/src/index.js. */
export const ICONS: { id: string; glyph: string; label: string }[] = [
  { id: 'sparkle', glyph: '✦', label: 'Sparkle' },
  { id: 'heart', glyph: '♥', label: 'Heart' },
  { id: 'star', glyph: '★', label: 'Star' },
  { id: 'moon', glyph: '☾', label: 'Moon' },
  { id: 'notes', glyph: '♫', label: 'Music' },
  { id: 'flower', glyph: '✿', label: 'Flower' },
  { id: 'sun', glyph: '☼', label: 'Sun' },
  { id: 'skull', glyph: '☠', label: 'Skull' },
  { id: 'peace', glyph: '☮', label: 'Peace' },
  { id: 'bolt', glyph: 'ϟ', label: 'Bolt' },
]

/** Reactions anyone can add to a message. Keep ids in sync with REACTIONS in worker/src/index.js. */
export const REACTIONS: { id: string; glyph: string; label: string }[] = [
  { id: 'plus1', glyph: '+1', label: 'Plus one' },
  { id: 'heart', glyph: '♥', label: 'Love' },
  { id: 'star', glyph: '★', label: 'Star' },
  { id: 'notes', glyph: '♫', label: 'Music' },
  { id: 'skull', glyph: '☠', label: 'Skull' },
]

export const colorHex = (id?: string | null) => COLORS.find(c => c.id === id)?.hex ?? null
export const iconGlyph = (id?: string | null) => ICONS.find(i => i.id === id)?.glyph ?? null

export interface BoardPost {
  id: number
  name: string
  message: string
  created_at: number
  color?: string | null
  icon?: string | null
  /** count per reaction id */
  reactions?: Record<string, number>
  /** reaction ids this visitor has added */
  mine?: string[]
}
