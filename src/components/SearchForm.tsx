import { useRef } from 'react'
import type { ChangeEvent } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api'
import type { Libraries } from '@googlemaps/js-api-loader'
import { appConfig } from '../config'
import type { SearchCriteria, SelectedLocation } from '../types'

const libraries: Libraries = ['places']
const currentYear = new Date().getFullYear()

const locationSchema = z.object({
  description: z.string(),
  city: z.string(),
  state: z.string(),
  lat: z.number(),
  lng: z.number(),
})

const optionalNumericString = (label: string, options?: { min?: number }) => {
  let schema = z
    .string()
    .trim()
    .optional()
    .refine((value) => {
      if (!value) return true
      return !Number.isNaN(Number(value))
    }, `${label} must be a number`)

  if (options && options.min !== undefined) {
    const minValue = options.min
    schema = schema.refine((value) => {
      if (!value) return true
      return Number(value) >= minValue
    }, `${label} must be at least ${minValue}`)
  }

  return schema
}

const formSchema = z
  .object({
    locationDescription: z.string().min(1, 'Location is required'),
    location: locationSchema.nullable().default(null),
    radius: z.coerce
      .number()
      .min(1, 'Radius must be at least 1 mile')
      .max(500, 'Radius must be 500 miles or less'),
    make: z.string().trim().max(50, 'Make must be 50 characters or less').optional(),
    model: z.string().trim().max(50, 'Model must be 50 characters or less').optional(),
    color: z.string().trim().max(30, 'Color must be 30 characters or less').optional(),
    minYear: optionalNumericString('Min Year'),
    maxYear: optionalNumericString('Max Year'),
    minMiles: optionalNumericString('Min Miles', { min: 0 }),
    maxMiles: optionalNumericString('Max Miles', { min: 0 }),
    minPrice: optionalNumericString('Min Cost', { min: 0 }),
    maxPrice: optionalNumericString('Max Cost', { min: 0 }),
    sortBy: z.enum(['priceAsc', 'priceDesc', 'distance', 'mileageAsc']),
  })
  .superRefine((data, ctx) => {
    if (!data.location) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['location'],
        message: 'Select a location from the suggestions.',
      })
    }

    const toNumber = (value?: string) => {
      if (!value) return undefined
      const numericValue = Number(value)
      return Number.isFinite(numericValue) ? numericValue : undefined
    }

    const minYear = toNumber(data.minYear)
    const maxYear = toNumber(data.maxYear)
    if (minYear && (minYear < 1900 || minYear > currentYear)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['minYear'],
        message: `Min Year must be between 1900 and ${currentYear}`,
      })
    }
    if (maxYear && (maxYear < 1900 || maxYear > currentYear)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maxYear'],
        message: `Max Year must be between 1900 and ${currentYear}`,
      })
    }
    if (minYear && maxYear && minYear > maxYear) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maxYear'],
        message: 'Max Year must be greater than or equal to Min Year',
      })
    }

    const minMiles = toNumber(data.minMiles)
    const maxMiles = toNumber(data.maxMiles)
    if (minMiles && maxMiles && minMiles > maxMiles) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maxMiles'],
        message: 'Max Miles must be greater than or equal to Min Miles',
      })
    }

    const minPrice = toNumber(data.minPrice)
    const maxPrice = toNumber(data.maxPrice)
    if (minPrice && maxPrice && minPrice > maxPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maxPrice'],
        message: 'Max Cost must be greater than or equal to Min Cost',
      })
    }
  })

type FormInputs = z.input<typeof formSchema>
type FormValues = z.infer<typeof formSchema>

interface SearchFormProps {
  onSearch: (criteria: SearchCriteria) => void
  isSearching?: boolean
}

