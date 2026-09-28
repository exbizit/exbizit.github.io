import { useEffect, useRef, useState } from 'react'
import Sigil from '../components/Sigil'
import { getUpcomingShows, formatShowDate } from '../data/shows'
import { getBandBySlug } from '../data/bands'
import { BAND_APPS, UTIL_APPS, getApp } from './apps'
import { ICONS } from './icons'
import { useAmp } from './HosterAmp'
import { useOS } from './WindowManager'
import { useLayout } from '../layout'

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 15_000)
    return () => window.clearInterval(t)
  }, [])
  return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function nextShowLine() {
  const s = getUpcomingShows()[0]
  if (!s) return null
  const { month, day } = formatShowDate(s.date)
  const bands = s.lineup.map(l => getBandBySlug(l)?.name ?? l).join(' + ')
  return `NEXT SHOW ${month} ${day} · ${bands} @ ${s.venue.toUpperCase()}`
}

export default function Taskbar() {
  const os = useOS()
  const amp = useAmp()
  const { setLayout } = useLayout()
  const clock = useClock()
  const [menu, setMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menu) return
    const off = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false)
    window.addEventListener('pointerdown', off)
    window.addEventListener('keydown', esc)
    return () => {
      window.removeEventListener('pointerdown', off)
      window.removeEventListener('keydown', esc)
    }
  }, [menu])

  const lcd = amp.nowPlaying && amp.status !== 'off' ? `${amp.playing ? '▶' : '❚❚'} ${amp.nowPlaying}` : nextShowLine() ?? 'THE HOSTERSPHERE · ORLANDO FL'

  const launch = (id: string) => {
    setMenu(false)
    os.open(id)
  }

  return (
    <div className="os-taskbar" role="toolbar" aria-label="Taskbar">
      <div ref={menuRef} className="relative h-full flex items-center">
        <button
          type="button"
          className={`os-start${menu ? ' is-pressed' : ''}`}
          aria-expanded={menu}
          aria-haspopup="menu"
          onClick={() => setMenu(m => !m)}
        >
          <Sigil size={20} points={8} color="currentColor" drift={false} />
          <span>HSPH</span>
        </button>
        {menu && (
          <div className="os-startmenu" role="menu">
            <div className="os-startmenu-rail" aria-hidden>
              <span>HOSTERSPHERE OS</span>
            </div>
            <div className="os-startmenu-items">
              <p className="os-startmenu-head">BANDS</p>
              {BAND_APPS.map(a => (
                <button key={a.id} role="menuitem" type="button" className="os-startmenu-item" onClick={() => launch(a.id)}>
                  <span className="os-startmenu-icon">{a.icon()}</span>
                  {a.label}
                </button>
              ))}
              <p className="os-startmenu-head">SYSTEM</p>
              {UTIL_APPS.map(a => (
                <button key={a.id} role="menuitem" type="button" className="os-startmenu-item" onClick={() => launch(a.id)}>
                  <span className="os-startmenu-icon">{a.icon()}</span>
                  {a.label}
                </button>
              ))}
              <button
                role="menuitem"
                type="button"
                className="os-startmenu-item"
                onClick={() => {
                  setMenu(false)
                  amp.show()
                }}
              >
                <span className="os-startmenu-icon">{ICONS.amp()}</span>
                HosterAmp
              </button>
              <hr className="os-startmenu-rule" />
              <button
                role="menuitem"
                type="button"
                className="os-startmenu-item"
                onClick={() => {
                  setMenu(false)
                  os.showDesktop()
                }}
              >
                <span className="os-startmenu-icon">{ICONS.folder()}</span>
                Show desktop
              </button>
              <button
                role="menuitem"
                type="button"
                className="os-startmenu-item"
                onClick={() => {
                  setMenu(false)
                  setLayout('primary')
                }}
              >
                <span className="os-startmenu-icon" aria-hidden>⇤</span>
                Primary layout
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="os-tasks no-scrollbar">
        {os.windows.map(w => {
          const app = getApp(w.id)
          if (!app) return null
          const active = os.focusedId === w.id
          return (
            <button
              key={w.id}
              type="button"
              className={`os-task${active ? ' is-pressed' : ''}`}
              aria-pressed={active}
              onClick={() => (active ? os.minimize(w.id) : os.open(w.id))}
              title={app.title}
            >
              <span className="os-task-icon" aria-hidden>
                {app.icon()}
              </span>
              <span className="os-task-label">{app.label ?? app.title}</span>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        className="os-task os-exit"
        onClick={() => setLayout('primary')}
        title="Back to the primary layout"
        aria-label="Primary layout"
      >
        <span className="os-exit-arrow" aria-hidden>⇤</span>
        <span className="os-task-label">Primary layout</span>
      </button>

      <div className="os-tray">
        <button
          type="button"
          className={`os-tray-amp${amp.status === 'open' ? ' is-pressed' : ''}`}
          onClick={() => (amp.status === 'open' ? amp.hide() : amp.show())}
          aria-label={amp.status === 'open' ? 'Hide HosterAmp' : 'Open HosterAmp'}
          title="HosterAmp"
        >
          <span className="os-tray-amp-icon" aria-hidden>
            {ICONS.amp()}
          </span>
          <span className={`os-led${amp.playing ? ' is-on' : ''}`} aria-hidden />
        </button>
        <div className="os-lcd" aria-live="polite">
          <span className="os-lcd-scroll" key={lcd}>
            {lcd}
          </span>
        </div>
        <span className="os-clock">{amp.status === 'loading' ? 'LOADING…' : clock}</span>
      </div>
    </div>
  )
}
