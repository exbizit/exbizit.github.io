/**
 * Which layout the site renders: the primary one (nav + pages), or the
 * alternate desktop OS. Remembered per browser. `?layout=os` or
 * `?layout=primary` in a link picks one, e.g. to share the desktop.
 */
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

export type SiteLayout = 'primary' | 'os'
const KEY = 'site-layout'

function initial(): SiteLayout {
  const asked = new URLSearchParams(window.location.search).get('layout')
  if (asked === 'os' || asked === 'primary') {
    store(asked)
    return asked
  }
  try {
    return localStorage.getItem(KEY) === 'os' ? 'os' : 'primary'
  } catch {
    return 'primary'
  }
}

function store(l: SiteLayout) {
  try {
    localStorage.setItem(KEY, l)
  } catch {
    /* storage blocked: the choice lasts until reload */
  }
}

const Ctx = createContext<{ layout: SiteLayout; setLayout: (l: SiteLayout) => void }>({
  layout: 'primary',
  setLayout: () => {},
})

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [layout, set] = useState<SiteLayout>(initial)
  const setLayout = useCallback((l: SiteLayout) => {
    store(l)
    set(l)
  }, [])
  return <Ctx.Provider value={{ layout, setLayout }}>{children}</Ctx.Provider>
}

export const useLayout = () => useContext(Ctx)
