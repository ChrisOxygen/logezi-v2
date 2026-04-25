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
    <div className="flex flex-col gap-2">
      {sorted.map(({ entry, originalIndex }) => {
        const isAnchor = originalIndex === 0

        return (
          <div
            key={originalIndex}
            className="flex items-start justify-between gap-3 py-2 border-b border-gray-100 last:border-0"
          >
            <div className="flex items-start gap-3 min-w-0">
              <span className="text-sm font-mono font-semibold text-gray-800 shrink-0">
                {entry.time}
              </span>
              <div className="min-w-0">
                <span
                  className="inline-block text-xs font-medium px-2 py-0.5 rounded-full text-white mb-1"
                  style={{ backgroundColor: DUTY_STATUS_COLORS[entry.status] }}
                >
                  {DUTY_STATUS_LABELS[entry.status]}
                </span>
                {entry.location && (
                  <p className="text-xs text-gray-600 truncate">{entry.location}</p>
                )}
                {entry.remarks && (
                  <p className="text-xs text-gray-400 truncate">{entry.remarks}</p>
                )}
                {entry.bracket && (
                  <p className="text-xs text-blue-500">[bracket]</p>
                )}
                {isAnchor && (
                  <p className="text-xs text-gray-300 italic">auto-generated start</p>
                )}
              </div>
            </div>

            {!isAnchor && (
              <button
                onClick={() => onRemove(originalIndex)}
                className="text-red-400 hover:text-red-600 text-xs shrink-0 mt-0.5"
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
