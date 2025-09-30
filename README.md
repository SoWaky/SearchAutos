# Search Autos

Search Autos is a React + TypeScript single-page app that helps shoppers discover used automobiles from dealerships near a selected city. It uses Google Places Autocomplete to make location entry easy and the Marketcheck public inventory API to surface live listings.

## Features

- Google Places Autocomplete for fast city + state lookup
- Radius-based dealer search with optional make/model/color filters
- Support for min/max year, mileage, and price ranges
- Client-side sorting by price, distance, or mileage
- Animated "Finding your Dream Car" loading spinner while results load
- Responsive cards that highlight key vehicle and dealer details

## Prerequisites

- Node.js 20.19.0 or newer (22.x recommended)
- npm 10.x or newer
- Google Cloud project with the Places API enabled
- Marketcheck API key (free trial keys are available at [marketcheck.com](https://www.marketcheck.com/))

## Quick start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment template and add your API keys:
   ```bash
   copy .env.example .env   # Windows
   # or
   cp .env.example .env     # macOS/Linux
   ```
   Update `.env` with values for:
   - `VITE_GOOGLE_MAPS_API_KEY`
   - `VITE_MARKETCHECK_API_KEY`
3. Launch the dev server:
   ```bash
   npm run dev
   ```
   The app runs at http://localhost:5173 by default.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_GOOGLE_MAPS_API_KEY` | Yes | Google Maps Places API key used for autocomplete. |
| `VITE_MARKETCHECK_API_KEY` | Yes | Marketcheck API key used for dealership inventory search. |
| `VITE_MARKETCHECK_BASE_URL` | No | Override the Marketcheck API base URL (default `https://api.marketcheck.com/v2`). |
| `VITE_RESULTS_PER_PAGE` | No | Number of results to request per search (default `24`, capped at `50`). |

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server with hot reloading. |
| `npm run build` | Type-check and create an optimized production build. |
| `npm run preview` | Preview the production build locally. |

## Implementation notes

- The search form enforces selection of a Google Places city result and mandatory radius entry. Other filters are optional and trimmed before sending to the API.
- Vehicle data is fetched from Marketcheck and normalized before rendering. Additional client-side sorting keeps the grid aligned with the selected sort order, even if the API defaults differ.
- The UI is styled with a lightweight CSS theme that stays responsive down to mobile widths.

## Testing the integration

Marketcheck rate-limits anonymous keys, so consider storing your API key in a `.env.local` file that is not committed to version control. If you see authorization errors, double-check that the key is active and allowed for the `search/car/active` endpoint.

---

Happy car hunting!