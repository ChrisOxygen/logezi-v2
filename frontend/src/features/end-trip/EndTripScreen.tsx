import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTripStore } from '@/shared/store/tripStore'
import { generateLogPDF, isApiError } from '@/shared/api/client'
import { TripMap } from '@/features/map/TripMap'

export function EndTripScreen() {
  const navigate = useNavigate()
  const { trip, endTrip } = useTripStore()
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!trip) {
    navigate('/')
    return null
  }

  const handleDownloadPDF = async () => {
    setDownloading(true)
    setError(null)
    try {
      const blob = await generateLogPDF(trip.days)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'driver_log.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to generate PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const handleStartNew = () => {
    endTrip()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="h-[40vh]">
        <TripMap trip={trip} />
      </div>

      <div className="max-w-2xl mx-auto p-4 flex flex-col gap-6">
        {/* Trip summary */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Trip Complete</h2>
          <p className="text-gray-500 text-sm mb-4">
            {trip.setup.current_location} &rarr; {trip.setup.pickup} &rarr;{' '}
            {trip.setup.destination}
          </p>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-gray-400">Total Miles</p>
              <p className="font-bold text-lg">{Math.round(trip.route.total_miles)}</p>
            </div>
            <div>
              <p className="text-gray-400">Days Logged</p>
              <p className="font-bold text-lg">{trip.days.length}</p>
            </div>
          </div>
        </div>

        {/* Per-day summaries */}
        {trip.days.map((day) => (
          <div key={day.day_number} className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              Day {day.day_number} — {day.date}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                { label: 'Driver', value: day.driver_name },
                { label: 'Tractor', value: day.tractor },
                { label: 'Miles', value: String(day.total_miles) },
                { label: 'Entries', value: String(day.entries.length) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <span className="text-gray-400">{label}: </span>
                  <span className="font-medium">{value || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {downloading ? 'Generating PDF...' : 'Download Log Sheets (PDF)'}
          </button>
          <button
            onClick={handleStartNew}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Start New Trip
          </button>
        </div>
      </div>
    </div>
  )
}
