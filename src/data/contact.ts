/**
 * Contact routing via Web3Forms.
 *
 * NO EMAIL ADDRESS APPEARS IN THIS CODEBASE OR IN THE DEPLOYED BUNDLE.
 * Each access key is registered to a recipient address in the Web3Forms
 * dashboard; the key itself reveals nothing about the address behind it.
 *
 * Access keys are designed to be public (Web3Forms' own docs put them straight
 * into client-side HTML), so committing them is not a leak. They live in env
 * here only so you can rotate one without editing code.
 *
 * Setup for each recipient: web3forms.com → enter that address → copy the key.
 * See README → "Contact form delivery".
 */

const env = import.meta.env

export const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit'

/** Key registered to the address that should receive EVERY inquiry. */
export const PRIMARY_KEY: string = env.VITE_W3F_KEY_PRIMARY ?? ''

/** Per-project keys, each registered to that project's own address. */
const PROJECT_KEYS: Record<string, string | undefined> = {
  'hoster':          env.VITE_W3F_KEY_HOSTER,
  'maryswhitelie': env.VITE_W3F_KEY_MARYS,
  'rogersonlyson': env.VITE_W3F_KEY_ROGERS,
  // headbanned and zeroindex route to PRIMARY_KEY only.
}

/** False when .env.local is missing — the form says so instead of failing silently. */
export const isContactConfigured = Boolean(PRIMARY_KEY)

/** PRIMARY_KEY first, then this project's key if it has one. */
export function getKeysForBand(slug?: string | null): string[] {
  const extra = slug ? PROJECT_KEYS[slug] : undefined
  return [PRIMARY_KEY, extra].filter((k): k is string => Boolean(k))
}

export interface Inquiry {
  name: string
  email: string
  project: string
  message: string
}

/**
 * One POST per recipient key, in parallel. Each key delivers to its own address,
 * so a two-key send reaches both inboxes without either address touching the client.
 * Resolves true only if every delivery succeeded.
 */
export async function sendInquiry(keys: string[], inquiry: Inquiry): Promise<boolean> {
  if (keys.length === 0) return false

  const results = await Promise.allSettled(
    keys.map(async access_key => {
      const res = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key,
          subject: `[Booking] ${inquiry.project} — ${inquiry.name}`,
          from_name: inquiry.name,
          replyto: inquiry.email,
          Project: inquiry.project,
          Name: inquiry.name,
          Email: inquiry.email,
          Message: inquiry.message,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message ?? 'Delivery failed')
      return data
    })
  )

  return results.every(r => r.status === 'fulfilled')
}
