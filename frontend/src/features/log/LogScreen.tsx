import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTripStore } from '@/shared/store/tripStore'
import { validateEntry, isApiError } from '@/shared/api/client'
import type { LogEntry, ValidationResult } from '@/shared/types'
import { LogEntryForm } from './LogEntryForm'
import { LogEntryList } from './LogEntryList'
import { LogGrid } from './LogGrid'
import { HOSCounter } from './HOSCounter'

const DAY_FIELDS = [
  { key: 'driver_name', label: 'Driver Name' },
  { key: 'driver_number', label: 'Driver Number' },
  { key: 'tractor', label: 'Tractor No.' },
  { key: 'trailer', label: 'Trailer No.' },
  { key: 'shipper', label: 'Shipper', wide: true },
  { key: 'commodity', label: 'Commodity' },
  { key: 'load_number', label: 'Load Number' },
  { key: 'home_terminal', label: 'Home Terminal', wide: true },
  { key: 'co_driver', label: 'Co-Driver (or N/A)' },
] as const

export function LogScreen() {
  const navigate = useNavigate()
  const { trip, addEntry, removeEntry, updateDayHeader, updatePostTrip, completeCurrentDay, addDay, endTrip } =
    useTripStore()
  const currentDay = useTripStore((s) => s.currentDay())!

  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [validating, setValidating] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const handleAddEntry = async (entry: LogEntry) => {
    setValidating(true)
    setApiError(null)

    try {
      const result = await validateEntry({
        entries_so_far: currentDay.entries,
        new_entry: entry,
        cycle_hours_used: trip!.setup.cycle_hours_used,
        total_miles_today: currentDay.total_miles,
      })
      setValidation(result)
      addEntry(entry)
    } catch (err) {
      setApiError(isApiError(err) ? err.message : 'Failed to validate entry. Please try again.')
    } finally {
      setValidating(false)
    }
  }

  const handleSaveDay = () => {
    completeCurrentDay()
    addDay()
    navigate('/map')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-3xl mx-auto p-4 flex flex-col gap-6">

        {/* Day header fields */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Day {currentDay.day_number} — {currentDay.date}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {DAY_FIELDS.map(({ key, label, ...rest }) => (
              <div key={key} className={'wide' in rest && rest.wide ? 'col-span-2' : ''}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                <input
                  type="text"
                  value={currentDay[key] as string}
                  onChange={(e) => updateDayHeader({ [key]: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Total Miles Today</label>
              <input
                type="number"
                min={0}
                value={currentDay.total_miles}
                onChange={(e) => updateDayHeader({ total_miles: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Canvas grid */}
        <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">24-Hour Log Grid</h3>
          <LogGrid entries={currentDay.entries} />
        </div>

        <HOSCounter />

        {/* Validation messages */}
        {apiError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {apiError}
          </div>
        )}
        {validation && (
          <div className="flex flex-col gap-2">
            {validation.errors.map((e, i) => (
              <div key={i} className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                ⛔ {e}
              </div>
            ))}
            {validation.warnings.map((w, i) => (
              <div key={i} className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg p-3 text-sm">
                ⚠️ {w}
              </div>
            ))}
            {validation.fuel_reminder && (
              <div className="bg-orange-50 border border-orange-200 text-orange-700 rounded-lg p-3 text-sm">
                ⛽ Fuel reminder: log a fuel stop in remarks.
              </div>
            )}
          </div>
        )}

        {/* Add entry */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Add Log Entry</h3>
          <LogEntryForm onAdd={handleAddEntry} loading={validating} />
        </div>

        {/* Entry list */}
        {currentDay.entries.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Today's Entries ({currentDay.entries.length})
            </h3>
            <LogEntryList entries={currentDay.entries} onRemove={removeEntry} />
          </div>
        )}

        {/* Post-trip inspection */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Post-Trip Inspection</h3>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="defects"
                checked={currentDay.post_trip.defects === 'none'}
                onChange={() => updatePostTrip({ defects: 'none' })}
              />
              <span className="text-sm">No defects found</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="defects"
                checked={currentDay.post_trip.defects !== 'none'}
                onChange={() => updatePostTrip({ defects: '' })}
              />
              <span className="text-sm">Defects found — describe:</span>
            </label>
            {currentDay.post_trip.defects !== 'none' && (
              <textarea
                rows={3}
                value={currentDay.post_trip.defects}
                onChange={(e) => updatePostTrip({ defects: e.target.value })}
                placeholder="Describe the defects..."
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
        </div>

        {/* Day actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleSaveDay}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Save Day {currentDay.day_number} &amp; Add Day {currentDay.day_number + 1}
          </button>
          <button
            onClick={() => { endTrip(); navigate('/end-trip') }}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            End Trip &amp; Generate PDF
          </button>
        </div>
      </div>
    </div>
  )
}
