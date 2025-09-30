import type { VehicleListing } from '../types'

interface VehicleCardProps {
  vehicle: VehicleListing
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('en-US')

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const {
    imageUrl,
    title,
    price,
    mileage,
    distance,
    exteriorColor,
    interiorColor,
    bodyType,
    transmission,
    drivetrain,
    fuelType,
    dealerName,
    dealerCity,
    dealerState,
    dealerPhone,
    dealerWebsite,
    listingUrl,
  } = vehicle

  const priceLabel = typeof price === 'number' ? currencyFormatter.format(price) : 'Call for price'
  const mileageLabel = typeof mileage === 'number' ? `${numberFormatter.format(mileage)} miles` : undefined
  const distanceLabel = typeof distance === 'number' ? `${distance.toFixed(1)} miles away` : undefined
  const primaryLink = listingUrl ?? dealerWebsite
  const mediaClass = imageUrl ? 'vehicle-card__media' : 'vehicle-card__media vehicle-card__media--placeholder'

  const mediaContent = imageUrl ? <img src={imageUrl} alt={title} loading="lazy" /> : <span>No photo</span>

  return (
    <article className="vehicle-card">
      {primaryLink ? (
        <a className={mediaClass} href={primaryLink} target="_blank" rel="noreferrer">
          {mediaContent}
        </a>
      ) : (
        <div className={mediaClass}>{mediaContent}</div>
      )}
      <div className="vehicle-card__body">
        <div className="vehicle-card__header">
          <h3 className="vehicle-card__title">{title}</h3>
          <span className="vehicle-card__price">{priceLabel}</span>
        </div>
        <ul className="vehicle-card__meta">
          {mileageLabel && <li>{mileageLabel}</li>}
          {distanceLabel && <li>{distanceLabel}</li>}
          {exteriorColor && <li>Exterior: {exteriorColor}</li>}
          {interiorColor && <li>Interior: {interiorColor}</li>}
          {bodyType && <li>Body: {bodyType}</li>}
          {transmission && <li>Transmission: {transmission}</li>}
          {drivetrain && <li>Drivetrain: {drivetrain}</li>}
          {fuelType && <li>Fuel: {fuelType}</li>}
        </ul>
        <div className="vehicle-card__dealer">
          {dealerName && <p className="vehicle-card__dealer-name">{dealerName}</p>}
          {(dealerCity || dealerState) && (
            <p className="vehicle-card__dealer-location">
              {[dealerCity, dealerState].filter(Boolean).join(', ')}
            </p>
          )}
          {dealerPhone && (
            <a className="vehicle-card__dealer-contact" href={`tel:${dealerPhone.replace(/[^0-9+]/g, '')}`}>
              Call {dealerPhone}
            </a>
          )}
        </div>
        <div className="vehicle-card__actions">
          {listingUrl && (
            <a className="button button--secondary" href={listingUrl} target="_blank" rel="noreferrer">
              View Listing
            </a>
          )}
          {dealerWebsite && (
            <a className="button button--ghost" href={dealerWebsite} target="_blank" rel="noreferrer">
              Dealer Website
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
