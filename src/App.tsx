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

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}
