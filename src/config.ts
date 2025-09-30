const DEFAULT_MARKETCHECK_BASE = 'https://api.marketcheck.com/v2'

export const appConfig = {
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  marketcheckApiKey: import.meta.env.VITE_MARKETCHECK_API_KEY,
  marketcheckBaseUrl: import.meta.env.VITE_MARKETCHECK_BASE_URL ?? DEFAULT_MARKETCHECK_BASE,
  resultsPerPage: Number.parseInt(import.meta.env.VITE_RESULTS_PER_PAGE ?? '24', 10),
}

export function assertGoogleMapsApiKey(): string {
  if (!appConfig.googleMapsApiKey) {
    throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY. Add it to your .env file to enable Google Places Autocomplete.')
  }
  return appConfig.googleMapsApiKey
}

export function assertMarketcheckApiKey(): string {
  if (!appConfig.marketcheckApiKey) {
    throw new Error('Missing VITE_MARKETCHECK_API_KEY. Add it to your .env file to enable vehicle search.')
  }
  return appConfig.marketcheckApiKey
}