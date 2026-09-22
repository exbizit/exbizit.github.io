import { useEffect, useRef, useState } from 'react'
import { CubefieldGame, type CubefieldCover, type CubefieldState } from '../lib/cubefield/CubefieldGame'
import { BOARD_API, MAX_NAME } from '../data/board'

const BEST_KEY = 'cubefield-best-seconds'
const CHARACTER_KEY = 'cubefield-character'

interface CrashInfo {
  seconds: number
  artist: string
  album: string
  track?: string
  previewUrl?: string | null
}

export interface CubefieldCharacter {
  slug: string
  name: string
  logo: string
}

function readBest(): number {
  try {
    return Number(localStorage.getItem(BEST_KEY) ?? 0) || 0
  } catch {
    return 0
  }
}

function writeBest(seconds: number) {
  try {
    localStorage.setItem(BEST_KEY, String(seconds))
  } catch {
    /* storage blocked */
  }
}

function readCharacter(): string | null {
  try {
    return localStorage.getItem(CHARACTER_KEY)
  } catch {
    return null
  }
}

function writeCharacter(slug: string | null) {
  try {
    if (slug) localStorage.setItem(CHARACTER_KEY, slug)
    else localStorage.removeItem(CHARACTER_KEY)
  } catch {
    /* storage blocked */
  }
}

const isTouchDevice =
  typeof window !== 'undefined' && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window)

