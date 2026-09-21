/**
 * Deterministic content checks. No AI: the same text always gets the same answer.
 *
 * 1. obscenity's English dataset, which already catches common evasions
 *    (leetspeak like "sh1t", stretched letters, spacing/symbols between letters)
 *    and whitelists innocent words that contain bad ones ("Scunthorpe").
 * 2. EXTRA_BLOCKED: your own words, matched after the same kind of normalising.
 * 3. No links, so the board can't be used for spam.
 */
import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from 'obscenity'

/** Add words here (lowercase, letters only). Matched inside other text too. */
export const EXTRA_BLOCKED = [
  // 'example',
]

/** Words that should never be flagged by EXTRA_BLOCKED even if they contain one. */
export const EXTRA_ALLOWED = [
  // 'example',
]

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
})

const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', '@': 'a', $: 's', '!': 'i', '|': 'i', '+': 't' }

/** "Sh1iiit!!" -> "shit": lowercase, undo leetspeak, drop non-letters, collapse repeats. */
export function normalise(text) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[0-9@$!|+]/g, c => LEET[c] ?? c)
    .replace(/[^a-z]/g, '')
    .replace(/(.)\1+/g, '$1')
}

const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|co|ru|xyz|biz|info|link|click|top|site|shop|app|gg|ly|me)\b)/i

/**
 * Returns null when the text is fine, otherwise a short reason code:
 * 'vulgar' | 'link'
 */
export function checkText(text) {
  if (LINK.test(text)) return 'link'
  if (matcher.hasMatch(text)) return 'vulgar'
  let flat = normalise(text)
  for (const ok of EXTRA_ALLOWED) flat = flat.split(normalise(ok)).join('')
  if (EXTRA_BLOCKED.some(w => w && flat.includes(normalise(w)))) return 'vulgar'
  return null
}
