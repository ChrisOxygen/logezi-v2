import type { LogEntry, DutyStatus } from '@/shared/types'

/** Parse "HH:MM" into total minutes from midnight. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

/** Sum minutes spent in a given status across a sorted entries array. */
export function minutesInStatus(entries: LogEntry[], status: DutyStatus): number {
  if (entries.length === 0) return 0
  const sorted = [...entries].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
  let total = 0

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i]!
    if (entry.status !== status) continue
    const start = timeToMinutes(entry.time)
    const end = i + 1 < sorted.length ? timeToMinutes(sorted[i + 1]!.time) : 24 * 60
    total += Math.max(0, end - start)
  }

  return total
}

/** Decimal hours for a given status today. */
export function hoursInStatus(entries: LogEntry[], status: DutyStatus): number {
  return minutesInStatus(entries, status) / 60
}
