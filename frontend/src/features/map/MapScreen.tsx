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
    <div className="min-h-screen bg-gray-50">
      <div className="h-[55vh]">
        <TripMap trip={trip} />
      </div>

      <div className="p-4 max-w-2xl mx-auto flex flex-col gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500 mb-1">
            {trip.setup.current_location} &rarr; {trip.setup.pickup} &rarr;{' '}
            {trip.setup.destination}
          </p>
          <div className="flex gap-4 text-sm">
            <span className="font-semibold">{totalMiles} miles total</span>
            <span className="text-gray-400">&bull;</span>
            <span>{completedDays} of {trip.days.length} day(s) logged</span>
          </div>
        </div>

        <HOSCounter />

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/log')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Go to Day {trip.current_day} Log Sheet
          </button>
          <button
            onClick={handleEndTrip}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            End Trip &amp; Generate PDF
          </button>
        </div>
      </div>
    </div>
  )
}
