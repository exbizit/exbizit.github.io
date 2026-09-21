import { useEffect } from 'react'

/** The collective. Individual bands are the content; this is the frame. */
export const SITE_NAME = 'The Hostersphere'

/**
 * Sets the tab title per route. A single-page app keeps whatever title the HTML
 * shipped with unless something updates it, so without this every page reads the
 * same in tabs, bookmarks and search results.
 *
 * Pass a page name for "Shows — The Hostersphere", or nothing for the bare site
 * name. Band pages pass `withSite: false` so the tab reads just the band name.
 */
export function useDocumentTitle(page?: string, withSite = true) {
  useEffect(() => {
    document.title = page ? (withSite ? `${page} — ${SITE_NAME}` : page) : SITE_NAME
  }, [page, withSite])
}
