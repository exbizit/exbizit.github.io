/**
 * One music source at a time.
 *
 * Bandcamp's embed has no JavaScript API, so nothing on the page can tell when
 * it starts playing. What we *can* see is which embedded player the visitor
 * clicked into: the page's `document.activeElement` becomes that <iframe>.
 * Clicking into a registered player counts as "this one has the audio now",
 * and every other registered player is told to stop.
 *
 * Players register an element plus a `stop()` that suits them: unmount (the
 * floating player), a pause message (YouTube), or reload the frame (Spotify,
 * which otherwise can't be paused from outside without its own API).
 */
type Entry = { el: HTMLIFrameElement; stop: () => void; activate?: () => void }

const entries = new Set<Entry>()
let lastActive: Element | null = null
let timer: number | undefined

function check() {
  const active = document.activeElement
  if (active === lastActive) return
  lastActive = active
  if (!(active instanceof HTMLIFrameElement)) return
  const owner = [...entries].find(e => e.el === active)
  if (!owner) return
  for (const e of [...entries]) if (e !== owner) e.stop()
  owner.activate?.()
}

// Clicking into the first iframe blurs the window; moving between iframes
// doesn't fire anything, so a light poll covers that case.
const onBlur = () => setTimeout(check, 0)

export function registerAudio(
  el: HTMLIFrameElement,
  stop: () => void,
  activate?: () => void
): () => void {
  const entry = { el, stop, activate }
  entries.add(entry)
  if (entries.size === 1) {
    window.addEventListener('blur', onBlur)
    timer = window.setInterval(check, 400)
  }
  return () => {
    entries.delete(entry)
    if (entries.size === 0) {
      window.removeEventListener('blur', onBlur)
      window.clearInterval(timer)
      lastActive = null
    }
  }
}

/** Stops any player by reloading its frame (loses position; always works). */
export function reloadFrame(el: HTMLIFrameElement) {
  const src = el.src
  el.src = 'about:blank'
  requestAnimationFrame(() => {
    el.src = src
  })
}

/** Pauses a YouTube embed that was loaded with `enablejsapi=1`. */
export function pauseYouTube(el: HTMLIFrameElement) {
  el.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }), '*')
}
