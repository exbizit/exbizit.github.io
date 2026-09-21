import { useEffect } from 'react'
import { BANDS } from '../data/bands'

/**
 * The nav shows each band's name in that band's own display face, so all of
 * them have to be available on every page. Loading five full families
 * everywhere would undo the per-page font loading, so this asks Google Fonts
 * for ONLY the glyphs in each name (`text=`) — a few KB instead of a few
 * hundred. Bands with a wordmark image are skipped; they need no font here.
 *
 * When a band's own page later loads the full family under the same name, that
 * stylesheet is added after this one and wins, so page text isn't stuck with
 * the subset.
 */
export function useNavFonts() {
  useEffect(() => {
    // One request per band rather than one combined request: each is verified to
    // resolve on its own, and a failure can only cost that one band its face.
    for (const b of BANDS) {
      if (b.wordmark || !b.fonts) continue

      const id = `nav-font-${b.slug}`
      if (document.getElementById(id)) continue

      const name = b.fonts.display.match(/'([^']+)'/)?.[1] ?? b.fonts.display
      const weight = b.fonts.displayWeight ?? 700
      const fam = name.replace(/ /g, '+')
      const family = weight === 400 ? `family=${fam}` : `family=${fam}:wght@${weight}`
      const glyphs = [...new Set(b.name)].join('')   // just this band's letters

      const link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      link.href =
        `https://fonts.googleapis.com/css2?${family}` +
        `&text=${encodeURIComponent(glyphs)}&display=swap`
      document.head.appendChild(link)
    }
  }, [])
}
