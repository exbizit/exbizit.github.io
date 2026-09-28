/**
 * HosterAmp: the desktop's music player. It's Webamp (github.com/captbaritone/webamp,
 * MIT), Jordan Eldredge's faithful Winamp 2 port, wearing our own skin
 * (public/skins/hosteramp.wsz, built by scripts/skin/build-skin.py) and loaded
 * with every band's catalogue (src/data/amp.ts).
 *
 * Webamp is ~900KB, so it's only fetched the first time someone opens the
 * player. Minimising it tucks it into the taskbar tray without stopping the
 * music; closing it stops.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type WebampType from 'webamp'
import { allTracks, bandTracks } from '../data/amp'
import { getBandBySlug } from '../data/bands'
import { registerPlayer } from '../lib/audioFocus'
import { desktopSize } from './WindowManager'

const SKIN = '/skins/hosteramp.wsz'

type Status = 'off' | 'loading' | 'open' | 'hidden'

interface Amp {
  status: Status
  playing: boolean
  nowPlaying: string | null
  /** Open, or bring back from the tray */
  show: () => void
  hide: () => void
  playBand: (slug: string) => void
}

const AmpCtx = createContext<Amp | null>(null)
export function useAmp() {
  const ctx = useContext(AmpCtx)
  if (!ctx) throw new Error('useAmp outside AmpProvider')
  return ctx
}

function layout() {
  const { W, H } = desktopSize()
  const mobile = W < 768
  const left = mobile ? Math.max(0, Math.round((W - 275) / 2)) : W - 275 - 18
  const top = mobile ? 8 : Math.max(8, H - 116 * 2 - 232 - 18)
  return {
    main: { position: { top, left } },
    equalizer: { position: { top: top + 116, left }, closed: mobile },
    playlist: { position: { top: top + (mobile ? 116 : 232), left }, closed: false },
  }
}

export function AmpProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('off')
  const [playing, setPlaying] = useState(false)
  const [nowPlaying, setNowPlaying] = useState<string | null>(null)
  const host = useRef<HTMLDivElement>(null)
  const amp = useRef<WebampType | null>(null)
  const booting = useRef<Promise<WebampType> | null>(null)
  const focus = useRef<ReturnType<typeof registerPlayer> | null>(null)

  const boot = useCallback((firstSlug?: string) => {
    if (booting.current) return booting.current
    setStatus('loading')
    booting.current = (async () => {
      const { default: Webamp } = await import('webamp')
      const wa = new Webamp({
        initialSkin: { url: SKIN },
        initialTracks: allTracks(firstSlug),
        windowLayout: layout(),
        enableHotkeys: false,
      })
      // Webamp centres its windows unless their positions are absolute; dock
      // it to the desktop's right edge instead
      const l = layout()
      wa.store.dispatch({
        type: 'UPDATE_WINDOW_POSITIONS',
        absolute: true,
        positions: {
          main: { x: l.main.position.left, y: l.main.position.top },
          equalizer: { x: l.equalizer.position.left, y: l.equalizer.position.top },
          playlist: { x: l.playlist.position.left, y: l.playlist.position.top },
        },
      } as never)
      focus.current = registerPlayer(() => wa.pause())
      wa.onTrackDidChange(t =>
        setNowPlaying(t ? [t.metaData.artist, t.metaData.title].filter(Boolean).join(' — ') : null)
      )
      let was = false
      wa.store.subscribe(() => {
        const now = wa.getMediaStatus() === 'PLAYING'
        if (now !== was) {
          was = now
          setPlaying(now)
          if (now) focus.current?.claim()
        }
      })
      wa.onMinimize(() => setStatus('hidden'))
      wa.onClose(() => {
        setStatus('off')
        setPlaying(false)
      })
      await wa.renderInto(host.current!)
      amp.current = wa
      setStatus('open')
      return wa
    })()
    return booting.current
  }, [])

  useEffect(() => () => focus.current?.dispose(), [])

  const value = useMemo<Amp>(
    () => ({
      status,
      playing,
      nowPlaying,
      show: () => {
        const wa = amp.current
        if (!wa) {
          boot()
          return
        }
        if (status === 'off') wa.reopen()
        setStatus('open')
      },
      hide: () => setStatus('hidden'),
      playBand: async slug => {
        const band = getBandBySlug(slug)
        if (!band) return
        const wasClosed = Boolean(amp.current) && status === 'off'
        const wa = await boot(slug)
        if (wasClosed) wa.reopen()
        wa.setTracksToPlay(bandTracks(band))
        setStatus('open')
      },
    }),
    [status, playing, nowPlaying, boot]
  )

  return (
    <AmpCtx.Provider value={value}>
      {children}
      <div
        ref={host}
        className="os-amp-layer"
        aria-label="HosterAmp"
        style={{ visibility: status === 'hidden' || status === 'off' ? 'hidden' : 'visible' }}
      />
    </AmpCtx.Provider>
  )
}
