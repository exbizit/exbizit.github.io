import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  BOARD_API,
  TURNSTILE_SITE_KEY,
  MAX_NAME,
  MAX_MESSAGE,
  COLORS,
  ICONS,
  colorHex,
  iconGlyph,
  type BoardPost,
} from '../data/board'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id?: string) => void
      remove: (id?: string) => void
    }
  }
}

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

/** Loads Turnstile's script once and resolves when it's ready. */
function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SRC}"]`)
    const s = existing ?? document.createElement('script')
    s.addEventListener('load', () => resolve())
    s.addEventListener('error', () => reject(new Error('turnstile')))
    if (!existing) {
      s.src = TURNSTILE_SRC
      s.async = true
      document.head.appendChild(s)
    }
  })
}

function timeAgo(ms: number): string {
  const s = Math.max(1, Math.round((Date.now() - ms) / 1000))
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Community() {
  useDocumentTitle('Community')

  const [posts, setPosts] = useState<BoardPost[]>([])
  const [more, setMore] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [color, setColor] = useState<string | null>(null)
  const [icon, setIcon] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Admin mode: visit /community?admin to get delete buttons (asks for the token)
  const admin = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('admin')

  const widgetEl = useRef<HTMLDivElement>(null)
  const boardEl = useRef<HTMLDivElement>(null)
  // After the first load or a new post, jump the board to its newest (bottom) message
  const stickToBottom = useRef(true)
  const widgetId = useRef<string | null>(null)

  const load = useCallback(async (before?: number) => {
    if (!BOARD_API) return
    try {
      const res = await fetch(`${BOARD_API}/posts${before ? `?before=${before}` : ''}`)
      const data = await res.json()
      setPosts(p => (before ? [...p, ...data.posts] : data.posts))
      setMore(Boolean(data.more))
      setLoadError(false)
    } catch {
      setLoadError(true)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Keep the view pinned to the newest message when asked; when older messages
  // load in at the top, keep the reader where they were instead.
  const heightBeforeOlder = useRef<number | null>(null)
  useLayoutEffect(() => {
    const el = boardEl.current
    if (!el) return
    if (heightBeforeOlder.current !== null) {
      el.scrollTop += el.scrollHeight - heightBeforeOlder.current
      heightBeforeOlder.current = null
    } else if (stickToBottom.current && posts.length > 0) {
      el.scrollTop = el.scrollHeight
      stickToBottom.current = false
    }
  }, [posts])

  const loadOlder = () => {
    heightBeforeOlder.current = boardEl.current?.scrollHeight ?? null
    load(posts[posts.length - 1]?.id)
  }

  useEffect(() => {
    if (!BOARD_API || !widgetEl.current) return
    let cancelled = false
    loadTurnstile()
      .then(() => {
        if (cancelled || !widgetEl.current || !window.turnstile) return
        widgetId.current = window.turnstile.render(widgetEl.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'dark',
          callback: (t: string) => setToken(t),
          'expired-callback': () => setToken(null),
          'error-callback': () => setToken(null),
        })
      })
      .catch(() => setError('Could not load the bot check. Reload the page to try again.'))
    return () => {
      cancelled = true
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current)
      widgetId.current = null
    }
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || sending) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`${BOARD_API}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message, token, color, icon }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Could not post. Try again.')
      } else {
        stickToBottom.current = true
        setPosts(p => [data.post, ...p])
        setMessage('')
      }
    } catch {
      setError('Could not reach the board. Check your connection and try again.')
    } finally {
      // Each Turnstile token works once; get a fresh one for the next post
      setToken(null)
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current)
      setSending(false)
    }
  }

  const remove = async (id: number) => {
    let t = ''
    try {
      t = sessionStorage.getItem('board-admin') ?? ''
    } catch { /* storage blocked */ }
    if (!t) {
      t = window.prompt('Admin token') ?? ''
      if (!t) return
      try {
        sessionStorage.setItem('board-admin', t)
      } catch { /* storage blocked */ }
    }
    const res = await fetch(`${BOARD_API}/posts/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${t}` },
    })
    if (res.ok) setPosts(p => p.filter(x => x.id !== id))
    else {
      try {
        sessionStorage.removeItem('board-admin')
      } catch { /* storage blocked */ }
      window.alert('Delete failed: wrong admin token?')
    }
  }

  const inputStyle = {
    background: 'var(--void)',
    border: '1px solid var(--iron)',
    color: 'var(--bone)',
  } as const

  return (
    <div style={{ paddingTop: 'var(--nav-h, 56px)' }}>
      <div className="max-w-2xl mx-auto px-5 py-10">
        <h1 className="display" style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', color: 'var(--bone)' }}>
          Community
        </h1>
        <div className="mt-2 mb-8 flex flex-wrap items-center gap-x-3 gap-y-2">
          <p style={{ color: 'var(--ash)', maxWidth: '52ch' }}>
            Leave a message for the bands and everyone else here. Posts show up right away.
          </p>

          {/* House rules: a little tag that pops open on hover, focus or tap */}
          <div className="group relative">
            <button
              type="button"
              aria-describedby="house-rules"
              className="label px-2.5 py-1 rounded-full transition-transform duration-200 group-hover:-rotate-3 group-focus-within:-rotate-3"
              style={{ border: '1px dashed var(--bone)', color: 'var(--bone)' }}
            >
              ✦ house rules
            </button>
            <div
              id="house-rules"
              role="tooltip"
              className="absolute left-0 top-full mt-2 z-20 w-72 p-4 rounded-2xl -rotate-1 invisible opacity-0 translate-y-1 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0"
              style={{
                background: '#0b0b0b',
                border: '1px dashed var(--bone)',
                boxShadow: '4px 4px 0 var(--iron)',
              }}
            >
              <p className="mb-2" style={{ color: 'var(--bone)', fontWeight: 600 }}>
                be nice or be bounced ✦
              </p>
              <ul className="space-y-1.5" style={{ color: 'var(--ash)', fontSize: '0.9rem' }}>
                <li>
                  <span style={{ color: 'var(--bone)' }}>✕</span> no swears or slurs (we see you,
                  sh1t-spellers)
                </li>
                <li>
                  <span style={{ color: 'var(--bone)' }}>✕</span> no links
                </li>
                <li>
                  <span style={{ color: 'var(--bone)' }}>✕</span> no spam: one post every 30 seconds,
                  five an hour
                </li>
                <li>
                  <span style={{ color: 'var(--bone)' }}>♡</span> be sweet to the bands and each other
                </li>
              </ul>
              <p className="mt-2" style={{ color: 'var(--dust)', fontSize: '0.8rem' }}>
                Rule-breakers get blocked automatically or tidied away.
              </p>
            </div>
          </div>
        </div>

        {!BOARD_API ? (
          <p style={{ color: 'var(--dust)' }}>The board is being set up. Check back soon.</p>
        ) : (
          <>
            {/* The board: a scrolling window, oldest at the top, newest at the bottom */}
            <div
              ref={boardEl}
              className="mb-6 overflow-y-auto overscroll-contain rounded-2xl p-2 sm:p-3"
              style={{
                maxHeight: 'min(60vh, 560px)',
                minHeight: 160,
                // Rainbow rim made from the pickable colours, dotted paper inside
                border: '2px solid transparent',
                background: `radial-gradient(circle, #1a1a1a 1px, transparent 1.5px) 0 0 / 18px 18px, linear-gradient(#060606, #060606) padding-box, linear-gradient(120deg, ${COLORS.map(c => c.hex).join(', ')}) border-box`,
              }}
              aria-label="Messages"
            >
              {more && (
                <div className="text-center py-3" style={{ borderBottom: '1px solid var(--iron)' }}>
                  <button
                    type="button"
                    onClick={loadOlder}
                    className="label hover:text-white"
                    style={{ color: 'var(--ash)' }}
                  >
                    Older messages
                  </button>
                </div>
              )}

              {loadError && (
                <p className="p-4" style={{ color: 'var(--dust)' }}>Couldn’t load messages. Reload to try again.</p>
              )}
              {!loadError && posts.length === 0 && (
                <p className="p-4" style={{ color: 'var(--dust)' }}>No messages yet. Be the first.</p>
              )}

              <ul className="space-y-2">
                {[...posts].reverse().map((p, i) => {
                  const hex = colorHex(p.color) ?? '#8a8a8a'
                  const glyph = iconGlyph(p.icon)
                  // Alternate a tiny tilt so the wall looks pinned-up, not printed
                  const tilt = i % 2 ? 'hover:rotate-[0.6deg]' : 'hover:-rotate-[0.6deg]'
                  return (
                    <li
                      key={p.id}
                      className={`group/msg flex gap-3 rounded-xl px-3 py-2.5 transition-transform duration-200 hover:-translate-y-0.5 ${tilt} motion-reduce:transform-none`}
                      style={{
                        background: `${hex}14`,
                        borderLeft: `3px solid ${hex}`,
                      }}
                    >
                      <span
                        aria-hidden
                        className="shrink-0 flex items-center justify-center rounded-full transition-transform duration-300 group-hover/msg:rotate-[20deg] group-hover/msg:scale-125 motion-reduce:transform-none"
                        style={{
                          width: 30,
                          height: 30,
                          background: hex,
                          color: '#000',
                          fontSize: '1rem',
                          lineHeight: 1,
                        }}
                      >
                        {glyph ?? p.name.trim().charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-baseline gap-2">
                          <span className="font-semibold" style={{ color: hex }}>{p.name}</span>
                          <span
                            className="label opacity-60 transition-opacity group-hover/msg:opacity-100"
                            style={{ color: 'var(--dust)' }}
                          >
                            {timeAgo(p.created_at)}
                          </span>
                          {admin && (
                            <button
                              type="button"
                              onClick={() => remove(p.id)}
                              className="label ml-auto hover:text-white"
                              style={{ color: '#ff6b6b' }}
                            >
                              Delete
                            </button>
                          )}
                        </p>
                        <p
                          className="mt-0.5 whitespace-pre-wrap break-words"
                          style={{ color: 'var(--bone)', lineHeight: 1.55 }}
                        >
                          {p.message}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>

            <form onSubmit={submit} className="space-y-3">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={MAX_NAME}
                placeholder="Your name"
                aria-label="Your name"
                required
                className="w-full px-3 py-2 outline-none focus:border-white"
                style={inputStyle}
              />
              <div>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  maxLength={MAX_MESSAGE}
                  placeholder="Say something"
                  aria-label="Message"
                  required
                  rows={4}
                  className="w-full px-3 py-2 outline-none focus:border-white resize-y"
                  style={inputStyle}
                />
                <p className="label text-right" style={{ color: 'var(--dust)' }}>
                  {message.length}/{MAX_MESSAGE}
                </p>
              </div>
              {/* Optional flair */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex items-center gap-2" role="radiogroup" aria-label="Colour (optional)">
                  <span className="label" style={{ color: 'var(--dust)' }}>colour</span>
                  {COLORS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      role="radio"
                      aria-checked={color === c.id}
                      aria-label={c.label}
                      title={c.label}
                      onClick={() => setColor(color === c.id ? null : c.id)}
                      className="rounded-full transition-transform duration-150 hover:scale-125"
                      style={{
                        width: 20,
                        height: 20,
                        background: c.hex,
                        outline: color === c.id ? `2px solid ${c.hex}` : 'none',
                        outlineOffset: 2,
                        transform: color === c.id ? 'scale(1.15)' : undefined,
                      }}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-1" role="radiogroup" aria-label="Icon (optional)">
                  <span className="label mr-1" style={{ color: 'var(--dust)' }}>icon</span>
                  {ICONS.map(ic => (
                    <button
                      key={ic.id}
                      type="button"
                      role="radio"
                      aria-checked={icon === ic.id}
                      aria-label={ic.label}
                      title={ic.label}
                      onClick={() => setIcon(icon === ic.id ? null : ic.id)}
                      className="flex items-center justify-center rounded-full transition-transform duration-150 hover:scale-125 hover:-rotate-12"
                      style={{
                        width: 28,
                        height: 28,
                        fontSize: '0.95rem',
                        lineHeight: 1,
                        background: icon === ic.id ? colorHex(color) ?? 'var(--bone)' : 'transparent',
                        color: icon === ic.id ? '#000' : 'var(--ash)',
                        border: '1px solid var(--iron)',
                      }}
                    >
                      {ic.glyph}
                    </button>
                  ))}
                </div>
              </div>

              <div ref={widgetEl} />
              {error && (
                <p role="alert" style={{ color: '#ff6b6b', fontSize: '0.9rem' }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={!token || sending || !name.trim() || !message.trim()}
                className="label px-5 py-2.5 transition-opacity disabled:opacity-40"
                style={{ background: 'var(--bone)', color: '#000' }}
              >
                {sending ? 'Posting…' : 'Post message'}
              </button>
            </form>
          </>
        )}

        {/* Credit where the idea came from */}
        <p className="mt-10 label" style={{ color: 'var(--dust)' }}>
          board idea lovingly borrowed from{' '}
          <a
            href="https://theasheleycatacombs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-white"
            style={{ color: 'var(--ash)' }}
          >
            theasheleycatacombs.com
          </a>
        </p>
      </div>
    </div>
  )
}
