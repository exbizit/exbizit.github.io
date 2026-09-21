import { useEffect, useRef, type IframeHTMLAttributes } from 'react'
import { registerAudio, reloadFrame, pauseYouTube } from '../lib/audioFocus'

/**
 * An <iframe> for anything that plays sound. Clicking into it stops every
 * other player on the site (see lib/audioFocus.ts); when another player takes
 * over, this one stops itself using `stopWith`.
 */
export default function AudioFrame({
  stopWith = 'reload',
  onStop,
  onActivate,
  ...props
}: IframeHTMLAttributes<HTMLIFrameElement> & {
  stopWith?: 'reload' | 'youtube' | 'custom'
  /** For stopWith="custom" */
  onStop?: () => void
  /** Called when the visitor clicks into this player (it now has the audio) */
  onActivate?: () => void
}) {
  const ref = useRef<HTMLIFrameElement>(null)
  const onStopRef = useRef(onStop)
  onStopRef.current = onStop
  const onActivateRef = useRef(onActivate)
  onActivateRef.current = onActivate

  useEffect(() => {
    const el = ref.current
    if (!el) return
    return registerAudio(el, () => {
      if (stopWith === 'youtube') pauseYouTube(el)
      else if (stopWith === 'custom') onStopRef.current?.()
      else reloadFrame(el)
    }, () => onActivateRef.current?.())
  }, [stopWith])

  return <iframe ref={ref} {...props} />
}
