import type {
  ApiResponse,
  ActiveTrip,
  GeoLocation,
  Route,
  DayLog,
  DayTotals,
  ValidationResult,
  LogEntry,
} from '@/shared/types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

// ─── Core Fetch Wrapper ───────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  }

  let response: Response

  try {
    response = await fetch(url, config)
  } catch {
    throw new ApiError(
      'network_error',
      'Cannot reach the server. Make sure the backend is running.',
    )
  }

  const contentType = response.headers.get('Content-Type') ?? ''
  if (contentType.includes('application/pdf')) {
    if (!response.ok) {
      throw new ApiError('pdf_error', 'Failed to generate PDF.')
    }
    return response.blob() as unknown as T
  }

  let data: ApiResponse<T>
  try {
    data = await response.json()
  } catch {
    throw new ApiError(
      'parse_error',
      'Server returned an unexpected response. Please try again.',
    )
  }

  if (!data.success) {
    throw new ApiError(data.error.code, data.error.message, data.error.fields)
  }

  return data.data
}

// ─── Maps ─────────────────────────────────────────────────────────────────────

export function geocodeAddress(address: string): Promise<GeoLocation> {
  return request<GeoLocation>('/maps/geocode/', {
    method: 'POST',
    body: JSON.stringify({ address }),
  })
}

export function getRoute(
  current_location: string,
  pickup: string,
  destination: string,
): Promise<{ locations: ActiveTrip['locations']; route: Route }> {
  return request('/maps/route/', {
    method: 'POST',
    body: JSON.stringify({ current_location, pickup, destination }),
  })
}

// ─── Trips ────────────────────────────────────────────────────────────────────

export function validateEntry(payload: {
  entries_so_far: LogEntry[]
  new_entry: LogEntry
  cycle_hours_used: number
  total_miles_today: number
}): Promise<ValidationResult> {
  return request<ValidationResult>('/trips/validate-entry/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function calculateTotals(entries: LogEntry[]): Promise<DayTotals> {
  return request<DayTotals>('/trips/calculate-totals/', {
    method: 'POST',
    body: JSON.stringify({ entries }),
  })
}

// ─── Logs ─────────────────────────────────────────────────────────────────────

export function generateLogPDF(days: DayLog[]): Promise<Blob> {
  return request<Blob>('/logs/generate/', {
    method: 'POST',
    body: JSON.stringify({ days }),
  })
}
