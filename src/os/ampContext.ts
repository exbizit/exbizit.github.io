import { createContext, useContext } from 'react'

export type AmpStatus = 'off' | 'loading' | 'open' | 'hidden'

export interface Amp {
  status: AmpStatus
  playing: boolean
  nowPlaying: string | null
  /** Open, or bring back from the tray */
  show: () => void
  hide: () => void
  playBand: (slug: string) => void
}

export const AmpCtx = createContext<Amp | null>(null)

export function useAmp() {
  const ctx = useContext(AmpCtx)
  if (!ctx) throw new Error('useAmp outside AmpProvider')
  return ctx
}

/** Null outside the desktop layout, where HosterAmp doesn't exist. */
export const useAmpIfPresent = () => useContext(AmpCtx)
