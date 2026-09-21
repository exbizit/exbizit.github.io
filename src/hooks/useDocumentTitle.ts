import { useEffect } from 'react'

/** The collective. Individual bands are the content; this is the frame. */
export const SITE_NAME = 'The Hostersphere'

/**
 * Sets the tab title per route. A single-page app keeps whatever title the HTML
 * shipped with unless something updates it, so without this every page reads the
 * same in tabs, bookmarks and search results.
 *
 * Pass a page name for "Mary's White Lie — The Hostersphere", or nothing for the
 * bare site name on the home page.
 */
export function useDocumentTitle(page?: string) {
  useEffect(() => {
    document.title = page ? `${page} — ${SITE_NAME}` : SITE_NAME
  }, [page])
}
