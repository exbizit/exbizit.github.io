/**
 * Community board settings. Both values are public by design.
 *
 * BOARD_API: the Worker URL printed by `npx wrangler deploy` (see worker/README.md).
 *            Empty = the page says the board is coming soon.
 * TURNSTILE_SITE_KEY: the Turnstile widget's site key (the secret key lives
 *            only in Cloudflare, as a Worker secret).
 */
export const BOARD_API = ''
export const TURNSTILE_SITE_KEY = '0x4AAAAAAE_CrzZZSJuVk1Gy'

export const MAX_NAME = 40
export const MAX_MESSAGE = 500

export interface BoardPost {
  id: number
  name: string
  message: string
  created_at: number
}
