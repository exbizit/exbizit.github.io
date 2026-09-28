import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BANDS } from '../data/bands'
import { getUpcomingShows } from '../data/shows'
import { BAND_APPS, UTIL_APPS } from './apps'
import { ICONS, IconDefs } from './icons'
import { useAmp } from './HosterAmp'
import OSWindow from './OSWindow'
import Taskbar from './Taskbar'
import { useOS } from './WindowManager'
import { WallImage, useWallpaper } from './wallpaper'
import { useLayout } from '../layout'
import './os.css'

const BOOTED_AT = Date.now()

function Uptime() {
  const [s, setS] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setS(Math.floor((Date.now() - BOOTED_AT) / 1000)), 1000)
    return () => window.clearInterval(t)
  }, [])
  const hh = String(Math.floor(s / 3600)).padStart(2, '0')
  const mm = String(Math.floor(s / 60) % 60).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return <>{`${hh}:${mm}:${ss}`}</>
}

function Wallpaper() {
  const wall = useWallpaper()
  const upcoming = getUpcomingShows().length
  return (
    <div className="os-wallpaper" aria-hidden>
      <WallImage src={wall.src} mode={wall.mode} effect={wall.effect} />
      <div className="os-wall-shade" />
      <div className="os-wall-scan" />
      <dl className="os-wall-readout">
        <dt>local hoster os</dt>
        <dd>v{__APP_VERSION__}</dd>
        <dt>node</dt>
        <dd>orlando, fl</dd>
        <dt>lat/lon</dt>
        <dd>
          28.5383<span className="os-deg">°</span>n 81.3792<span className="os-deg">°</span>w
        </dd>
        <dt>bands</dt>
        <dd>{String(BANDS.length).padStart(2, '0')} online</dd>
        <dt>shows</dt>
        <dd>{String(upcoming).padStart(2, '0')} upcoming</dd>
        <dt>uptime</dt>
        <dd>
          <Uptime />
        </dd>
      </dl>
      <div className="os-wall-marks">
        <span />
        <span />
        <span />
        <span />
      </div>
      <p className="os-wall-vert">A COLLECTION OF ORLANDO BANDS — HOSTER.BAND — CENTRAL FLORIDA —</p>
    </div>
  )
}

/** Right-click on the bare desktop */
function DesktopMenu({ at, onClose }: { at: { x: number; y: number }; onClose: () => void }) {
  const os = useOS()
  const wall = useWallpaper()
  const { setLayout } = useLayout()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const off = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && onClose()
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('pointerdown', off)
    window.addEventListener('keydown', esc)
    ref.current?.querySelector('button')?.focus()
    return () => {
      window.removeEventListener('pointerdown', off)
      window.removeEventListener('keydown', esc)
    }
  }, [onClose])
  const item = (label: string, run: () => void) => (
    <button
      type="button"
      role="menuitem"
      className="os-startmenu-item"
      onClick={() => {
        onClose()
        run()
      }}
    >
      {label}
    </button>
  )
  return (
    <div
      ref={ref}
      role="menu"
      className="os-ctxmenu"
      style={{ left: Math.min(at.x, window.innerWidth - 220), top: Math.min(at.y, window.innerHeight - 180) }}
    >
      {item('Next wallpaper', wall.shuffleNow)}
      {item('Change wallpaper…', () => os.open('display'))}
      <hr className="os-startmenu-rule" />
      {item('Show desktop', os.showDesktop)}
      {item('Primary layout', () => setLayout('primary'))}
    </div>
  )
}

function DesktopIcon({ to, label, icon, onClick }: { to?: string; label: string; icon: React.ReactNode; onClick?: () => void }) {
  const inner = (
    <>
      <span className="os-icon-img">{icon}</span>
      <span className="os-icon-label">{label}</span>
    </>
  )
  return to ? (
    <Link to={to} className="os-icon" draggable={false}>
      {inner}
    </Link>
  ) : (
    <button type="button" className="os-icon" onClick={onClick}>
      {inner}
    </button>
  )
}

export default function Desktop() {
  const os = useOS()
  const amp = useAmp()
  const navigate = useNavigate()
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)

  return (
    <div
      className="os-root"
      onContextMenu={e => {
        // Only the bare desktop; windows and the player keep the browser's menu
        const t = e.target as HTMLElement
        if (t.closest('.os-win, .os-taskbar, #webamp, .os-ctxmenu')) return
        e.preventDefault()
        setMenu({ x: e.clientX, y: e.clientY })
      }}
    >
      <IconDefs />
      <Wallpaper />

      <nav className="os-icons" aria-label="Desktop">
        {BAND_APPS.map(a => (
          <DesktopIcon key={a.id} to={a.path} label={a.label ?? a.title} icon={a.icon()} />
        ))}
        {UTIL_APPS.map(a => (
          <DesktopIcon key={a.id} to={a.path} label={a.label ?? a.title} icon={a.icon()} />
        ))}
        <DesktopIcon label="HosterAmp" icon={ICONS.amp()} onClick={amp.show} />
        <DesktopIcon label="Cubefield" icon={ICONS.cubefield()} onClick={() => navigate('/listening?cubefield')} />
      </nav>

      <div className="os-windows">
        {os.windows.map(w => (
          <OSWindow key={w.id} win={w} />
        ))}
      </div>

      <Taskbar />
      {menu && <DesktopMenu at={menu} onClose={() => setMenu(null)} />}
    </div>
  )
}
