import { useTripStore } from '@/shared/store/tripStore'
import { hoursInStatus } from '@/shared/utils/hos'

export function HOSCounter() {
  const trip = useTripStore((s) => s.trip)
  const currentDay = useTripStore((s) => s.currentDay())

  if (!trip || !currentDay) return null

  const drivingToday = hoursInStatus(currentDay.entries, 'DRIVING')
  const onDutyToday  = drivingToday + hoursInStatus(currentDay.entries, 'ON_DUTY')
  const totalCycle   = Math.min(trip.setup.cycle_hours_used + onDutyToday, 70)
  const remaining    = Math.max(70 - totalCycle, 0)
  const pct          = Math.min((totalCycle / 70) * 100, 100)

  const fillColor =
    remaining < 10 ? 'var(--col-red)'
    : remaining < 20 ? '#d97706'
    : 'var(--col-green)'

  const statusLabel =
    remaining < 10 ? 'Critical'
    : remaining < 20 ? 'Low'
    : 'Available'

  const statusBg =
    remaining < 10 ? 'var(--col-red-pale)'
    : remaining < 20 ? 'var(--col-amber-pale)'
    : 'var(--col-green-pale)'

  const statusTextColor =
    remaining < 10 ? 'var(--col-red)'
    : remaining < 20 ? 'var(--col-amber-dim)'
    : 'var(--col-green)'

  return (
    <div className="card p-5 anim-fade-up">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="section-label">70 hr / 8-Day Cycle</span>
          <div
            className="font-display font-bold mt-0.5"
            style={{ fontSize: '1.6rem', color: 'var(--col-text)', lineHeight: 1 }}
          >
            {remaining.toFixed(1)}
            <span className="text-sm font-sans font-normal ml-1" style={{ color: 'var(--col-text-3)' }}>
              hrs left
            </span>
          </div>
        </div>
        <span
          className="badge"
          style={{ background: statusBg, color: statusTextColor }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Gauge bar */}
      <div className="hos-gauge-track">
        <div
          className="hos-gauge-fill anim-bar-grow"
          style={{ width: `${pct}%`, background: fillColor }}
        />
      </div>

      {/* Detail row */}
      <div className="flex justify-between mt-2.5">
        <span className="text-xs" style={{ color: 'var(--col-text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
          {totalCycle.toFixed(1)} / 70 used
        </span>
        <span className="text-xs" style={{ color: 'var(--col-text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
          Today: {drivingToday.toFixed(1)} driving · {onDutyToday.toFixed(1)} on-duty
        </span>
      </div>

      {/* Tick marks */}
      <div className="flex justify-between mt-1.5 px-0.5">
        {[0, 10, 20, 30, 40, 50, 60, 70].map((h) => (
          <span
            key={h}
            className="text-xs"
            style={{ color: 'var(--col-border)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem' }}
          >
            {h}
          </span>
        ))}
      </div>
    </div>
  )
}
