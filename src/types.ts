export type SortOption = 'priceAsc' | 'priceDesc' | 'distance' | 'mileageAsc'

export interface SelectedLocation {
  description: string
  city: string
  state: string
  lat: number
  lng: number
}

export interface SearchCriteria {
  location: SelectedLocation
  radius: number
  make?: string
  model?: string
  color?: string
  minYear?: number
  maxYear?: number
  minMiles?: number
  maxMiles?: number
  minPrice?: number
  maxPrice?: number
  sortBy: SortOption
}

export interface VehicleListing {
  id: string
  title: string
  price?: number
  mileage?: number
  distance?: number
  exteriorColor?: string
  interiorColor?: string
  year?: number
  make?: string
  model?: string
  trim?: string
  bodyType?: string
  transmission?: string
  drivetrain?: string
  fuelType?: string
  dealerName?: string
  dealerCity?: string
  dealerState?: string
  dealerPhone?: string
  dealerWebsite?: string
  listingUrl?: string
  imageUrl?: string
}