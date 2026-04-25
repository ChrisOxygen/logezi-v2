import { useState } from 'react'
import type { LogEntry, DutyStatus } from '@/shared/types'
import { DUTY_STATUS_LABELS } from '@/shared/types'
import { LocationAutocomplete } from '@/shared/components/LocationAutocomplete'

const VALID_MINUTES = new Set(['00', '15', '30', '45'])

function validateTime(value: string): string | null {
  const parts = value.split(':')
  if (parts.length !== 2) return 'Use HH:MM format'
  const [h, m] = parts
  if (!h || !m) return 'Use HH:MM format'
  const hour = parseInt(h, 10)
  if (isNaN(hour) || hour < 0 || hour > 23) return 'Hour must be 00–23'
  if (!VALID_MINUTES.has(m)) return 'Minutes must be 00, 15, 30, or 45'
  return null
}

interface Props {
  onAdd: (entry: LogEntry) => void
  loading: boolean
}

export function LogEntryForm({ onAdd, loading }: Props) {
  const [form, setForm] = useState<LogEntry>({
    time: '',
    status: 'OFF_DUTY',
    location: '',
    remarks: '',
    bracket: false,
  })
  const [timeError, setTimeError] = useState<string | null>(null)

  const handleSubmit = () => {
    const err = validateTime(form.time)
    if (err) { setTimeError(err); return }
    if (!form.location.trim()) return
    onAdd(form)
    setForm({ time: '', status: 'OFF_DUTY', location: '', remarks: '', bracket: false })
    setTimeError(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Time (HH:MM)</label>
          <input
            type="text"
            placeholder="06:30"
            value={form.time}
            onChange={(e) => { setForm((f) => ({ ...f, time: e.target.value })); setTimeError(null) }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {timeError && <p className="text-red-500 text-xs mt-1">{timeError}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Duty Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as DutyStatus }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(DUTY_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <LocationAutocomplete
        label="Location (City, State)"
        placeholder="e.g. Green Bay, WI"
        value={form.location}
        onChange={(v) => setForm((f) => ({ ...f, location: v }))}
        labelClassName="text-xs text-gray-500"
      />

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Remarks</label>
        <input
          type="text"
          placeholder="e.g. Pre-trip inspection, Fuel stop..."
          value={form.remarks}
          onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={form.bracket}
          onChange={(e) => setForm((f) => ({ ...f, bracket: e.target.checked }))}
          className="rounded"
        />
        Truck did not move during this period (bracket)
      </label>

      <button
        onClick={handleSubmit}
        disabled={loading || !form.time || !form.location}
        className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Validating...' : '+ Add Entry'}
      </button>
    </div>
  )
}
