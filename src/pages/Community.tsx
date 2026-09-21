import { useCallback, useEffect, useRef, useState } from 'react'
import { BOARD_API, TURNSTILE_SITE_KEY, MAX_NAME, MAX_MESSAGE, type BoardPost } from '../data/board'
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
  const [token, setToken] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Admin mode: visit /community?admin to get delete buttons (asks for the token)
  const admin = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('admin')

  const widgetEl = useRef<HTMLDivElement>(null)
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
        body: JSON.stringify({ name, message, token }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Could not post. Try again.')
      } else {
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
        <p className="mt-2 mb-5" style={{ color: 'var(--ash)', maxWidth: '52ch' }}>
          Leave a message for the bands and everyone else here. Posts show up right away.
        </p>

        <section
          aria-labelledby="guidelines"
          className="mb-8 p-4"
          style={{ border: '1px solid var(--iron)', borderLeft: '3px solid var(--bone)' }}
        >
          <h2 id="guidelines" className="label mb-2" style={{ color: 'var(--bone)' }}>
            Community guidelines
          </h2>
          <ul className="space-y-1" style={{ color: 'var(--ash)', fontSize: '0.95rem' }}>
            <li>No obscenities or slurs, including disguised spellings.</li>
            <li>No links.</li>
            <li>No spam: posting is limited to one message every 30 seconds and five an hour.</li>
            <li>Be kind to the bands and to each other.</li>
          </ul>
          <p className="mt-2" style={{ color: 'var(--dust)', fontSize: '0.85rem' }}>
            Messages that break these are blocked automatically or removed.
          </p>
        </section>

        {!BOARD_API ? (
          <p style={{ color: 'var(--dust)' }}>The board is being set up. Check back soon.</p>
        ) : (
          <>
            <form onSubmit={submit} className="space-y-3 mb-10">
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

            {loadError && (
              <p style={{ color: 'var(--dust)' }}>Couldn’t load messages. Reload to try again.</p>
            )}
            {!loadError && posts.length === 0 && (
              <p style={{ color: 'var(--dust)' }}>No messages yet. Be the first.</p>
            )}

            <ul style={{ borderTop: '1px solid var(--iron)' }}>
              {posts.map(p => (
                <li key={p.id} className="py-4" style={{ borderBottom: '1px solid var(--iron)' }}>
                  <p className="flex items-baseline gap-2">
                    <span className="font-semibold" style={{ color: 'var(--bone)' }}>{p.name}</span>
                    <span className="label" style={{ color: 'var(--dust)' }}>{timeAgo(p.created_at)}</span>
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
                  <p className="mt-1 whitespace-pre-wrap break-words" style={{ color: 'var(--ash)', lineHeight: 1.6 }}>
                    {p.message}
                  </p>
                </li>
              ))}
            </ul>

            {more && (
              <button
                type="button"
                onClick={() => load(posts[posts.length - 1]?.id)}
                className="label mt-6 hover:text-white"
                style={{ color: 'var(--ash)' }}
              >
                Older messages
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
