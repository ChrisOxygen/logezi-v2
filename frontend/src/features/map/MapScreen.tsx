import { useNavigate } from 'react-router-dom'
import { useTripStore } from '@/shared/store/tripStore'
import { TripMap } from './TripMap'
import { HOSCounter } from '@/features/log/HOSCounter'

export function MapScreen() {
  const navigate = useNavigate()
  const trip = useTripStore((s) => s.trip)!
  const endTrip = useTripStore((s) => s.endTrip)

  const completedDays = trip.days.filter((d) => d.completed).length
  const totalMiles = Math.round(trip.route.total_miles)

  const handleEndTrip = () => {
    endTrip()
    navigate('/end-trip')
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--col-bg)' }}>
      {/* Map */}
      <div className="h-[52vh]">
        <TripMap trip={trip} />
      </div>

      <div className="max-w-2xl mx-auto p-4 flex flex-col gap-4">

        {/* Route summary card */}
        <div className="card p-5 anim-fade-up">
          <span className="section-label">Active Route</span>
          <p
            className="mt-1.5 text-sm font-medium"
            style={{ color: 'var(--col-text-2)' }}
          >
            {trip.setup.current_location}
            <span style={{ color: 'var(--col-amber)', margin: '0 0.35rem' }}>→</span>
            {trip.setup.pickup}
            <span style={{ color: 'var(--col-amber)', margin: '0 0.35rem' }}>→</span>
            {trip.setup.destination}
          </p>

          <div
            className="mt-4 flex gap-6 pt-4"
            style={{ borderTop: '1px solid var(--col-border-2)' }}
          >
            <div className="stat-tile">
              <span className="stat-tile-label">Total Miles</span>
              <span className="stat-tile-value">{totalMiles}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Day</span>
              <span className="stat-tile-value">{trip.current_day}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Logged</span>
              <span className="stat-tile-value">{completedDays}</span>
            </div>
          </div>
        </div>

        {/* HOS gauge */}
        <div className="anim-fade-up delay-1">
          <HOSCounter />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 anim-fade-up delay-2">
          <button className="btn btn-amber" onClick={() => navigate('/log')}>
            Day {trip.current_day} Log Sheet
          </button>
          <button className="btn btn-green" onClick={handleEndTrip}>
            End Trip &amp; Generate PDF
          </button>
        </div>

      </div>
    </div>
  )
}
