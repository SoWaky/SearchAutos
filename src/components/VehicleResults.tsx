import type { VehicleListing } from '../types'
import { VehicleCard } from './VehicleCard'

interface VehicleResultsProps {
  vehicles: VehicleListing[]
}

export function VehicleResults({ vehicles }: VehicleResultsProps) {
  return (
    <div className="vehicle-grid">
      {vehicles.map((vehicle) => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  )
}
