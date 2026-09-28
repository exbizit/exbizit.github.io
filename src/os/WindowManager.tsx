/**
 * The desktop's window manager.
 *
 * The URL is the source of truth for which window is in front: visiting
 * /shows opens (or raises) the Shows window, focusing a window swaps the URL
 * to its page, and closing the front window hands the URL to the next one
 * down. So deep links, the back button and every in-page <Link> keep working
 * exactly as they did when these were routed pages.
 *
 * "/" is Hoster's page (hoster.band is its domain). Closing everything goes
 * to "/" with `state.bare`, the one URL that shows an empty desktop.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ROOT_BAND_SLUG } from '../data/bands'
import { SITE_NAME } from '../hooks/useDocumentTitle'
import { appIdForPath, getApp } from './apps'

export const TASKBAR_H = 42
const MOBILE_QUERY = '(max-width: 767px)'

export interface Win {
  id: string
  search: string
  x: number
  y: number
  w: number
  h: number
  z: number
  min: boolean
  max: boolean
}

interface OS {
  windows: Win[]
  focusedId: string | null
  isMobile: boolean
  open: (id: string) => void
  focus: (id: string) => void
  close: (id: string) => void
  minimize: (id: string) => void
  toggleMax: (id: string) => void
  setRect: (id: string, r: Pick<Win, 'x' | 'y' | 'w' | 'h'>) => void
  showDesktop: () => void
}

const OSCtx = createContext<OS | null>(null)
export function useOS() {
  const ctx = useContext(OSCtx)
  if (!ctx) throw new Error('useOS outside WindowManager')
  return ctx
}

export function desktopSize() {
  return { W: window.innerWidth, H: window.innerHeight - TASKBAR_H }
}

function initialRect(n: number, width?: number) {
  const { W, H } = desktopSize()
  const step = (n % 6) * 26
  // Clear of the desktop icons, however many columns they wrapped into
  const icons = document.querySelector('.os-icons')?.getBoundingClientRect().right ?? 100
  const x = Math.min(Math.round(icons) + 10 + step, Math.max(0, W - 360))
  const y = 14 + step
  return {
    x,
    y,
    w: Math.max(320, Math.min(width ?? 1200, W - x - 14)),
    h: Math.max(240, H - y - 14),
  }
}

function useMediaQuery(q: string) {
  const [match, setMatch] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const on = () => setMatch(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [q])
  return match
}

export function WindowManager({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const isMobile = useMediaQuery(MOBILE_QUERY)
  const [windows, setWindows] = useState<Win[]>([])
  const zTop = useRef(10)

  const bare = Boolean((location.state as { bare?: boolean } | null)?.bare)
  const routeId = bare ? null : appIdForPath(location.pathname)
  const routeWin = windows.find(w => w.id === routeId)
  const focusedId = routeWin && !routeWin.min ? routeWin.id : null

  // URL -> windows
  useEffect(() => {
    if (location.pathname === `/${ROOT_BAND_SLUG}`) {
      navigate({ pathname: '/', search: location.search }, { replace: true })
      return
    }
    if (!routeId) return
    const z = ++zTop.current
    setWindows(ws => {
      const hit = ws.find(w => w.id === routeId)
      if (hit) return ws.map(w => (w.id === routeId ? { ...w, min: false, z, search: location.search } : w))
      const app = getApp(routeId)
      return [...ws, { id: routeId, search: location.search, ...initialRect(ws.length, app?.width), z, min: false, max: false }]
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  useEffect(() => {
    if (!focusedId) document.title = SITE_NAME
  }, [focusedId])

  const goTo = useCallback(
    (w: Win | undefined, replace: boolean) => {
      const app = w && getApp(w.id)
      if (app) navigate(app.path + w.search, { replace })
      else navigate('/', { replace, state: { bare: true } })
    },
    [navigate]
  )

  const topOf = (ws: Win[]) => ws.filter(w => !w.min).sort((a, b) => b.z - a.z)[0]

  const os = useMemo<OS>(
    () => ({
      windows,
      focusedId,
      isMobile,
      open: id => {
        const app = getApp(id)
        if (!app) return
        const w = windows.find(x => x.id === id)
        navigate(app.path + (w?.search ?? ''))
      },
      focus: id => {
        if (id === focusedId) {
          const z = ++zTop.current
          setWindows(ws => ws.map(w => (w.id === id ? { ...w, z } : w)))
          return
        }
        goTo(windows.find(w => w.id === id), true)
      },
      close: id => {
        const rest = windows.filter(w => w.id !== id)
        setWindows(rest)
        if (id === focusedId) goTo(topOf(rest), true)
      },
      minimize: id => {
        const next = windows.map(w => (w.id === id ? { ...w, min: true } : w))
        setWindows(next)
        if (id === focusedId) goTo(topOf(next), true)
      },
      toggleMax: id => setWindows(ws => ws.map(w => (w.id === id ? { ...w, max: !w.max } : w))),
      setRect: (id, r) => setWindows(ws => ws.map(w => (w.id === id ? { ...w, ...r } : w))),
      showDesktop: () => {
        setWindows(ws => ws.map(w => ({ ...w, min: true })))
        navigate('/', { state: { bare: true } })
      },
    }),
    [windows, focusedId, isMobile, navigate, goTo]
  )

  return <OSCtx.Provider value={os}>{children}</OSCtx.Provider>
}
