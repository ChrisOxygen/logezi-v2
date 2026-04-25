import { useTripStore } from '@/shared/store/tripStore'
import { hoursInStatus } from '@/shared/utils/hos'

export function HOSCounter() {
  const trip = useTripStore((s) => s.trip)
  const currentDay = useTripStore((s) => s.currentDay())

  if (!trip || !currentDay) return null

  const drivingToday = hoursInStatus(currentDay.entries, 'DRIVING')
  const onDutyToday =
    drivingToday + hoursInStatus(currentDay.entries, 'ON_DUTY')

  const totalCycle = Math.min(trip.setup.cycle_hours_used + onDutyToday, 70)
  const remaining = Math.max(70 - totalCycle, 0)
  const pct = (totalCycle / 70) * 100

  const barColor =
    remaining < 10
      ? 'bg-red-500'
      : remaining < 20
        ? 'bg-yellow-500'
        : 'bg-green-500'

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium text-gray-700">70 hr / 8-Day Cycle</span>
        <span className="text-gray-500">{remaining.toFixed(1)} hrs remaining</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{totalCycle.toFixed(1)} / 70 hrs used</span>
        <span>Today: {drivingToday.toFixed(1)} driving / {onDutyToday.toFixed(1)} on-duty</span>
      </div>
    </div>
  )
}
