import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTripStore } from '@/shared/store/tripStore'
import { getRoute, isApiError } from '@/shared/api/client'
import { LocationAutocomplete } from '@/shared/components/LocationAutocomplete'
import type { ActiveTrip } from '@/shared/types'

interface Form {
  current_location: string
  pickup: string
  destination: string
  cycle_hours_used: string
}

export function HomeScreen() {
  const navigate = useNavigate()
  const { trip, startTrip, abandonTrip } = useTripStore()

  const [form, setForm] = useState<Form>({
    current_location: '',
    pickup: '',
    destination: '',
    cycle_hours_used: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    setFieldErrors({})

    try {
      const result = await getRoute(form.current_location, form.pickup, form.destination)
      const today = new Date().toISOString().split('T')[0]

      const newTrip: ActiveTrip = {
        created_at: new Date().toISOString(),
        setup: {
          current_location: form.current_location,
          pickup: form.pickup,
          destination: form.destination,
          cycle_hours_used: parseFloat(form.cycle_hours_used) || 0,
        },
        locations: result.locations,
        route: result.route,
        days: [
          {
            day_number: 1,
            date: today,
            driver_name: '',
            driver_number: '',
            co_driver: 'N/A',
            home_terminal: '',
            tractor: '',
            trailer: '',
            shipper: '',
            commodity: '',
            load_number: '',
            total_miles: 0,
            entries: [],
            post_trip: { defects: 'none' },
            completed: false,
          },
        ],
        current_day: 1,
      }

      startTrip(newTrip)
      navigate('/map')
    } catch (err) {
      if (isApiError(err)) {
        err.fields ? setFieldErrors(err.fields) : setError(err.message)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const setField = (key: keyof Form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  // ── Active trip ────────────────────────────────────────────────────────────
  if (trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Active Trip Found</h2>
          <p className="text-gray-500 mb-1">
            {trip.setup.pickup} → {trip.setup.destination}
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Day {trip.current_day} &bull;{' '}
            {trip.days.filter((d) => d.completed).length} day(s) completed
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/map')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Resume Trip
            </button>
            <button
              onClick={() => navigate('/log')}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Go to Day {trip.current_day} Log
            </button>
            <button
              onClick={() => navigate('/end-trip')}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              End Trip
            </button>
            <button
              onClick={abandonTrip}
              className="w-full text-red-500 py-2 text-sm hover:underline"
            >
              Abandon Trip &amp; Start New
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Start form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">HOS Logger</h1>
        <p className="text-gray-500 mb-6 text-sm">Driver's daily log sheet generator</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <LocationAutocomplete
            label="Current Location"
            placeholder="e.g. Dallas, TX"
            value={form.current_location}
            onChange={setField('current_location')}
            error={fieldErrors['current_location']}
          />
          <LocationAutocomplete
            label="Pickup Location"
            placeholder="e.g. Shreveport, LA"
            value={form.pickup}
            onChange={setField('pickup')}
            error={fieldErrors['pickup']}
          />
          <LocationAutocomplete
            label="Destination"
            placeholder="e.g. Atlanta, GA"
            value={form.destination}
            onChange={setField('destination')}
            error={fieldErrors['destination']}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Cycle Hours Used (0–70)
            </label>
            <input
              type="number"
              min={0}
              max={70}
              step={0.5}
              placeholder="e.g. 42.5"
              value={form.cycle_hours_used}
              onChange={(e) => setField('cycle_hours_used')(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {fieldErrors['cycle_hours_used'] && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors['cycle_hours_used']}</p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
          >
            {loading ? 'Getting Route...' : 'Start Trip'}
          </button>
        </div>
      </div>
    </div>
  )
}
