import { BrowserRouter } from 'react-router-dom'
import { WindowManager } from './os/WindowManager'
import { AmpProvider } from './os/HosterAmp'
import Desktop from './os/Desktop'
import { WallpaperProvider } from './os/wallpaper'

/**
 * The site is a desktop: every page opens as a window (os/apps.tsx maps URLs
 * to windows), and HosterAmp sits above them all, so music keeps playing
 * whatever's opened or closed.
 */
export default function App() {
  return (
    <BrowserRouter>
      <WindowManager>
        <AmpProvider>
          <WallpaperProvider>
            <Desktop />
          </WallpaperProvider>
        </AmpProvider>
      </WindowManager>
    </BrowserRouter>
  )
}
