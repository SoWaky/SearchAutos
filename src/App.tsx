import { useState } from 'react'
import { SearchForm } from './components/SearchForm'
import { VehicleResults } from './components/VehicleResults'
import { Spinner } from './components/Spinner'
import type { SearchCriteria, VehicleListing } from './types'
import { searchVehicles } from './services/marketcheck'

export default function App() {
  const [vehicles, setVehicles] = useState<VehicleListing[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lastSearch, setLastSearch] = useState<SearchCriteria | null>(null)

  const handleSearch = async (criteria: SearchCriteria) => {
    setStatus('loading')
    setErrorMessage(null)
    setLastSearch(criteria)

    try {
      const listings = await searchVehicles(criteria)
      setVehicles(listings)
      setStatus('success')
    } catch (error) {
      setVehicles([])
      setStatus('error')
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('Something went wrong while searching for vehicles.')
      }
    }
  }

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <h1 className="app-shell__title">Search Autos</h1>
        <p className="app-shell__subtitle">Find used automobiles from trusted dealerships near you.</p>
      </header>

      <SearchForm onSearch={handleSearch} isSearching={status === 'loading'} />

      {status === 'loading' && (
        <div className="status-row">
          <Spinner label="Finding your Dream Car" />
        </div>
      )}

      {status === 'error' && errorMessage && (
        <div className="alert alert--error" role="alert">
          {errorMessage}
        </div>
      )}

      {status === 'success' && (
        <section className="results">
          <header className="results__header">
            <h2 className="results__title">Search Results</h2>
            {lastSearch && (
              <p className="results__summary">
                Showing vehicles within {lastSearch.radius} miles of {lastSearch.location.city}, {lastSearch.location.state} sorted by{' '}
                {formatSortLabel(lastSearch.sortBy)}.
              </p>
            )}
          </header>
          {vehicles.length > 0 ? (
            <VehicleResults vehicles={vehicles} />
          ) : (
            <div className="alert alert--info" role="status">
              No automobiles matched your filters. Try broadening the search radius or adjusting your filters.
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function formatSortLabel(sortBy: SearchCriteria['sortBy']): string {
  switch (sortBy) {
    case 'priceAsc':
      return 'price (lowest to highest)'
    case 'priceDesc':
      return 'price (highest to lowest)'
    case 'distance':
      return 'distance from location'
    case 'mileageAsc':
      return 'mileage (lowest to highest)'
    default:
      return sortBy
  }
}
