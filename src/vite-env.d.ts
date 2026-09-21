/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_W3F_KEY_PRIMARY?: string
  readonly VITE_W3F_KEY_HOSTER?: string
  readonly VITE_W3F_KEY_MARYS?: string
  readonly VITE_W3F_KEY_ROGERS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
