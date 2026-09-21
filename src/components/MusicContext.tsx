import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

/**
 * Tells the site-wide music player which band page is showing, so its button
 * offers that band. The player itself lives above the routes (App.tsx), so it
 * survives page changes and the music keeps going.
 */
const Ctx = createContext<{ pageSlug: string | null; setPageSlug: (s: string | null) => void }>({
  pageSlug: null,
  setPageSlug: () => {},
})

export function MusicProvider({ children }: { children: ReactNode }) {
  const [pageSlug, setPageSlug] = useState<string | null>(null)
  return <Ctx.Provider value={{ pageSlug, setPageSlug }}>{children}</Ctx.Provider>
}

export const usePageSlug = () => useContext(Ctx).pageSlug

/** Call from a band page: marks that band as the one on screen. */
export function usePageBand(slug: string | undefined) {
  const { setPageSlug } = useContext(Ctx)
  useEffect(() => {
    setPageSlug(slug ?? null)
    return () => setPageSlug(null)
  }, [slug, setPageSlug])
}
