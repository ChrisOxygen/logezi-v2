import type { LogEntry } from '@/shared/types'
import { DUTY_STATUS_LABELS, DUTY_STATUS_COLORS } from '@/shared/types'

interface Props {
  entries: LogEntry[]
  onRemove: (index: number) => void
}

export function LogEntryList({ entries, onRemove }: Props) {
  const sorted = entries
    .map((entry, originalIndex) => ({ entry, originalIndex }))
    .sort((a, b) => a.entry.time.localeCompare(b.entry.time))

  return (
    <div className="flex flex-col">
      {sorted.map(({ entry, originalIndex }) => {
        const isAnchor = originalIndex === 0
        const color = DUTY_STATUS_COLORS[entry.status]

        return (
          <div key={originalIndex} className="entry-row">
            {/* Left: colored status stripe + time */}
            <div className="flex items-start gap-3 min-w-0 flex-1">
              {/* Status color bar */}
              <div
                className="shrink-0 w-0.5 self-stretch rounded-full mt-0.5"
                style={{ background: color, minHeight: '36px' }}
              />

              {/* Time */}
              <span
                className="shrink-0 text-sm font-semibold pt-0.5"
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  color: 'var(--col-text)',
                  minWidth: '3.2rem',
                }}
              >
                {entry.time}
              </span>

              {/* Details */}
              <div className="min-w-0 flex-1">
                <span
                  className="badge"
                  style={{
                    background: color + '18',
                    color,
                    marginBottom: '3px',
                    display: 'inline-flex',
                  }}
                >
                  {DUTY_STATUS_LABELS[entry.status]}
                </span>

                {entry.location && (
                  <p className="text-xs truncate" style={{ color: 'var(--col-text-2)' }}>
                    {entry.location}
                  </p>
                )}
                {entry.remarks && (
                  <p className="text-xs truncate" style={{ color: 'var(--col-text-3)' }}>
                    {entry.remarks}
                  </p>
                )}
                <div className="flex gap-2 mt-0.5">
                  {entry.bracket && (
                    <span className="text-xs" style={{ color: 'var(--col-amber)', fontWeight: 600 }}>
                      [bracket]
                    </span>
                  )}
                  {isAnchor && (
                    <span className="text-xs italic" style={{ color: 'var(--col-text-3)' }}>
                      start of day
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Remove button */}
            {!isAnchor && (
              <button
                onClick={() => onRemove(originalIndex)}
                className="btn-ghost-danger shrink-0"
                aria-label="Remove entry"
              >
                Remove
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
