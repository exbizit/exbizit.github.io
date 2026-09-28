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
