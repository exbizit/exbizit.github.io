import { createContext, useContext } from 'react'

/** The window a component is rendered in, if any. */
export const WindowCtx = createContext<{ id: string; focused: boolean } | null>(null)
export const useWindow = () => useContext(WindowCtx)
