import type { DayLog, DriversDailyLog, DutySegment, RemarkEntry } from '@/shared/types'
import { DUTY_STATUS_LABELS } from '@/shared/types'
import { hoursInStatus, timeToMinutes } from './hos'

function timeToFractional(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) + (m ?? 0) / 60
}

function parseDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return { month: month ?? 1, day: day ?? 1, year: year ?? 2024 }
}

export function buildDriversDailyLog(day: DayLog): DriversDailyLog {
  const sorted = [...day.entries].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))

  const dutySegments: DutySegment[] = sorted.map((entry, i) => ({
    startHour: timeToFractional(entry.time),
    endHour: i + 1 < sorted.length ? timeToFractional(sorted[i + 1]!.time) : 24,
    status: entry.status,
  }))

  const remarks: RemarkEntry[] = sorted
    .filter((e) => e.location.trim() !== '')
    .map((e) => ({
      timeHour: timeToFractional(e.time),
      location: e.location,
      activity: e.remarks.trim() !== '' ? e.remarks : DUTY_STATUS_LABELS[e.status],
    }))

  const hoursSummary = {
    offDuty: hoursInStatus(day.entries, 'OFF_DUTY'),
    sleeperBerth: hoursInStatus(day.entries, 'SLEEPER_BERTH'),
    driving: hoursInStatus(day.entries, 'DRIVING'),
    onDutyNotDriving: hoursInStatus(day.entries, 'ON_DUTY_NOT_DRIVING'),
  }

  return {
    header: {
      date: parseDate(day.date),
      totalMilesDrivingToday: day.total_miles,
      carrierName: day.carrier_name,
      mainOfficeAddress: day.home_terminal,
      driverSignature: day.driver_name,
      coDriverName: day.co_driver && day.co_driver !== 'N/A' ? day.co_driver : null,
      tractor: day.tractor,
      trailer: day.trailer,
    },
    dutySegments,
    hoursSummary,
    remarks,
    footer: {
      shippingNumber: day.load_number,
      shipper: day.shipper,
      commodity: day.commodity,
      loadNumber: day.load_number,
    },
  }
}
