import { useContext, useEffect } from 'react'
import { WindowCtx } from '../os/windowContext'

/** The collective. Individual bands are the content; this is the frame. */
export const SITE_NAME = 'local hoster'

/**
 * Sets the tab title per route. A single-page app keeps whatever title the HTML
 * shipped with unless something updates it, so without this every page reads the
 * same in tabs, bookmarks and search results.
 *
 * Pass a page name for "Shows — local hoster", or nothing for the bare site
 * name. Band pages pass `withSite: false` so the tab reads just the band name.
 */
export function useDocumentTitle(page?: string, withSite = true) {
  // Several pages can be open at once in their windows; the front one names the tab
  const win = useContext(WindowCtx)
  const inFront = !win || win.focused
  useEffect(() => {
    if (!inFront) return
    document.title = page ? (withSite ? `${page} — ${SITE_NAME}` : page) : SITE_NAME
  }, [page, withSite, inFront])
}
