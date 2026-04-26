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
  { key: 'driver_name',   label: 'Driver Name' },
  { key: 'driver_number', label: 'Driver Number' },
  { key: 'tractor',       label: 'Tractor No.' },
  { key: 'trailer',       label: 'Trailer No.' },
  { key: 'shipper',       label: 'Shipper',           wide: true },
  { key: 'commodity',     label: 'Commodity' },
  { key: 'load_number',   label: 'Load Number' },
  { key: 'home_terminal', label: 'Home Terminal',     wide: true },
  { key: 'co_driver',     label: 'Co-Driver (or N/A)' },
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
    <div className="min-h-screen pb-16" style={{ background: 'var(--col-bg)' }}>
      <div className="max-w-3xl mx-auto p-4 flex flex-col gap-5">

        {/* Day header fields */}
        <div className="card p-6 anim-fade-up">
          <div className="flex items-baseline gap-3 mb-5">
            <h2
              className="font-display font-bold"
              style={{ fontSize: '1.5rem', color: 'var(--col-text)' }}
            >
              Day {currentDay.day_number}
            </h2>
            <span
              className="font-mono text-sm"
              style={{ color: 'var(--col-text-3)', fontFamily: 'JetBrains Mono, monospace' }}
            >
              {currentDay.date}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {DAY_FIELDS.map(({ key, label, ...rest }) => (
              <div key={key} className={'wide' in rest && rest.wide ? 'col-span-2' : ''}>
                <label className="field-label">{label}</label>
                <input
                  type="text"
                  value={currentDay[key] as string}
                  onChange={(e) => updateDayHeader({ [key]: e.target.value })}
                  className="field"
                />
              </div>
            ))}
            <div>
              <label className="field-label">Total Miles Today</label>
              <input
                type="number"
                min={0}
                value={currentDay.total_miles}
                onChange={(e) => updateDayHeader({ total_miles: parseFloat(e.target.value) || 0 })}
                className="field"
              />
            </div>
          </div>
        </div>

        {/* 24-hour canvas grid */}
        <div className="card p-5 overflow-x-auto anim-fade-up delay-1">
          <span className="section-label">24-Hour Log Grid</span>
          <div className="mt-3">
            <LogGrid entries={currentDay.entries} />
          </div>
        </div>

        {/* HOS gauge */}
        <div className="anim-fade-up delay-2">
          <HOSCounter />
        </div>

        {/* Validation messages */}
        {apiError && (
          <div className="alert alert-error anim-slide-down">
            <span>⚠</span>
            <span>{apiError}</span>
          </div>
        )}
        {validation && (
          <div className="flex flex-col gap-2">
            {validation.errors.map((e, i) => (
              <div key={i} className="alert alert-error anim-slide-down">
                <span>⛔</span><span>{e}</span>
              </div>
            ))}
            {validation.warnings.map((w, i) => (
              <div key={i} className="alert alert-warning anim-slide-down">
                <span>⚠️</span><span>{w}</span>
              </div>
            ))}
            {validation.fuel_reminder && (
              <div className="alert alert-fuel anim-slide-down">
                <span>⛽</span><span>Fuel reminder: log a fuel stop in remarks.</span>
              </div>
            )}
          </div>
        )}

        {/* Add entry form */}
        <div className="card p-6 anim-fade-up delay-3">
          <span className="section-label">Add Log Entry</span>
          <div className="mt-4">
            <LogEntryForm onAdd={handleAddEntry} loading={validating} />
          </div>
        </div>

        {/* Entry list */}
        {currentDay.entries.length > 0 && (
          <div className="card p-6 anim-fade-up delay-4">
            <div className="flex items-center justify-between mb-4">
              <span className="section-label">Today's Entries</span>
              <span
                className="font-display font-bold text-sm"
                style={{ color: 'var(--col-text-3)' }}
              >
                {currentDay.entries.length}
              </span>
            </div>
            <LogEntryList entries={currentDay.entries} onRemove={removeEntry} />
          </div>
        )}

        {/* Post-trip inspection */}
        <div className="card p-6 anim-fade-up delay-5">
          <span className="section-label">Post-Trip Inspection</span>
          <div className="flex flex-col gap-2.5 mt-3">
            <label
              className="flex items-center gap-3 cursor-pointer text-sm"
              style={{ color: 'var(--col-text)' }}
            >
              <input
                type="radio"
                name="defects"
                checked={currentDay.post_trip.defects === 'none'}
                onChange={() => updatePostTrip({ defects: 'none' })}
                style={{ accentColor: 'var(--col-amber)' }}
              />
              No defects found
            </label>
            <label
              className="flex items-center gap-3 cursor-pointer text-sm"
              style={{ color: 'var(--col-text)' }}
            >
              <input
                type="radio"
                name="defects"
                checked={currentDay.post_trip.defects !== 'none'}
                onChange={() => updatePostTrip({ defects: '' })}
                style={{ accentColor: 'var(--col-amber)' }}
              />
              Defects found — describe:
            </label>
            {currentDay.post_trip.defects !== 'none' && (
              <textarea
                rows={3}
                value={currentDay.post_trip.defects}
                onChange={(e) => updatePostTrip({ defects: e.target.value })}
                placeholder="Describe the defects…"
                className="field"
              />
            )}
          </div>
        </div>

        {/* Day actions */}
        <div className="flex flex-col gap-3 anim-fade-up delay-5">
          <button className="btn btn-navy" onClick={handleSaveDay}>
            Save Day {currentDay.day_number} &amp; Add Day {currentDay.day_number + 1}
          </button>
          <button className="btn btn-green" onClick={() => endTrip()}>
            End Trip &amp; Generate PDF
          </button>
        </div>

      </div>
    </div>
  )
}
