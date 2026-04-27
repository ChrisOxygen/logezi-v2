import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTripStore } from '@/shared/store/tripStore'
import { getRoute, isApiError } from '@/shared/api/client'
import { LocationAutocomplete } from '@/shared/components/LocationAutocomplete'
import type { ActiveTrip } from '@/shared/types'
import { TEST_TRIP } from '@/shared/utils/testData'

interface Form {
  current_location: string
  pickup: string
  destination: string
  cycle_hours_used: string
}

export function HomeScreen() {
  const navigate = useNavigate()
  const { trip, startTrip, abandonTrip, seedTestData } = useTripStore()

  const [form, setForm] = useState<Form>({
    current_location: '',
    pickup: '',
    destination: '',
    cycle_hours_used: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleLoadTestData = () => {
    seedTestData(TEST_TRIP)
    navigate('/end-trip')
  }

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
            carrier_name: '',
            home_terminal: '',
            tractor: '',
            trailer: '',
            shipper: '',
            commodity: '',
            load_number: '',
            total_miles: 0,
            entries: [{
              time: '00:00',
              status: 'OFF_DUTY',
              location: `${result.locations.current.city}, ${result.locations.current.state}`,
              remarks: '',
              bracket: false,
            }],
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

  // ── Active trip ─────────────────────────────────────────────────────────────
  if (trip) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'var(--col-bg)' }}
      >
        <div className="card p-7 w-full max-w-md anim-fade-up">
          {/* accent stripe */}
          <div
            className="h-1 rounded-full mb-6"
            style={{ background: 'var(--col-amber)', width: '48px' }}
          />

          <span className="section-label">Active Trip</span>
          <h2
            className="font-display font-bold mt-1 mb-1"
            style={{ fontSize: '1.5rem', color: 'var(--col-text)' }}
          >
            {trip.setup.pickup}
            <span style={{ color: 'var(--col-text-3)', fontWeight: 600 }}> → </span>
            {trip.setup.destination}
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--col-text-3)' }}>
            Day {trip.current_day} &bull;{' '}
            {trip.days.filter((d) => d.completed).length} day(s) completed
          </p>

          <div className="flex flex-col gap-3">
            <button className="btn btn-amber" onClick={() => navigate('/map')}>
              Resume Trip
            </button>
            <button className="btn btn-navy" onClick={() => navigate('/log')}>
              Day {trip.current_day} Log Sheet
            </button>
            <button className="btn btn-green" onClick={() => navigate('/end-trip')}>
              End Trip
            </button>
            <button
              onClick={abandonTrip}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--col-red)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '0.4rem 0',
                textAlign: 'center',
              }}
            >
              Abandon &amp; Start New Trip
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Start form ──────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--col-bg)' }}
    >
      <div className="w-full max-w-md">

        {/* Hero heading — outside card */}
        <div className="text-center mb-7 anim-fade-up">
          <h1
            className="font-display font-extrabold tracking-tight"
            style={{ fontSize: '2.6rem', color: 'var(--col-navy)', lineHeight: 1.05 }}
          >
            Driver's Daily
            <br />
            <span style={{ color: 'var(--col-amber)' }}>HOS Log</span>
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--col-text-2)' }}>
            FMCSA-compliant log sheet generator — 70 hr / 8-day cycle
          </p>
        </div>

        <div className="card p-7 anim-fade-up delay-1">
          <span className="section-label">New Trip Setup</span>

          {error && (
            <div className="alert alert-error mt-4">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-4 mt-4">
            <div className="anim-fade-up delay-2">
              <LocationAutocomplete
                label="Current Location"
                placeholder="e.g. Dallas, TX"
                value={form.current_location}
                onChange={setField('current_location')}
                error={fieldErrors['current_location']}
              />
            </div>

            <div className="anim-fade-up delay-3">
              <LocationAutocomplete
                label="Pickup Location"
                placeholder="e.g. Shreveport, LA"
                value={form.pickup}
                onChange={setField('pickup')}
                error={fieldErrors['pickup']}
              />
            </div>

            <div className="anim-fade-up delay-4">
              <LocationAutocomplete
                label="Destination"
                placeholder="e.g. Atlanta, GA"
                value={form.destination}
                onChange={setField('destination')}
                error={fieldErrors['destination']}
              />
            </div>

            <div className="anim-fade-up delay-5">
              <label className="field-label">Cycle Hours Used (0–70)</label>
              <input
                type="number"
                min={0}
                max={70}
                step={0.5}
                placeholder="e.g. 42.5"
                value={form.cycle_hours_used}
                onChange={(e) => setField('cycle_hours_used')(e.target.value)}
                className="field"
              />
              {fieldErrors['cycle_hours_used'] && (
                <p className="text-xs mt-1" style={{ color: 'var(--col-red)' }}>
                  {fieldErrors['cycle_hours_used']}
                </p>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn btn-amber mt-1 anim-fade-up delay-5"
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  Getting Route…
                </>
              ) : 'Start Trip'}
            </button>

            {import.meta.env.DEV && (
              <button
                onClick={handleLoadTestData}
                className="btn btn-outline anim-fade-up delay-5"
                style={{ fontSize: '0.82rem', opacity: 0.7 }}
              >
                Load Test Data (Dev)
              </button>
            )}
          </div>
        </div>

        {/* Compliance footnote */}
        <p className="text-center mt-5 text-xs anim-fade-up delay-5" style={{ color: 'var(--col-text-3)' }}>
          Property carrier · 11-hr driving / 14-hr window · 30-min break rule
        </p>
      </div>
    </div>
  )
}
