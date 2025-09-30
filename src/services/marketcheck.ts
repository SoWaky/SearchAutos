import { appConfig, assertMarketcheckApiKey } from '../config'
import type { SearchCriteria, VehicleListing } from '../types'

type SortConfig = {
  sortBy: string
  sortOrder?: 'asc' | 'desc'
}

type MarketcheckSearchResponse = {
  listings?: MarketcheckListing[]
}

type MarketcheckListing = {
  id?: string
  vin?: string
  heading?: string
  price?: number
  miles?: number
  mileage?: number
  dist?: number
  distance?: number
  exterior_color?: string
  interior_color?: string
  media?: {
    photo_links?: string[]
  }
  dealer?: {
    name?: string
    city?: string
    state?: string
    phone?: string
    website?: string
  }
  build?: {
    year?: number
    make?: string
    model?: string
    trim?: string
    body_type?: string
    transmission?: string
    drivetrain?: string
    fuel_type?: string
  }
  vdp_url?: string
  ref_price?: number
  scraped_listing_url?: string
  website?: string
}

const SORT_MAPPING: Record<SearchCriteria['sortBy'], SortConfig> = {
  priceAsc: { sortBy: 'price', sortOrder: 'asc' },
  priceDesc: { sortBy: 'price', sortOrder: 'desc' },
  distance: { sortBy: 'distance', sortOrder: 'asc' },
  mileageAsc: { sortBy: 'miles', sortOrder: 'asc' },
}

const API_PATH = 'search/car/active'

export async function searchVehicles(criteria: SearchCriteria): Promise<VehicleListing[]> {
  const apiKey = assertMarketcheckApiKey()
  const baseUrl = appConfig.marketcheckBaseUrl.replace(/\/$/, '')
  const url = new URL(`${baseUrl}/${API_PATH}`)

  const searchParams = url.searchParams
  searchParams.set('api_key', apiKey)
  searchParams.set('latitude', criteria.location.lat.toString())
  searchParams.set('longitude', criteria.location.lng.toString())
  searchParams.set('radius', criteria.radius.toString())
  searchParams.set('car_type', 'used')
  searchParams.set('start', '0')
  searchParams.set('rows', `${Math.max(1, Math.min(appConfig.resultsPerPage, 50))}`)

  if (criteria.make) searchParams.set('make', criteria.make)
  if (criteria.model) searchParams.set('model', criteria.model)
  if (criteria.color) searchParams.set('exterior_color', criteria.color)

  if (criteria.minYear || criteria.maxYear) {
    const min = criteria.minYear ?? '2000'
    const max = criteria.maxYear ?? '2030'
    searchParams.set('year_range', `${min}-${max}`)
    //searchParams.set('year', min.toString())
  }

  if (criteria.minMiles || criteria.maxMiles) {
    const min = criteria.minMiles ?? '0'
    const max = criteria.maxMiles ?? '1000'
    searchParams.set('miles_range', `${min}-${max}`)
  }

  if (criteria.minPrice || criteria.maxPrice) {
    const min = criteria.minPrice ?? '0'
    const max = criteria.maxPrice ?? '100000'
    searchParams.set('price_range', `${min}-${max}`)
  }

  const sortConfig = SORT_MAPPING[criteria.sortBy]
  if (sortConfig) {
    searchParams.set('sort_by', sortConfig.sortBy)
    if (sortConfig.sortOrder) {
      searchParams.set('sort_order', sortConfig.sortOrder)
    }
  }

  const response = await fetch(url.toString())
  if (!response.ok) {
    const errorBody = await safeParseError(response)
    throw new Error(errorBody ?? 'Unable to fetch vehicles from Marketcheck.')
  }

  const payload = (await response.json()) as MarketcheckSearchResponse
  const listings = Array.isArray(payload.listings) ? payload.listings : []

  const normalized = listings.map(normalizeListing)
  return sortListings(normalized, criteria.sortBy)
}

async function safeParseError(response: Response): Promise<string | null> {
  try {
    const body = await response.json()
    if (typeof body === 'object' && body && 'message' in body) {
      return String((body as { message: unknown }).message)
    }
    return null
  } catch (error) {
    return response.statusText || null
  }
}

function normalizeListing(listing: MarketcheckListing): VehicleListing {
  const build = listing.build ?? {}
  const dealer = listing.dealer ?? {}
  const id = listing.id ?? listing.vin ?? cryptoRandomId()

  const computedTitle = listing.heading ?? [build.year, build.make, build.model, build.trim].filter(Boolean).join(' ').trim()

  return {
    id,
    title: computedTitle || 'Used Vehicle',
    price: listing.price ?? listing.ref_price,
    mileage: listing.miles ?? listing.mileage,
    distance: listing.dist ?? listing.distance,
    exteriorColor: listing.exterior_color ?? undefined,
    interiorColor: listing.interior_color ?? undefined,
    year: build.year,
    make: build.make,
    model: build.model,
    trim: build.trim,
    bodyType: build.body_type,
    transmission: build.transmission,
    drivetrain: build.drivetrain,
    fuelType: build.fuel_type,
    dealerName: dealer.name,
    dealerCity: dealer.city,
    dealerState: dealer.state,
    dealerPhone: dealer.phone,
    dealerWebsite: dealer.website ?? listing.website ?? listing.scraped_listing_url,
    listingUrl: listing.vdp_url ?? listing.scraped_listing_url ?? dealer.website ?? undefined,
    imageUrl: listing.media?.photo_links?.[0],
  }
}

function sortListings(listings: VehicleListing[], sortBy: SearchCriteria['sortBy']): VehicleListing[] {
  const sorted = [...listings]
  const comparator = comparators[sortBy]
  if (comparator) {
    sorted.sort(comparator)
  }
  return sorted
}

const comparators: Record<SearchCriteria['sortBy'], (a: VehicleListing, b: VehicleListing) => number> = {
  priceAsc: (a, b) => compareWithMissing(a.price, b.price, 'asc'),
  priceDesc: (a, b) => compareWithMissing(a.price, b.price, 'desc'),
  distance: (a, b) => compareWithMissing(a.distance, b.distance, 'asc'),
  mileageAsc: (a, b) => compareWithMissing(a.mileage, b.mileage, 'asc'),
}

type SortDirection = 'asc' | 'desc'

function compareWithMissing(aValue: number | undefined, bValue: number | undefined, direction: SortDirection): number {
  const aHasValue = typeof aValue === 'number'
  const bHasValue = typeof bValue === 'number'

  if (!aHasValue && !bHasValue) return 0
  if (!aHasValue) return direction === 'asc' ? 1 : -1
  if (!bHasValue) return direction === 'asc' ? -1 : 1

  return direction === 'asc' ? aValue - bValue : bValue - aValue
}

function cryptoRandomId(): string {
  return Math.random().toString(36).slice(2)
}
