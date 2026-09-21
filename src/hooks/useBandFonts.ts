import { useEffect } from 'react'
import type { BandFonts } from '../data/bands'

/**
 * Loads a band's typefaces on demand.
 *
 * Five bands x two families is far too much to load on every page, so each
 * band's stylesheet is injected only when its page opens. `display=swap` means
 * text paints immediately in the fallback and reflows when the face arrives,
 * rather than hanging invisible.
 *
 * The <link> is deliberately NOT removed on unmount: the browser keeps the font
 * cached either way, and leaving it avoids a flash of fallback type if the
 * visitor navigates back.
 */
export function useBandFonts(fonts?: BandFonts) {
  useEffect(() => {
    if (!fonts?.googleSpec) return

    const id = `band-fonts-${fonts.googleSpec}`
    if (document.getElementById(id)) return

    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?${fonts.googleSpec}&display=swap`
    document.head.appendChild(link)
  }, [fonts?.googleSpec])
}
