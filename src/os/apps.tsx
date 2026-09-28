/**
 * Everything that can open as a window, and which URL each one lives at.
 * The URL scheme is unchanged from the old routed site, so every existing
 * link (hoster.band/, /shows, /maryswhitelie, ...) still lands on its page.
 */
import type { ReactNode } from 'react'
import { BANDS, ROOT_BAND_SLUG, bandPath, getBandBySlug } from '../data/bands'
import BandPage from '../pages/BandPage'
import Listening from '../pages/Listening'
import Contact from '../pages/Contact'
import Community from '../pages/Community'
import DisplayProperties from './DisplayProperties'
import BandFile from './BandFile'
import ShowsFile from './ShowsFile'
import SysFile from './SysFile'
import { BandIcon, ICONS, type IconName } from './icons'

export interface AppDef {
  id: string
  path: string
  /** Title bar and taskbar text, in the OS's filename voice */
  title: string
  /** Desktop label; falls back to title */
  label?: string
  icon: () => ReactNode
  render: () => ReactNode
  /** Window width the page is designed for */
  width?: number
  accent?: string
}

const bandApp = (slug: string): AppDef => {
  const band = getBandBySlug(slug)
  if (!band) {
    return {
      id: `band:${slug}`,
      path: `/${slug}`,
      title: '404.ERR',
      icon: ICONS.error,
      render: () => <BandPage defaultSlug={slug} />,
      width: 520,
    }
  }
  const file = band.name.toUpperCase().replace(/[^A-Z0-9]+/g, '')
  return {
    id: `band:${slug}`,
    path: bandPath(slug),
    title: `${file}.EPK`,
    label: band.name,
    icon: () => <BandIcon logo={band.logo} image={band.heroImage ?? band.photos[0]?.src} />,
    render: () => <BandFile slug={slug} />,
    accent: band.accentColor,
  }
}

const util = (id: string, path: string, title: string, label: string, icon: IconName, render: () => ReactNode, width?: number): AppDef => ({
  id,
  path,
  title,
  label,
  icon: ICONS[icon],
  render,
  width,
})

export const UTIL_APPS: AppDef[] = [
  util('shows', '/shows', 'SHOWS.CAL', 'Shows', 'shows', () => <ShowsFile />, 980),
  util('listening', '/listening', 'LISTENING.CD', 'Listening', 'listening', () => (
    <SysFile no={2} file="LISTENING.CD" meta="WHAT THE BANDS ARE PLAYING">
      <Listening />
    </SysFile>
  )),
  util('community', '/community', 'COMMUNITY.BBS', 'Community', 'community', () => (
    <SysFile no={3} file="COMMUNITY.BBS" meta="PUBLIC BOARD">
      <Community />
    </SysFile>
  ), 900),
  util('contact', '/contact', 'BOOKING.EML', 'Booking', 'contact', () => (
    <SysFile no={4} file="BOOKING.EML" meta="BOOKING / PRESS">
      <Contact />
    </SysFile>
  ), 900),
  util('display', '/wallpaper', 'DISPLAY.CPL', 'Wallpaper', 'display', () => <DisplayProperties />, 760),
]

export const BAND_APPS: AppDef[] = BANDS.map(b => bandApp(b.slug))

const cache = new Map<string, AppDef>()

export function getApp(id: string): AppDef | undefined {
  if (cache.has(id)) return cache.get(id)
  const app =
    UTIL_APPS.find(a => a.id === id) ??
    BAND_APPS.find(a => a.id === id) ??
    (id.startsWith('band:') ? bandApp(id.slice(5)) : undefined)
  if (app) cache.set(id, app)
  return app
}

/** The app a URL opens, or null for the bare desktop. */
export function appIdForPath(pathname: string): string | null {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return `band:${ROOT_BAND_SLUG}`
  const u = UTIL_APPS.find(a => a.path === path)
  if (u) return u.id
  return `band:${path.slice(1)}`
}
