interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
  readonly VITE_MARKETCHECK_API_KEY?: string
  readonly VITE_MARKETCHECK_BASE_URL?: string
  readonly VITE_RESULTS_PER_PAGE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}