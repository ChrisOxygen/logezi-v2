import { useState } from 'react'
import type { LogEntry, DutyStatus } from '@/shared/types'
import { DUTY_STATUS_LABELS, DUTY_STATUS_COLORS } from '@/shared/types'
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

  const statusColor = DUTY_STATUS_COLORS[form.status]

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label">Time (HH:MM)</label>
          <input
            type="text"
            placeholder="06:30"
            value={form.time}
            onChange={(e) => { setForm((f) => ({ ...f, time: e.target.value })); setTimeError(null) }}
            className="field"
            style={{ fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}
          />
          {timeError && (
            <p className="text-xs mt-1" style={{ color: 'var(--col-red)' }}>{timeError}</p>
          )}
        </div>

        <div>
          <label className="field-label">Duty Status</label>
          {/* Status selector with color preview strip */}
          <div className="relative">
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-md"
              style={{ background: statusColor }}
            />
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as DutyStatus }))}
              className="field"
              style={{ paddingLeft: '1.1rem' }}
            >
              {Object.entries(DUTY_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <LocationAutocomplete
        label="Location (City, State)"
        placeholder="e.g. Green Bay, WI"
        value={form.location}
        onChange={(v) => setForm((f) => ({ ...f, location: v }))}
      />

      <div>
        <label className="field-label">Remarks</label>
        <input
          type="text"
          placeholder="e.g. Pre-trip inspection, Fuel stop…"
          value={form.remarks}
          onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
          className="field"
        />
      </div>

      <label
        className="flex items-center gap-2.5 cursor-pointer select-none text-sm"
        style={{ color: 'var(--col-text-2)' }}
      >
        <input
          type="checkbox"
          checked={form.bracket}
          onChange={(e) => setForm((f) => ({ ...f, bracket: e.target.checked }))}
          style={{ accentColor: 'var(--col-amber)', width: '15px', height: '15px' }}
        />
        Truck did not move during this period (bracket)
      </label>

      <button
        onClick={handleSubmit}
        disabled={loading || !form.time || !form.location}
        className="btn btn-amber"
        style={{ fontSize: '0.9rem' }}
      >
        {loading ? (
          <>
            <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            Validating…
          </>
        ) : '+ Add Entry'}
      </button>
    </div>
  )
}