export default function Cubefield({
  covers,
  characters,
}: {
  covers: CubefieldCover[]
  characters: CubefieldCharacter[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const gameRef = useRef<CubefieldGame | null>(null)
  const [state, setState] = useState<CubefieldState>('idle')
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(readBest)
  const [crash, setCrash] = useState<CrashInfo | null>(null)
  const [tiltActive, setTiltActive] = useState(false)
  const [characterSlug, setCharacterSlug] = useState<string | null>(readCharacter)

  // Leaderboard save (display + admin moderation live in Listening.tsx, next
  // to the Grid button, so they're not gated behind actually playing a round)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Every preview clip comes off the same CDN host — warm up its DNS/TLS
  // connection as soon as Cubefield mounts, so the only latency left at
  // crash time is the actual clip download, not the handshake in front of it.
  useEffect(() => {
    const hosts = new Set(
      covers
        .map(c => c.previewUrl)
        .filter((u): u is string => Boolean(u))
        .map(u => {
          try {
            return new URL(u).origin
          } catch {
            return null
          }
        })
        .filter((u): u is string => Boolean(u))
    )
    const links: HTMLLinkElement[] = []
    for (const origin of hosts) {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = origin
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
      links.push(link)
    }
    return () => {
      for (const link of links) link.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Quietly warm the HTTP cache for every preview clip, one at a time, in
  // the background. A run only lasts a few seconds, so this won't finish
  // before most first crashes — but it keeps working across "Play again"s,
  // so the longer a session runs, the more crashes hit an already-cached
  // clip and start with no fetch at all, not just a warm connection.
  useEffect(() => {
    let cancelled = false
    const urls = [...new Set(covers.map(c => c.previewUrl).filter((u): u is string => Boolean(u)))]
    ;(async () => {
      for (const url of urls) {
        if (cancelled) return
        try {
          await fetch(url, { mode: 'no-cors' })
        } catch {
          /* best effort — a miss here just means that crash fetches live */
        }
        await new Promise(r => setTimeout(r, 120))
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!containerRef.current || covers.length === 0) return
    const game = new CubefieldGame(containerRef.current, covers, {
      onScore: setScore,
      onStateChange: setState,
      onGameOver: info => {
        setCrash(info)
        setSaved(false)
        setSaveError(null)
        setBest(prev => {
          if (info.seconds <= prev) return prev
          writeBest(info.seconds)
          return info.seconds
        })
        const audio = audioRef.current
        if (audio && info.previewUrl) {
          audio.src = info.previewUrl
          audio.currentTime = 0
          audio.play().catch(() => {})
        }
      },
    })
    gameRef.current = game
    const initial = characters.find(c => c.slug === characterSlug)
    if (initial) game.setPlayerLogo(initial.logo)
    return () => {
      gameRef.current = null
      game.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pickCharacter = (slug: string | null) => {
    setCharacterSlug(slug)
    writeCharacter(slug)
    const logo = characters.find(c => c.slug === slug)?.logo ?? null
    gameRef.current?.setPlayerLogo(logo)
  }

  const startRun = async () => {
    const game = gameRef.current
    if (!game) return
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
    }
    // Must fire from inside this tap — iOS only grants motion access when
    // requestPermission() runs synchronously off a user gesture, so this has
    // to happen before start(), not after.
    if (isTouchDevice && !tiltActive) {
      const granted = await game.enableTilt()
      if (granted) setTiltActive(true)
    }
    game.start()
  }

  const submitScore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!BOARD_API || !crash || saving) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch(`${BOARD_API}/cubefield/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, seconds: crash.seconds }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSaveError(data.error ?? 'Could not save. Try again.')
      } else {
        setSaved(true)
      }
    } catch {
      setSaveError('Could not reach the leaderboard. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="relative w-full select-none"
      style={{
        height: 'calc(100vh - var(--nav-h, 56px) - 230px)',
        minHeight: '420px',
        maxHeight: '900px',
        background: '#000',
        border: '1px solid var(--iron)',
      }}
    >
      <div ref={containerRef} className="absolute inset-0" />
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} preload="auto" />

      {state === 'playing' && (
        <div className="absolute top-2 left-2 label" style={{ color: 'var(--bone)' }}>
          {score.toFixed(1)}s
          {best > 0 && <span style={{ color: 'var(--dust)' }}> · best {best.toFixed(1)}s</span>}
          {tiltActive && <span style={{ color: 'var(--dust)' }}> · tilt steering</span>}
        </div>
      )}

      {state !== 'playing' && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-6 py-4 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.35)' }}
        >
          {/* A dedicated backdrop for the text — the dim overlay alone let a
              bright patch of album art behind it wash the words out. */}
          <div
            className="flex flex-col items-center gap-2.5 px-6 py-5 text-center rounded-2xl"
            style={{
              background: 'rgba(0,0,0,0.8)',
              border: '1px solid var(--iron)',
              backdropFilter: 'blur(3px)',
            }}
          >
            {crash ? (
              <>
                <p className="display" style={{ color: 'var(--bone)', fontSize: 'clamp(1.1rem, 3vw, 1.6rem)' }}>
                  Crashed into {crash.album}
                </p>
                <p style={{ color: 'var(--ash)' }}>
                  {crash.artist} · survived {crash.seconds.toFixed(1)}s
                </p>
                {crash.previewUrl && (
                  <p className="label" style={{ color: 'var(--dust)' }}>
                    ♫ now previewing {crash.track ?? crash.album}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="display" style={{ color: 'var(--bone)', fontSize: 'clamp(1.3rem, 4vw, 1.9rem)' }}>
                  CUBEFIELD
                </p>
                <p style={{ color: 'var(--ash)', maxWidth: '34ch' }}>
                  Dodge the album covers.{' '}
                  {isTouchDevice
                    ? "Tilt your phone left/right to steer (tap either side instead if you'd rather not, or say no to the motion prompt)."
                    : '← → or A / D to steer.'}
                </p>
                <p className="label" style={{ color: 'var(--dust)', maxWidth: '34ch' }}>
                  bigger cubes = more +1s on the Grid view — everyone's votes shape this run
                </p>
              </>
            )}
            {best > 0 && (
              <p className="label" style={{ color: 'var(--dust)' }}>
                best: {best.toFixed(1)}s
              </p>
            )}

            {characters.length > 0 && (
              <div>
                <p className="label mb-1.5" style={{ color: 'var(--dust)' }}>
                  play as
                </p>
                <div className="flex items-center justify-center gap-2" role="radiogroup" aria-label="Character">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={characterSlug === null}
                    aria-label="Default ship"
                    title="Default ship"
                    onClick={() => pickCharacter(null)}
                    className="flex items-center justify-center rounded-full transition-transform duration-150 hover:scale-110"
                    style={{
                      width: 34,
                      height: 34,
                      background: characterSlug === null ? 'var(--bone)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${characterSlug === null ? 'var(--bone)' : 'var(--iron)'}`,
                      color: characterSlug === null ? '#000' : 'var(--ash)',
                      fontSize: '1rem',
                    }}
                  >
                    ▲
                  </button>
                  {characters.map(c => (
                    <button
                      key={c.slug}
                      type="button"
                      role="radio"
                      aria-checked={characterSlug === c.slug}
                      aria-label={c.name}
                      title={c.name}
                      onClick={() => pickCharacter(c.slug)}
                      className="flex items-center justify-center rounded-full overflow-hidden transition-transform duration-150 hover:scale-110"
                      style={{
                        width: 34,
                        height: 34,
                        background: 'var(--void)',
                        border: `1px solid ${characterSlug === c.slug ? 'var(--bone)' : 'var(--iron)'}`,
                        outline: characterSlug === c.slug ? '2px solid var(--bone)' : 'none',
                        outlineOffset: 1,
                      }}
                    >
                      <img src={c.logo} alt="" aria-hidden className="w-full h-full object-contain p-1" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {crash && BOARD_API && (
              <>
                {saved ? (
                  <p className="label" style={{ color: 'var(--bone)' }}>
                    saved to the leaderboard ✦
                  </p>
                ) : (
                  <form onSubmit={submitScore} className="flex items-center gap-1.5">
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      maxLength={MAX_NAME}
                      placeholder="Name for the leaderboard"
                      aria-label="Name for the leaderboard"
                      className="px-2.5 py-1.5 text-sm outline-none focus:border-white"
                      style={{
                        background: 'var(--void)',
                        border: '1px solid var(--iron)',
                        color: 'var(--bone)',
                        width: '11rem',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={saving || !name.trim()}
                      className="label px-3 py-1.5 transition-opacity disabled:opacity-40"
                      style={{ background: 'var(--iron)', color: 'var(--bone)' }}
                    >
                      {saving ? '…' : 'Save'}
                    </button>
                  </form>
                )}
                {saveError && (
                  <p role="alert" style={{ color: '#ff6b6b', fontSize: '0.8rem' }}>
                    {saveError}
                  </p>
                )}
              </>
            )}

            <button
              type="button"
              onClick={startRun}
              className="label px-5 py-2.5 transition-transform duration-150 hover:scale-105"
              style={{ background: 'var(--bone)', color: '#000' }}
            >
              {crash ? 'Play again' : 'Start'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
