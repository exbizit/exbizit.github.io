import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Nav from './components/Nav'
import MusicPlayer from './components/MusicPlayer'
import { MusicProvider } from './components/MusicContext'
import BandPage from './pages/BandPage'
import Shows from './pages/Shows'
import Listening from './pages/Listening'
import Contact from './pages/Contact'
import Community from './pages/Community'
import { ROOT_BAND_SLUG } from './data/bands'
import { LayoutProvider, useLayout } from './layout'

// The alternate desktop layout, fetched only when someone switches to it
const OSApp = lazy(() => import('./os/OSApp'))

export default function App() {
  return (
    <BrowserRouter>
      <LayoutProvider>
        <Layouts />
      </LayoutProvider>
    </BrowserRouter>
  )
}

function Layouts() {
  const { layout } = useLayout()
  if (layout === 'os') {
    return (
      <Suspense fallback={<BootScreen />}>
        <OSApp />
      </Suspense>
    )
  }
  return <PrimaryLayout />
}

function BootScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#03040b' }}>
      <p style={{ fontFamily: "'VT323', monospace", fontSize: 22, color: '#9aa8ff', textShadow: '0 0 8px rgba(122,138,255,0.8)' }}>
        local hoster os · booting…
      </p>
    </div>
  )
}

/** The site's main design: nav across the top, one page at a time. */
function PrimaryLayout() {
  return (
      <MusicProvider>
      <Nav />
      <main>
        <Routes>
          {/* hoster.band IS the domain, so Hoster is the root page. */}
          <Route path="/" element={<BandPage defaultSlug={ROOT_BAND_SLUG} />} />

          {/* Static routes are declared before /:slug. React Router ranks static
              segments above dynamic ones, so these win even though a band slug
              could otherwise match them. */}
          <Route path="/shows" element={<Shows />} />
          <Route path="/listening" element={<Listening />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/community" element={<Community />} />

          {/* The desktop layout's wallpaper picker has no page here */}
          <Route path="/wallpaper" element={<Navigate to="/" replace />} />

          {/* One canonical URL per band: /hoster folds into / */}
          <Route path={`/${ROOT_BAND_SLUG}`} element={<Navigate to="/" replace />} />

          {/* hoster.band/maryswhitelie etc. An unknown slug renders BandPage's
              not-found state, which doubles as the site's 404. */}
          <Route path="/:slug" element={<BandPage />} />
        </Routes>
      </main>
      {/* Outside the routes, so music keeps playing across pages */}
      <MusicPlayer />
      </MusicProvider>
  )
}