export function SearchForm({ onSearch, isSearching }: SearchFormProps) {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const googleMapsApiKey = appConfig.googleMapsApiKey

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-places-script',
    googleMapsApiKey: googleMapsApiKey ?? '',
    libraries,
    language: 'en',
    region: 'US',
  })

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormInputs, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      locationDescription: '',
      location: null,
      radius: 25,
      make: '',
      model: '',
      color: '',
      minYear: undefined,
      maxYear: undefined,
      minMiles: undefined,
      maxMiles: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: 'priceAsc',
    },
  })

  const missingApiKey = !googleMapsApiKey
  const locationLoadFailed = Boolean(loadError)
  const isAutocompleteReady = !missingApiKey && !locationLoadFailed && isLoaded

  const submitHandler = (values: FormValues) => {
    if (!values.location) {
      return
    }

    const sanitizeText = (value?: string | null) => {
      if (!value) return undefined
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : undefined
    }

    const parseOptionalNumber = (value?: string) => {
      if (!value) return undefined
      const trimmed = value.trim()
      if (!trimmed) return undefined
      const numericValue = Number(trimmed)
      return Number.isFinite(numericValue) ? numericValue : undefined
    }

    const criteria: SearchCriteria = {
      location: values.location,
      radius: values.radius,
      make: sanitizeText(values.make),
      model: sanitizeText(values.model),
      color: sanitizeText(values.color),
      minYear: parseOptionalNumber(values.minYear),
      maxYear: parseOptionalNumber(values.maxYear),
      minMiles: parseOptionalNumber(values.minMiles),
      maxMiles: parseOptionalNumber(values.maxMiles),
      minPrice: parseOptionalNumber(values.minPrice),
      maxPrice: parseOptionalNumber(values.maxPrice),
      sortBy: values.sortBy,
    }

    onSearch(criteria)
  }

  const onPlaceChanged = () => {
    const autocomplete = autocompleteRef.current
    if (!autocomplete) return
    const place = autocomplete.getPlace()
    if (!place) return

    const addressComponents = place.address_components ?? []
    const getComponent = (type: string) =>
      addressComponents.find((component) => component.types.includes(type))

    const cityComponent =
      getComponent('locality') ??
      getComponent('sublocality') ??
      getComponent('postal_town') ??
      getComponent('administrative_area_level_2')
    const stateComponent = getComponent('administrative_area_level_1')

    const geometry = place.geometry?.location
    if (!geometry) {
      return
    }

    const selectedLocation: SelectedLocation = {
      description: place.formatted_address ?? place.name ?? '',
      city: cityComponent?.long_name ?? '',
      state: stateComponent?.short_name ?? '',
      lat: geometry.lat(),
      lng: geometry.lng(),
    }

    setValue('location', selectedLocation, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    })
    setValue('locationDescription', selectedLocation.description, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    })
  }

  return (
    <section className="card">
      <h2 className="card__title">Search Criteria</h2>
      <form className="form" onSubmit={handleSubmit(submitHandler)}>
        <div className="form__grid">
          <div className="form__field form__field--full">
            <label htmlFor="location" className="form__label">
              Location (City, State) <span className="form__required">*</span>
            </label>
            <Controller
              name="locationDescription"
              control={control}
              render={({ field }) => {
                const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
                  field.onChange(event.target.value)
                  setValue('location', null, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }

                const inputElement = (
                  <input
                    {...field}
                    id="location"
                    type="text"
                    className="form__input"
                    placeholder="Start typing a city and state"
                    onChange={handleChange}
                    disabled={!isAutocompleteReady}
                    aria-invalid={Boolean(errors.locationDescription) || Boolean(errors.location)}
                  />
                )

                if (isAutocompleteReady) {
                  return (
                    <Autocomplete
                      onLoad={(instance) => {
                        autocompleteRef.current = instance
                      }}
                      onPlaceChanged={onPlaceChanged}
                      options={{ types: ['(cities)'] }}
                    >
                      {inputElement}
                    </Autocomplete>
                  )
                }

                return inputElement
              }}
            />
            {missingApiKey && (
              <p className="form__help form__help--error">
                Add your Google Maps Places API key to VITE_GOOGLE_MAPS_API_KEY in a .env file to enable autocomplete.
              </p>
            )}
            {errors.locationDescription && (
              <p className="form__help form__help--error">{errors.locationDescription.message}</p>
            )}
            {errors.location && (
              <p className="form__help form__help--error">{errors.location.message as string}</p>
            )}
            {locationLoadFailed && !missingApiKey && (
              <p className="form__help form__help--error">Unable to load Google Places Autocomplete. Check your API key or network connection.</p>
            )}
            {!isLoaded && !missingApiKey && !locationLoadFailed && (
              <p className="form__help">Loading Google Places suggestions…</p>
            )}
          </div>

          <div className="form__field">
            <label htmlFor="radius" className="form__label">
              Radius (miles) <span className="form__required">*</span>
            </label>
            <input
              {...register('radius')}
              id="radius"
              type="number"
              min={1}
              max={500}
              className="form__input"
              aria-invalid={Boolean(errors.radius)}
            />
            {errors.radius && <p className="form__help form__help--error">{errors.radius.message}</p>}
          </div>

          <div className="form__field">
            <label htmlFor="make" className="form__label">
              Make
            </label>
            <input {...register('make')} id="make" type="text" className="form__input" placeholder="e.g. Toyota" />
            {errors.make && <p className="form__help form__help--error">{errors.make.message}</p>}
          </div>

          <div className="form__field">
            <label htmlFor="model" className="form__label">
              Model
            </label>
            <input {...register('model')} id="model" type="text" className="form__input" placeholder="e.g. Camry" />
            {errors.model && <p className="form__help form__help--error">{errors.model.message}</p>}
          </div>

          <div className="form__field">
            <label htmlFor="color" className="form__label">
              Color
            </label>
            <input {...register('color')} id="color" type="text" className="form__input" placeholder="e.g. Blue" />
            {errors.color && <p className="form__help form__help--error">{errors.color.message}</p>}
          </div>

          <div className="form__field">
            <label htmlFor="minYear" className="form__label">
              Min Year
            </label>
            <input {...register('minYear')} id="minYear" type="number" className="form__input" min={1900} max={currentYear} />
            {errors.minYear && <p className="form__help form__help--error">{errors.minYear.message}</p>}
          </div>

          <div className="form__field">
            <label htmlFor="maxYear" className="form__label">
              Max Year
            </label>
            <input {...register('maxYear')} id="maxYear" type="number" className="form__input" min={1900} max={currentYear} />
            {errors.maxYear && <p className="form__help form__help--error">{errors.maxYear.message}</p>}
          </div>

          <div className="form__field">
            <label htmlFor="minMiles" className="form__label">
              Min Miles
            </label>
            <input {...register('minMiles')} id="minMiles" type="number" className="form__input" min={0} />
            {errors.minMiles && <p className="form__help form__help--error">{errors.minMiles.message}</p>}
          </div>

          <div className="form__field">
            <label htmlFor="maxMiles" className="form__label">
              Max Miles
            </label>
            <input {...register('maxMiles')} id="maxMiles" type="number" className="form__input" min={0} />
            {errors.maxMiles && <p className="form__help form__help--error">{errors.maxMiles.message}</p>}
          </div>

          <div className="form__field">
            <label htmlFor="minPrice" className="form__label">
              Min Cost ($)
            </label>
            <input {...register('minPrice')} id="minPrice" type="number" className="form__input" min={0} />
            {errors.minPrice && <p className="form__help form__help--error">{errors.minPrice.message}</p>}
          </div>

          <div className="form__field">
            <label htmlFor="maxPrice" className="form__label">
              Max Cost ($)
            </label>
            <input {...register('maxPrice')} id="maxPrice" type="number" className="form__input" min={0} />
            {errors.maxPrice && <p className="form__help form__help--error">{errors.maxPrice.message}</p>}
          </div>

          <div className="form__field">
            <label htmlFor="sortBy" className="form__label">
              Sort By
            </label>
            <select {...register('sortBy')} id="sortBy" className="form__input">
              <option value="priceAsc">Price (Lowest to Highest)</option>
              <option value="priceDesc">Price (Highest to Lowest)</option>
              <option value="distance">Distance from Location</option>
              <option value="mileageAsc">Mileage (Lowest to Highest)</option>
            </select>
          </div>
        </div>

        <div className="form__actions">
          <button type="submit" className="button" disabled={isSearching}>
            {isSearching ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>
    </section>
  )
}
