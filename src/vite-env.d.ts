/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_W3F_KEY_PRIMARY?: string
  readonly VITE_W3F_KEY_HOSTER?: string
  readonly VITE_W3F_KEY_MARYS?: string
  readonly VITE_W3F_KEY_ROGERS?: string
  /** Worker base URL for HosterAmp's Bandcamp relay; defaults to BOARD_API */
  readonly VITE_AMP_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const __APP_VERSION__: string
