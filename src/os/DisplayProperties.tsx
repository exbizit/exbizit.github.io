import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { WALL_PHOTOS, WallImage, useWallpaper, type WallEffect, type WallMode } from './wallpaper'

const MODES: { id: WallMode; label: string }[] = [
  { id: 'fill', label: 'Fill' },
  { id: 'fit', label: 'Fit' },
  { id: 'tile', label: 'Tile' },
]
const EFFECTS: { id: WallEffect; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'mono', label: 'Mono' },
  { id: 'chrome', label: 'Chrome' },
]

function Segmented<T extends string>({ label, options, value, onChange }: { label: string; options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <fieldset className="cpl-field">
      <legend className="cpl-legend">{label}</legend>
      <div className="cpl-seg" role="radiogroup" aria-label={label}>
        {options.map(o => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            className={`cpl-btn${value === o.id ? ' is-pressed' : ''}`}
            onClick={() => onChange(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

/** "Display Properties": pick the desktop wallpaper from any photo on the site. */
export default function DisplayProperties() {
  useDocumentTitle('Wallpaper')
  const wall = useWallpaper()
  const groups = [...new Set(WALL_PHOTOS.map(p => p.group))]
  const current = WALL_PHOTOS.find(p => p.src === wall.src)

  return (
    <div className="cpl">
      <div className="cpl-top">
        <div className="cpl-monitor" aria-hidden>
          <div className="cpl-screen">
            <WallImage src={wall.src} mode={wall.mode} effect={wall.effect} tileSize="60px" />
          </div>
          <div className="cpl-monitor-chin">
            <span className="cpl-monitor-led" />
            <span className="cpl-monitor-badge">HSPH-2K</span>
          </div>
          <div className="cpl-monitor-foot" />
        </div>

        <div className="cpl-controls">
          <p className="cpl-now">
            <span className="cpl-now-k">NOW</span>
            <span className="cpl-now-v">{current ? `${current.group} / ${current.label}` : '—'}</span>
          </p>
          <Segmented label="Position" options={MODES} value={wall.mode} onChange={wall.setMode} />
          <Segmented label="Effect" options={EFFECTS} value={wall.effect} onChange={wall.setEffect} />
          <div className="cpl-row">
            <button type="button" className="cpl-btn cpl-btn-wide" onClick={wall.shuffleNow}>
              ⟳ Random
            </button>
            <label className="cpl-check">
              <input type="checkbox" checked={wall.shuffle} onChange={e => wall.setShuffle(e.target.checked)} />
              <span className="cpl-check-box" aria-hidden />
              New random photo every visit
            </label>
          </div>
        </div>
      </div>

      {groups.map(g => (
        <section key={g} className="cpl-group" aria-label={g}>
          <h3 className="cpl-group-head">
            <span>{g}</span>
            <span className="cpl-group-rule" aria-hidden />
            <span className="cpl-group-n">{WALL_PHOTOS.filter(p => p.group === g).length}</span>
          </h3>
          <div className="cpl-grid">
            {WALL_PHOTOS.filter(p => p.group === g).map(p => (
              <button
                key={p.src}
                type="button"
                className={`cpl-thumb${p.src === wall.src ? ' is-current' : ''}`}
                aria-pressed={p.src === wall.src}
                aria-label={`${p.group}: ${p.label}${p.kind === 'cover' ? ' (cover)' : ''}`}
                title={p.label}
                onClick={() => wall.pick(p.src)}
              >
                <img src={p.src} alt="" loading="lazy" draggable={false} />
                {p.kind === 'cover' && <span className="cpl-thumb-tag">CD</span>}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
