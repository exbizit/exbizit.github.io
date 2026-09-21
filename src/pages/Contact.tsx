import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BANDS } from '../data/bands'
import { getKeysForBand, isContactConfigured, sendInquiry } from '../data/contact'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export default function Contact() {
  // Arriving from a band page (/contact?band=hoster) preselects that project.
  // Validated against BANDS so an unknown slug in the URL falls back to empty.
  const [searchParams] = useSearchParams()
  const requested = searchParams.get('band')
  const [selectedBand, setSelectedBand] = useState(
    BANDS.some(b => b.slug === requested) ? requested! : ''
  )
  const [status, setStatus] = useState<Status>('idle')
  useDocumentTitle('Contact & Booking')

  const activeBand = BANDS.find(b => b.slug === selectedBand)
  const accent = activeBand?.accentColor ?? 'var(--bone)'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status === 'sending') return

    const data = new FormData(e.currentTarget)
    setStatus('sending')

    const ok = await sendInquiry(getKeysForBand(selectedBand), {
      name: String(data.get('name') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      project: activeBand?.name ?? 'General',
      message: String(data.get('message') ?? '').trim(),
    })

    setStatus(ok ? 'sent' : 'error')
  }

  const field = {
    className: 'w-full px-4 py-3 font-mono text-sm bg-transparent',
    style: { border: '1px solid var(--iron)', color: 'var(--bone)', outline: 'none' } as React.CSSProperties,
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      (e.target.style.borderColor = accent),
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      (e.target.style.borderColor = 'var(--iron)'),
  }

  return (
    <div style={{ paddingTop: '56px' }}>
      <section className="px-6 py-20" style={{ borderBottom: '1px solid var(--iron)' }}>
        <div className="max-w-7xl mx-auto">
          <p className="label mb-6">
            Contact & Booking
            {activeBand && (
              <>
                {' / '}
                <span style={{ color: accent }}>{activeBand.name}</span>
              </>
            )}
          </p>
          <h1
            className="display leading-none"
            style={{ fontSize: 'clamp(2rem, 7vw, 6rem)', color: 'var(--bone)', letterSpacing: '-0.04em' }}
          >
            GET IN TOUCH
          </h1>
        </div>
      </section>

      <div className="max-w-xl mx-auto px-4 py-16">
        {status === 'sent' ? (
          <div className="text-center py-12" style={{ border: `1px solid ${accent}`, background: 'var(--void)' }}>
            <p className="display text-2xl mb-3" style={{ color: accent }}>
              Message sent
            </p>
            <p className="font-mono text-sm" style={{ color: 'var(--ash)' }}>
              Thanks — we'll get back to you.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label block mb-2" htmlFor="name">Name</label>
              <input id="name" name="name" type="text" required placeholder="Your name" {...field} />
            </div>

            <div>
              <label className="label block mb-2" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required placeholder="your@email.com" {...field} />
            </div>

            <div>
              <label className="label block mb-2" htmlFor="band">Regarding</label>
              <select
                id="band"
                name="band"
                value={selectedBand}
                onChange={e => setSelectedBand(e.target.value)}
                className="w-full px-4 py-3 font-mono text-sm transition-colors"
                style={{
                  background: 'var(--void)',
                  border: `1px solid ${selectedBand ? accent : 'var(--iron)'}`,
                  color: selectedBand ? accent : 'var(--bone)',
                  outline: 'none',
                }}
              >
                <option value="">Select a project</option>
                {BANDS.map(b => (
                  <option key={b.slug} value={b.slug} style={{ background: 'var(--void)' }}>
                    {b.name}
                  </option>
                ))}
                <option value="general" style={{ background: 'var(--void)' }}>General</option>
              </select>
            </div>

            <div>
              <label className="label block mb-2" htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                placeholder={
                  activeBand
                    ? `Booking inquiry for ${activeBand.name}...`
                    : 'Booking inquiry, press request, general hello...'
                }
                className="w-full px-4 py-3 font-mono text-sm bg-transparent resize-none"
                style={field.style}
                onFocus={field.onFocus}
                onBlur={field.onBlur}
              />
            </div>

            <button
              type="submit"
              disabled={status === 'sending' || !isContactConfigured}
              className="w-full py-4 font-mono text-sm font-bold tracking-widest transition-opacity"
              style={{
                background: isContactConfigured ? accent : 'var(--iron)',
                color: isContactConfigured ? 'var(--void)' : 'var(--ash)',
                cursor: isContactConfigured ? 'pointer' : 'not-allowed',
                opacity: status === 'sending' ? 0.6 : 1,
              }}
            >
              {status === 'sending' ? 'SENDING...' : 'SEND MESSAGE →'}
            </button>

            {status === 'error' && (
              <p className="font-mono text-xs text-center" style={{ color: '#FF1744' }}>
                Something went wrong sending that. Try again in a moment.
              </p>
            )}

            {!isContactConfigured && (
              <p className="font-mono text-xs text-center leading-relaxed" style={{ color: '#FF1744' }}>
                Contact form not configured.
                <br />
                Copy .env.example to .env.local and add your Web3Forms keys.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
