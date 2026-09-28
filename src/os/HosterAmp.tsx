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
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type WebampType from 'webamp'
import { allTracks, bandTracks } from '../data/amp'
import { BANDS, getBandBySlug } from '../data/bands'
import { BandIcon } from './icons'
import { registerPlayer } from '../lib/audioFocus'
import { desktopSize } from './WindowManager'
import { AmpCtx, type Amp, type AmpStatus as Status } from './ampContext'

export { useAmp } from './ampContext'

const SKIN = '/skins/hosteramp.wsz'

/** A fresh random order every time a playlist is loaded (Fisher–Yates) */
function shuffled<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
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

/** 'all', or a band slug */
type ListKey = string

const tracksFor = (key: ListKey) => {
  const band = key === 'all' ? undefined : getBandBySlug(key)
  return shuffled(band ? bandTracks(band) : allTracks())
}

const DECK_BANDS = BANDS.filter(b => bandTracks(b).length > 0)
const DECK_H = 30

export function AmpProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('off')
  const [list, setList] = useState<ListKey>('all')
  const [deckAt, setDeckAt] = useState<{ left: number; top: number } | null>(null)
  const [playing, setPlaying] = useState(false)
  const [nowPlaying, setNowPlaying] = useState<string | null>(null)
  const host = useRef<HTMLDivElement>(null)
  const amp = useRef<WebampType | null>(null)
  const booting = useRef<Promise<WebampType> | null>(null)
  const focus = useRef<ReturnType<typeof registerPlayer> | null>(null)

  // Keep the playlist deck docked to the main window as it's dragged about:
  // above it when there's room, otherwise under the lowest Webamp window
  const frame = useRef(0)
  const placeDeck = useCallback(() => {
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      const root = host.current
      const main = root?.querySelector<HTMLElement>('#main-window')
      if (!root || !main) return setDeckAt(null)
      const origin = root.getBoundingClientRect()
      const m = main.getBoundingClientRect()
      const left = Math.round(m.left - origin.left)
      const above = m.top - origin.top - DECK_H - 3
      if (above >= 0) return setDeckAt({ left, top: Math.round(above) })
      const bottom = Math.max(...[...root.querySelectorAll<HTMLElement>('#webamp .window')].map(w => w.getBoundingClientRect().bottom))
      setDeckAt({ left, top: Math.round(bottom - origin.top + 3) })
    })
  }, [])

  useEffect(() => {
    window.addEventListener('resize', placeDeck)
    return () => window.removeEventListener('resize', placeDeck)
  }, [placeDeck])

  const boot = useCallback((firstList: ListKey = 'all') => {
    if (booting.current) return booting.current
    setStatus('loading')
    setList(firstList)
    booting.current = (async () => {
      const { default: Webamp } = await import('webamp')
      const wa = new Webamp({
        initialSkin: { url: SKIN },
        initialTracks: tracksFor(firstList),
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
      // Shuffle stays on for whatever gets loaded next; the SHUFFLE button turns it off
      if (!wa.isShuffleEnabled()) wa.toggleShuffle()
      focus.current = registerPlayer(() => wa.pause())
      // When a track can't load, Webamp moves straight on to the next; if every
      // track is failing (stream links expired, network down) that becomes a
      // runaway skip through the whole list. Five changes inside four seconds
      // is failure, not someone pressing Next, so stop and say so.
      const changes: number[] = []
      wa.onTrackDidChange(t => {
        const now = Date.now()
        changes.push(now)
        while (changes.length && now - changes[0] > 4000) changes.shift()
        if (changes.length >= 5) {
          changes.length = 0
          wa.pause()
          setNowPlaying('tracks unavailable right now, try again later')
          return
        }
        setNowPlaying(t ? [t.metaData.artist, t.metaData.title].filter(Boolean).join(' — ') : null)
      })
      let was = false
      wa.store.subscribe(() => {
        placeDeck()
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
      placeDeck()
      return wa
    })()
    return booting.current
  }, [placeDeck])

  const playList = useCallback(
    async (key: ListKey) => {
      const wasClosed = Boolean(amp.current) && status === 'off'
      const fresh = !amp.current
      const wa = await boot(key)
      if (wasClosed) wa.reopen()
      // A fresh boot already loaded this list; otherwise swap it in and play
      if (!fresh) wa.setTracksToPlay(tracksFor(key))
      else wa.play()
      setList(key)
      setStatus('open')
      placeDeck()
    },
    [boot, status, placeDeck]
  )

  // Leaving the desktop layout: stop the music and tear Webamp down
  useEffect(
    () => () => {
      focus.current?.dispose()
      amp.current?.dispose()
    },
    []
  )

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
      playBand: slug => {
        if (getBandBySlug(slug)) playList(slug)
      },
    }),
    [status, playing, nowPlaying, boot, playList]
  )

  return (
    <AmpCtx.Provider value={value}>
      {children}
      <div
        className="os-amp-layer"
        aria-label="HosterAmp"
        style={{ visibility: status === 'hidden' || status === 'off' ? 'hidden' : 'visible' }}
      >
        {/* Webamp owns this node's contents, so the deck is its sibling */}
        <div ref={host} className="os-amp-host" />
        {status === 'open' && deckAt && <AmpDeck at={deckAt} list={list} onPick={playList} />}
      </div>
    </AmpCtx.Provider>
  )
}

/** The playlist switcher docked to HosterAmp: every band, or all of them. */
function AmpDeck({ at, list, onPick }: { at: { left: number; top: number }; list: ListKey; onPick: (key: ListKey) => void }) {
  const [hover, setHover] = useState<ListKey | null>(null)
  const shown = hover ?? list
  const band = shown === 'all' ? undefined : getBandBySlug(shown)
  const count = band ? bandTracks(band).length : allTracks().length
  return (
    <div className="amp-deck" style={{ left: at.left, top: at.top, height: DECK_H }} role="toolbar" aria-label="HosterAmp playlists">
      {/* Shown while the pointer is anywhere on the player */}
      <a className="amp-deck-credit" href="https://github.com/captbaritone/webamp" target="_blank" rel="noopener noreferrer">
        runs on webamp by jordan eldredge ↗
      </a>
      <p className="amp-deck-lcd" aria-live="polite">
        {(band?.name ?? 'All bands').toUpperCase()} · {count}
      </p>
      <button
        type="button"
        className={`amp-deck-tab amp-deck-all${list === 'all' ? ' is-on' : ''}`}
        aria-pressed={list === 'all'}
        title="All bands, shuffled"
        onClick={() => onPick('all')}
        onMouseEnter={() => setHover('all')}
        onMouseLeave={() => setHover(null)}
        onFocus={() => setHover('all')}
        onBlur={() => setHover(null)}
      >
        ALL
      </button>
      {DECK_BANDS.map(b => (
        <button
          key={b.slug}
          type="button"
          className={`amp-deck-tab${list === b.slug ? ' is-on' : ''}`}
          style={{ ['--tab-accent' as string]: b.accentColor }}
          aria-pressed={list === b.slug}
          aria-label={`${b.name}, shuffled`}
          title={`${b.name}, shuffled`}
          onClick={() => onPick(b.slug)}
          onMouseEnter={() => setHover(b.slug)}
          onMouseLeave={() => setHover(null)}
          onFocus={() => setHover(b.slug)}
          onBlur={() => setHover(null)}
        >
          <BandIcon logo={b.logo} image={b.heroImage ?? b.photos[0]?.src} />
        </button>
      ))}
    </div>
  )
}
