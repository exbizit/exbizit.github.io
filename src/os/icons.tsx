/**
 * Desktop icons: small chrome objects, drawn as SVG so they stay crisp at any
 * size. Shared gradients live in <IconDefs>, rendered once by the desktop.
 */
import type { ReactNode } from 'react'

export function IconDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <linearGradient id="os-chrome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" style={{ stopColor: 'hsl(var(--sys-h) calc(var(--sys-sat) * 47%) 81%)' }}/>
          <stop offset="0.55" style={{ stopColor: 'hsl(var(--sys-h) calc(var(--sys-sat) * 35%) 57%)' }}/>
          <stop offset="1" style={{ stopColor: 'hsl(var(--sys-h) calc(var(--sys-sat) * 100%) 94%)' }}/>
        </linearGradient>
        <linearGradient id="os-chrome-dk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'hsl(var(--sys-h) calc(var(--sys-sat) * 43%) 40%)' }}/>
          <stop offset="1" style={{ stopColor: 'hsl(var(--sys-h) calc(var(--sys-sat) * 57%) 9%)' }}/>
        </linearGradient>
        <linearGradient id="os-peri" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'hsl(var(--sys-h) calc(var(--sys-sat) * 100%) 89%)' }}/>
          <stop offset="1" style={{ stopColor: 'hsl(var(--sys-h) calc(var(--sys-sat) * 100%) 65%)' }}/>
        </linearGradient>
        <radialGradient id="os-disc" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.18" style={{ stopColor: 'hsl(var(--sys-h) calc(var(--sys-sat) * 51%) 9%)' }}/>
          <stop offset="0.2" style={{ stopColor: 'hsl(var(--sys-h) calc(var(--sys-sat) * 100%) 95%)' }}/>
          <stop offset="0.45" style={{ stopColor: 'hsl(var(--sys-h) calc(var(--sys-sat) * 100%) 81%)' }}/>
          <stop offset="0.62" stopColor="#ffc2f4" />
          <stop offset="0.8" stopColor="#a8fff0" />
          <stop offset="1" style={{ stopColor: 'hsl(var(--sys-h) calc(var(--sys-sat) * 100%) 94%)' }}/>
        </radialGradient>
      </defs>
    </svg>
  )
}

const frame = (children: ReactNode) => (
  <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden>
    {children}
  </svg>
)

