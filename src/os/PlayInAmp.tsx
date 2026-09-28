import { bandTracks } from '../data/amp'
import { getBandBySlug } from '../data/bands'
import { useAmpIfPresent } from './ampContext'
import { ICONS } from './icons'

/** Loads a band's catalogue into HosterAmp and starts it. Desktop layout only. */
export default function PlayInAmp({ slug }: { slug: string }) {
  const amp = useAmpIfPresent()
  const band = getBandBySlug(slug)
  if (!amp || !band) return null
  const tracks = bandTracks(band)
  if (tracks.length === 0) return null
  const full = tracks.filter(t => !t.metaData.title.endsWith('(preview)')).length

  return (
    <div className="mb-4">
    <button type="button" className="amp-cta" onClick={() => amp.playBand(slug)}>
      <span className="amp-cta-icon" aria-hidden>
        {ICONS.amp()}
      </span>
      <span className="amp-cta-text">
        <span className="amp-cta-main">▶ Play in HosterAmp</span>
        <span className="amp-cta-sub">
          {full > 0 ? `${full} full track${full === 1 ? '' : 's'}` : `${tracks.length} preview${tracks.length === 1 ? '' : 's'}`}
          {full > 0 && tracks.length > full ? ` + ${tracks.length - full} preview${tracks.length - full === 1 ? '' : 's'}` : ''}
        </span>
      </span>
    </button>
    </div>
  )
}
