import { useEffect, useRef, useState } from 'react'
import { CubefieldGame, type CubefieldCover, type CubefieldState } from '../lib/cubefield/CubefieldGame'
import { BOARD_API, MAX_NAME } from '../data/board'

const BEST_KEY = 'cubefield-best-seconds'

interface CrashInfo {
  seconds: number
  artist: string
  album: string
  track?: string
  previewUrl?: string | null
}

interface Score {
  id: number
  name: string
  seconds: number
  created_at: number
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

const isTouchDevice =
  typeof window !== 'undefined' && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window)

export default function Cubefield({ covers }: { covers: CubefieldCover[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const gameRef = useRef<CubefieldGame | null>(null)
  const [state, setState] = useState<CubefieldState>('idle')
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(readBest)
  const [crash, setCrash] = useState<CrashInfo | null>(null)
  const [tiltActive, setTiltActive] = useState(false)

  // Leaderboard
  const [scores, setScores] = useState<Score[]>([])
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const admin = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('admin')

  const loadScores = () => {
    if (!BOARD_API) return
    fetch(`${BOARD_API}/cubefield/scores`)
      .then(res => res.json())
      .then(data => setScores(data.scores ?? []))
      .catch(() => {})
  }

  useEffect(loadScores, [])

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
        // A short gap so the crash sound (fired the instant you hit) isn't
        // stepped on by the preview clip coming in on top of it.
        const audio = audioRef.current
        if (audio && info.previewUrl) {
          window.setTimeout(() => {
            audio.src = info.previewUrl as string
            audio.currentTime = 0
            audio.play().catch(() => {})
          }, 280)
        }
      },
    })
    gameRef.current = game
    return () => {
      gameRef.current = null
      game.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        loadScores()
      }
    } catch {
      setSaveError('Could not reach the leaderboard. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  const removeScore = async (id: number) => {
    if (!BOARD_API) return
    let t = ''
    try {
      t = sessionStorage.getItem('board-admin') ?? ''
    } catch {
      /* storage blocked */
    }
    if (!t) {
      t = window.prompt('Admin token') ?? ''
      if (!t) return
      try {
        sessionStorage.setItem('board-admin', t)
      } catch {
        /* storage blocked */
      }
    }
    const res = await fetch(`${BOARD_API}/cubefield/scores/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${t}` },
    })
    if (res.ok) setScores(s => s.filter(x => x.id !== id))
    else {
      try {
        sessionStorage.removeItem('board-admin')
      } catch {
        /* storage blocked */
      }
      window.alert('Delete failed: wrong admin token?')
    }
  }

  return (
    <div>
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
        <audio ref={audioRef} />

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

      {BOARD_API && scores.length > 0 && (
        <div className="mt-3">
          <p className="label mb-1.5" style={{ color: 'var(--dust)' }}>
            leaderboard
          </p>
          <ol className="space-y-0.5">
            {scores.map((s, i) => (
              <li
                key={s.id}
                className="flex items-baseline gap-2"
                style={{ color: i === 0 ? 'var(--bone)' : 'var(--ash)', fontSize: '0.9rem' }}
              >
                <span className="label" style={{ color: 'var(--dust)', width: '1.4rem' }}>
                  {i + 1}
                </span>
                <span className="truncate" style={{ maxWidth: '16rem' }}>
                  {s.name}
                </span>
                <span style={{ color: 'var(--dust)' }}>{s.seconds.toFixed(1)}s</span>
                {admin && (
                  <button
                    type="button"
                    onClick={() => removeScore(s.id)}
                    className="label ml-auto hover:text-white"
                    style={{ color: '#ff6b6b' }}
                  >
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
