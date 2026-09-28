import { memo, useMemo, useRef, type PointerEvent as RPointerEvent } from 'react'
import { getApp } from './apps'
import { desktopSize, useOS, type Win } from './WindowManager'
import { WindowCtx } from './windowContext'

const MIN_W = 320
const MIN_H = 220

/**
 * The page itself. Memoised on the window id so dragging or refocusing a
 * window never re-renders the (heavy) page inside it.
 */
const Body = memo(function Body({ id }: { id: string }) {
  return <>{getApp(id)?.render()}</>
})

/**
 * One window. Positioned with left/top, never transform: pages inside open
 * position:fixed overlays (the photo lightbox) that a transformed ancestor
 * would trap.
 */
export default function OSWindow({ win }: { win: Win }) {
  const os = useOS()
  const app = getApp(win.id)
  const ref = useRef<HTMLElement>(null)
  const focused = os.focusedId === win.id
  const ctx = useMemo(() => ({ id: win.id, focused }), [win.id, focused])
  if (!app) return null

  const { W, H } = desktopSize()
  const max = win.max || os.isMobile
  const rect = max
    ? { x: 0, y: 0, w: W, h: H }
    : {
        x: Math.max(-win.w + 120, Math.min(win.x, W - 120)),
        y: Math.max(0, Math.min(win.y, H - 32)),
        w: win.w,
        h: win.h,
      }

  // Drag/resize write straight to the element and commit on release, so a
  // drag doesn't re-render React every frame.
  const track = (e: RPointerEvent, mode: 'move' | 'resize') => {
    if (max || e.button !== 0) return
    if ((e.target as HTMLElement).closest('button')) return
    const el = ref.current
    if (!el) return
    e.preventDefault()
    const sx = e.clientX
    const sy = e.clientY
    const start = { ...rect }
    let next = start
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - sx
      const dy = ev.clientY - sy
      next =
        mode === 'move'
          ? { ...start, x: start.x + dx, y: Math.max(0, start.y + dy) }
          : { ...start, w: Math.max(MIN_W, start.w + dx), h: Math.max(MIN_H, start.h + dy) }
      el.style.left = `${next.x}px`
      el.style.top = `${next.y}px`
      el.style.width = `${next.w}px`
      el.style.height = `${next.h}px`
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      document.body.classList.remove('os-dragging')
      os.setRect(win.id, next)
    }
    document.body.classList.add('os-dragging')
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const crumbs = app.path === '/' ? 'HOSTER' : app.path.slice(1).toUpperCase()

  return (
    <section
      ref={ref}
      role="dialog"
      aria-label={app.label ?? app.title}
      className={`os-win${focused ? ' is-focused' : ''}${max ? ' is-max' : ''}`}
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        zIndex: win.z,
        display: win.min || (os.isMobile && !focused) ? 'none' : undefined,
        ['--win-accent' as string]: app.accent ?? '#8fa0ff',
      }}
      onPointerDownCapture={() => {
        if (!focused) os.focus(win.id)
      }}
    >
      <header
        className="os-titlebar"
        onPointerDown={e => track(e, 'move')}
        onDoubleClick={() => os.toggleMax(win.id)}
      >
        <span className="os-titlebar-icon" aria-hidden>
          {app.icon()}
        </span>
        <span className="os-grip" aria-hidden />
        <h2 className="os-title">{app.title}</h2>
        <span className="os-grip" aria-hidden />
        <div className="os-controls">
          <button type="button" className="os-ctl" aria-label="Minimise" onClick={() => os.minimize(win.id)}>
            <span className="os-ctl-min" />
          </button>
          {!os.isMobile && (
            <button type="button" className="os-ctl" aria-label={max ? 'Restore' : 'Maximise'} onClick={() => os.toggleMax(win.id)}>
              <span className={max ? 'os-ctl-restore' : 'os-ctl-max'} />
            </button>
          )}
          <button type="button" className="os-ctl os-ctl-close" aria-label="Close" onClick={() => os.close(win.id)}>
            <span className="os-ctl-x" />
          </button>
        </div>
      </header>

      <div className="os-win-body">
        <WindowCtx.Provider value={ctx}>
          <Body id={win.id} />
        </WindowCtx.Provider>
      </div>

      <footer className="os-statusbar" aria-hidden>
        <span>C:\HOSTERSPHERE\{crumbs}</span>
        <span className="os-statusbar-fill" />
        <span>{focused ? 'ACTIVE' : 'IDLE'}</span>
        <span>{Math.round(rect.w)}×{Math.round(rect.h)}</span>
      </footer>
      {!max && <div className="os-resize" onPointerDown={e => track(e, 'resize')} aria-hidden />}
    </section>
  )
}