export const ICONS = {
  listening: () =>
    frame(
      <>
        <circle cx="24" cy="24" r="21" fill="url(#os-disc)" strokeWidth="1.5" style={{ stroke: 'hsl(var(--sys-h) calc(var(--sys-sat) * 57%) 9%)' }}/>
        <path d="M24 5 A19 19 0 0 1 41 16" stroke="#fff" strokeWidth="2" fill="none" opacity="0.8" />
        <circle cx="24" cy="24" r="4.5" strokeWidth="1.2" style={{ fill: 'hsl(var(--sys-h) calc(var(--sys-sat) * 44%) 4%)', stroke: 'hsl(var(--sys-h) calc(var(--sys-sat) * 100%) 89%)' }}/>
      </>
    ),
  shows: () =>
    frame(
      <>
        <path
          d="M5 13 h38 v7 a4 4 0 0 0 0 8 v7 h-38 v-7 a4 4 0 0 0 0 -8 z"
          fill="url(#os-chrome)"
         
          strokeWidth="1.5" style={{ stroke: 'hsl(var(--sys-h) calc(var(--sys-sat) * 57%) 9%)' }}/>
        <line x1="31" y1="15" x2="31" y2="33" stroke="#0a0d24" strokeWidth="1.2" strokeDasharray="2 2" />
        <rect x="9" y="18" width="18" height="3" style={{ fill: 'hsl(var(--sys-h) calc(var(--sys-sat) * 50%) 21%)' }}/>
        <rect x="9" y="24" width="13" height="2" style={{ fill: 'hsl(var(--sys-h) calc(var(--sys-sat) * 100%) 65%)' }}/>
        <rect x="9" y="28" width="16" height="2" style={{ fill: 'hsl(var(--sys-h) calc(var(--sys-sat) * 100%) 65%)' }}/>
        <text x="37" y="27" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="700" style={{ fill: 'hsl(var(--sys-h) calc(var(--sys-sat) * 57%) 9%)' }}>
          ADMIT
        </text>
      </>
    ),
  community: () =>
    frame(
      <>
        <rect x="4" y="6" width="40" height="30" rx="3" fill="url(#os-chrome)" strokeWidth="1.5" style={{ stroke: 'hsl(var(--sys-h) calc(var(--sys-sat) * 57%) 9%)' }}/>
        <rect x="8" y="10" width="32" height="21" style={{ fill: 'hsl(var(--sys-h) calc(var(--sys-sat) * 44%) 4%)' }}/>
        <text x="10" y="17" fontSize="5" fontFamily="monospace" style={{ fill: 'hsl(var(--sys-h) calc(var(--sys-sat) * 100%) 78%)' }}>
          &gt; BBS
        </text>
        <text x="10" y="24" fontSize="5" fontFamily="monospace" style={{ fill: 'hsl(var(--sys-h) calc(var(--sys-sat) * 100%) 78%)' }}>
          &gt; hi :)
        </text>
        <rect x="10" y="26.5" width="4" height="2" style={{ fill: 'hsl(var(--sys-h) calc(var(--sys-sat) * 100%) 89%)' }}/>
        <path d="M16 36 h16 l3 6 h-22 z" fill="url(#os-chrome)" strokeWidth="1.5" style={{ stroke: 'hsl(var(--sys-h) calc(var(--sys-sat) * 57%) 9%)' }}/>
      </>
    ),
  contact: () =>
    frame(
      <>
        <rect x="4" y="11" width="40" height="27" fill="url(#os-chrome)" strokeWidth="1.5" style={{ stroke: 'hsl(var(--sys-h) calc(var(--sys-sat) * 57%) 9%)' }}/>
        <path d="M4 11 l20 16 l20 -16" fill="none" strokeWidth="1.5" style={{ stroke: 'hsl(var(--sys-h) calc(var(--sys-sat) * 57%) 9%)' }}/>
        <path d="M4 38 l15 -13 M44 38 l-15 -13" strokeWidth="1" opacity="0.6" style={{ stroke: 'hsl(var(--sys-h) calc(var(--sys-sat) * 57%) 9%)' }}/>
        <circle cx="38" cy="12" r="6" strokeWidth="1.2" style={{ fill: 'hsl(var(--sys-h) calc(var(--sys-sat) * 100%) 65%)', stroke: 'hsl(var(--sys-h) calc(var(--sys-sat) * 57%) 9%)' }}/>
        <text x="38" y="15" fontSize="8" fontFamily="monospace" fill="#fff" textAnchor="middle" fontWeight="700">
          $
        </text>
      </>
    ),
  amp: () =>
    frame(
      <>
        <circle cx="24" cy="24" r="21" fill="url(#os-chrome-dk)" strokeWidth="2" style={{ stroke: 'hsl(var(--sys-h) calc(var(--sys-sat) * 100%) 89%)' }}/>
        <circle cx="24" cy="24" r="17" fill="none" strokeWidth="1" opacity="0.7" style={{ stroke: 'hsl(var(--sys-h) calc(var(--sys-sat) * 100%) 65%)' }}/>
        <path d="M27 7 L14 27 h9 l-3 14 L34 20 h-9 z" fill="url(#os-peri)" stroke="#fff" strokeWidth="1.2" />
      </>
    ),
  cubefield: () =>
    frame(
      <>
        <path d="M24 5 L42 15 L24 25 L6 15 Z" strokeWidth="1.5" style={{ fill: 'hsl(var(--sys-h) calc(var(--sys-sat) * 100%) 95%)', stroke: 'hsl(var(--sys-h) calc(var(--sys-sat) * 57%) 9%)' }}/>
        <path d="M6 15 L24 25 L24 44 L6 34 Z" strokeWidth="1.5" style={{ fill: 'hsl(var(--sys-h) calc(var(--sys-sat) * 100%) 78%)', stroke: 'hsl(var(--sys-h) calc(var(--sys-sat) * 57%) 9%)' }}/>
        <path d="M42 15 L24 25 L24 44 L42 34 Z" strokeWidth="1.5" style={{ fill: 'hsl(var(--sys-h) calc(var(--sys-sat) * 52%) 47%)', stroke: 'hsl(var(--sys-h) calc(var(--sys-sat) * 57%) 9%)' }}/>
      </>
    ),
  display: () =>
    frame(
      <>
        <rect x="4" y="5" width="40" height="30" fill="url(#os-chrome)" strokeWidth="1.5" style={{ stroke: 'hsl(var(--sys-h) calc(var(--sys-sat) * 57%) 9%)' }}/>
        <rect x="8" y="9" width="32" height="22" style={{ fill: 'hsl(var(--sys-h) calc(var(--sys-sat) * 100%) 81%)' }}/>
        <circle cx="33" cy="15" r="3" fill="#fff" />
        <path d="M8 31 L18 19 L25 26 L30 21 L40 31 Z" style={{ fill: 'hsl(var(--sys-h) calc(var(--sys-sat) * 59%) 41%)' }}/>
        <path d="M18 35 h12 l2 5 h-16 z" fill="url(#os-chrome)" strokeWidth="1.5" style={{ stroke: 'hsl(var(--sys-h) calc(var(--sys-sat) * 57%) 9%)' }}/>
        <rect x="12" y="40" width="24" height="3" fill="url(#os-chrome)" strokeWidth="1" style={{ stroke: 'hsl(var(--sys-h) calc(var(--sys-sat) * 57%) 9%)' }}/>
      </>
    ),
  layout: () =>
    frame(
      <>
        <rect x="4" y="6" width="40" height="34" fill="#000" stroke="#fff" strokeWidth="1.5" />
        <rect x="4" y="6" width="40" height="7" fill="#fff" />
        <rect x="8" y="17" width="20" height="6" fill="#fff" />
        <rect x="8" y="26" width="32" height="2" fill="#8c8c8c" />
        <rect x="8" y="31" width="26" height="2" fill="#8c8c8c" />
        <path d="M30 44 L44 44 L44 30" fill="none" style={{ stroke: 'hsl(var(--sys-h) calc(var(--sys-sat) * 100%) 65%)' }} strokeWidth="3" />
        <path d="M44 44 L34 34" style={{ stroke: 'hsl(var(--sys-h) calc(var(--sys-sat) * 100%) 65%)' }} strokeWidth="3" />
      </>
    ),
  folder: () =>
    frame(
      <>
        <path d="M4 12 h14 l4 4 h22 v24 h-40 z" fill="url(#os-chrome)" strokeWidth="1.5" style={{ stroke: 'hsl(var(--sys-h) calc(var(--sys-sat) * 57%) 9%)' }}/>
        <rect x="4" y="19" width="40" height="3" opacity="0.6" style={{ fill: 'hsl(var(--sys-h) calc(var(--sys-sat) * 100%) 65%)' }}/>
      </>
    ),
  error: () =>
    frame(
      <>
        <path d="M24 4 L45 42 H3 Z" fill="url(#os-chrome)" strokeWidth="1.5" style={{ stroke: 'hsl(var(--sys-h) calc(var(--sys-sat) * 57%) 9%)' }}/>
        <rect x="22" y="16" width="4" height="14" style={{ fill: 'hsl(var(--sys-h) calc(var(--sys-sat) * 57%) 9%)' }}/>
        <rect x="22" y="33" width="4" height="4" style={{ fill: 'hsl(var(--sys-h) calc(var(--sys-sat) * 57%) 9%)' }}/>
      </>
    ),
}

export type IconName = keyof typeof ICONS

/** A band's icon: its logo if it has one, else its cover/photo as a jewel case. */
export function BandIcon({ logo, image }: { logo?: string; image?: string }) {
  if (logo) {
    return (
      <img
        src={logo}
        alt=""
        draggable={false}
        style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 2px 0 rgba(0,0,0,0.6))' }}
      />
    )
  }
  return (
    <span className="os-jewel" aria-hidden>
      {image && <img src={image} alt="" draggable={false} />}
    </span>
  )
}
