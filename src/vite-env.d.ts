/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TURSO_DATABASE_URL: string
  readonly VITE_TURSO_AUTH_TOKEN: string
  readonly VITE_ADMIN_USERNAME: string
  readonly VITE_ADMIN_PASSWORD: string
  readonly VITE_TMDB_API_KEY: string
  readonly VITE_TMDB_READ_ACCESS_TOKEN: string
  readonly VITE_RAPIDAPI_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
