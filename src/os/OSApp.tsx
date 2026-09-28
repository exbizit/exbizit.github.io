import { useEffect } from 'react'
import { WindowManager } from './WindowManager'
import { AmpProvider } from './HosterAmp'
import { WallpaperProvider } from './wallpaper'
import Desktop from './Desktop'

/**
 * The alternate layout: the site as a desktop. Every page opens as a window
 * (apps.tsx maps URLs to windows) and HosterAmp sits above them all.
 * Loaded on demand, so the primary layout never downloads any of it.
 */
export default function OSApp() {
  // The desktop fills the screen and scrolls inside its windows
  useEffect(() => {
    document.documentElement.classList.add('os-mode')
    return () => document.documentElement.classList.remove('os-mode')
  }, [])

  // The desktop's data face; the primary layout never needs it
  useEffect(() => {
    const id = 'os-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap'
    document.head.appendChild(link)
  }, [])

  return (
    <WindowManager>
      <AmpProvider>
        <WallpaperProvider>
          <Desktop />
        </WallpaperProvider>
      </AmpProvider>
    </WindowManager>
  )
}
