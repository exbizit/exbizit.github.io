/**
 * Desktop wallpaper: any photo on the site. A random band photo each visit
 * unless the visitor turns shuffle off in Display Properties, in which case
 * their pick is remembered (localStorage, this browser only).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { BANDS } from '../data/bands'
import { getReleases } from '../data/discography'

export type WallMode = 'fill' | 'fit' | 'tile'
export type WallEffect = 'none' | 'mono' | 'chrome'

export interface WallPhoto {
  src: string
  label: string
  group: string
  kind: 'photo' | 'cover'
}

interface WallState {
  src: string
  mode: WallMode
  effect: WallEffect
  shuffle: boolean
  /** System colour: the hue the desktop's chrome is tinted, and 0 for plain steel */
  hue: number
  sat: number
}

export const DEFAULT_HUE = 232

/** Preset system colours for Display Properties */
export const SYSTEM_COLORS: { name: string; hue: number; sat: number }[] = [
  { name: 'Periwinkle', hue: DEFAULT_HUE, sat: 1 },
  { name: 'Ice', hue: 195, sat: 1 },
  { name: 'Mint', hue: 155, sat: 1 },
  { name: 'Acid', hue: 80, sat: 1 },
  { name: 'Amber', hue: 38, sat: 1 },
  { name: 'Coral', hue: 8, sat: 1 },
  { name: 'Bubblegum', hue: 322, sat: 1 },
  { name: 'Violet', hue: 268, sat: 1 },
  { name: 'Steel', hue: DEFAULT_HUE, sat: 0 },
]

const KEY = 'os-wallpaper'

const fileLabel = (src: string) =>
  decodeURIComponent(src.split('/').pop() ?? src)
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[-_]+/g, ' ')

/** Every photo and cover on the site, grouped by band. */
export const WALL_PHOTOS: WallPhoto[] = (() => {
  const seen = new Set<string>()
  const out: WallPhoto[] = []
  const add = (p: WallPhoto) => {
    if (!p.src || seen.has(p.src)) return
    seen.add(p.src)
    out.push(p)
  }
  for (const b of BANDS) {
    if (b.heroImage) add({ src: b.heroImage, label: fileLabel(b.heroImage), group: b.name, kind: 'photo' })
    for (const p of b.photos) add({ src: p.src, label: p.caption ?? fileLabel(p.src), group: b.name, kind: 'photo' })
    for (const r of getReleases(b.slug)) if (r.cover) add({ src: r.cover, label: r.title, group: b.name, kind: 'cover' })
  }
  return out
})()

const POOL = WALL_PHOTOS.filter(p => p.kind === 'photo')

export function randomPhoto(except?: string): WallPhoto {
  const pool = POOL.length > 1 ? POOL.filter(p => p.src !== except) : POOL
  return pool[Math.floor(Math.random() * pool.length)] ?? WALL_PHOTOS[0]
}

const defaultMode = (src: string): WallMode =>
  WALL_PHOTOS.find(p => p.src === src)?.kind === 'cover' ? 'tile' : 'fill'

function load(): WallState {
  let saved: Partial<WallState> = {}
  try {
    saved = JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    /* private mode or bad JSON: start fresh */
  }
  const shuffle = saved.shuffle !== false
  const keep = !shuffle && saved.src && WALL_PHOTOS.some(p => p.src === saved.src)
  const src = keep ? (saved.src as string) : randomPhoto().src
  return {
    src,
    mode: keep && saved.mode ? saved.mode : defaultMode(src),
    effect: saved.effect ?? 'none',
    shuffle,
    hue: typeof saved.hue === 'number' ? saved.hue : DEFAULT_HUE,
    sat: saved.sat === 0 ? 0 : 1,
  }
}

function save(s: WallState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* storage blocked: the choice just won't persist */
  }
}

interface Wall extends WallState {
  pick: (src: string) => void
  shuffleNow: () => void
  setMode: (m: WallMode) => void
  setEffect: (e: WallEffect) => void
  setShuffle: (on: boolean) => void
  setSystemColor: (hue: number, sat: number) => void
}

const WallCtx = createContext<Wall | null>(null)
export function useWallpaper() {
  const ctx = useContext(WallCtx)
  if (!ctx) throw new Error('useWallpaper outside WallpaperProvider')
  return ctx
}

export function WallpaperProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WallState>(load)
  const update = useCallback((patch: Partial<WallState>) => {
    setState(s => {
      const next = { ...s, ...patch }
      save(next)
      return next
    })
  }, [])

  const value = useMemo<Wall>(
    () => ({
      ...state,
      pick: src => update({ src, mode: defaultMode(src) }),
      shuffleNow: () => {
        const p = randomPhoto(state.src)
        update({ src: p.src, mode: defaultMode(p.src) })
      },
      setMode: mode => update({ mode }),
      setEffect: effect => update({ effect }),
      setShuffle: shuffle => update({ shuffle }),
      setSystemColor: (hue, sat) => update({ hue: Math.round(((hue % 360) + 360) % 360), sat }),
    }),
    [state, update]
  )

  // The chrome's colours are all hsl(var(--sys-h) ...), set on <html> so the
  // player, menus and overlays outside the desktop element pick it up too
  useEffect(() => {
    const root = document.documentElement.style
    root.setProperty('--sys-h', String(state.hue))
    root.setProperty('--sys-sat', String(state.sat))
    return () => {
      root.removeProperty('--sys-h')
      root.removeProperty('--sys-sat')
    }
  }, [state.hue, state.sat])
  return <WallCtx.Provider value={value}>{children}</WallCtx.Provider>
}

/** The picture itself, as it's drawn full-screen or in the preview monitor. */
export function WallImage({ src, mode, effect, tileSize = 'min(30vw, 300px)' }: { src: string; mode: WallMode; effect: WallEffect; tileSize?: string }) {
  return (
    <div className={`os-wall-photo is-${effect}`} aria-hidden>
      <div
        className="os-wall-photo-img"
        style={{
          backgroundImage: `url("${src}")`,
          backgroundSize: mode === 'fill' ? 'cover' : mode === 'fit' ? 'contain' : tileSize,
          backgroundRepeat: mode === 'tile' ? 'repeat' : 'no-repeat',
          backgroundPosition: 'center',
        }}
      />
      {effect === 'chrome' && <div className="os-wall-photo-tint" />}
    </div>
  )
}
