// ─── Duty Status ──────────────────────────────────────────────────────────────
export type DutyStatus =
  | 'OFF_DUTY'
  | 'SLEEPER_BERTH'
  | 'DRIVING'
  | 'ON_DUTY_NOT_DRIVING'

export const DUTY_STATUS_LABELS: Record<DutyStatus, string> = {
  OFF_DUTY: '1. Off Duty',
  SLEEPER_BERTH: '2. Sleeper Berth',
  DRIVING: '3. Driving',
  ON_DUTY_NOT_DRIVING: '4. On Duty (Not Driving)',
}

export const DUTY_STATUS_COLORS: Record<DutyStatus, string> = {
  OFF_DUTY: '#6b7280',
  SLEEPER_BERTH: '#3b82f6',
  DRIVING: '#ef4444',
  ON_DUTY_NOT_DRIVING: '#f59e0b',
}

// ─── Log Entry ────────────────────────────────────────────────────────────────
export interface LogEntry {
  time: string        // HH:MM — only 00, 15, 30, 45 minutes allowed
  status: DutyStatus
  location: string
  remarks: string
  bracket: boolean    // true if truck did not move during this period
}

// ─── Post Trip ────────────────────────────────────────────────────────────────
export interface PostTrip {
  defects: string     // 'none' or description
}

// ─── Day Log ──────────────────────────────────────────────────────────────────
export interface DayLog {
  day_number: number
  date: string        // YYYY-MM-DD
  driver_name: string
  driver_number: string
  co_driver: string
  carrier_name: string
  home_terminal: string
  tractor: string
  trailer: string
  shipper: string
  commodity: string
  load_number: string
  total_miles: number
  entries: LogEntry[]
  post_trip: PostTrip
  completed: boolean
}

// ─── Geocoded Location ────────────────────────────────────────────────────────
export interface GeoLocation {
  lat: number
  lng: number
  display_name: string
  city: string
  state: string
}

// ─── Route ────────────────────────────────────────────────────────────────────
export interface RouteLeg {
  miles: number
  duration_hrs: number
}

export interface Route {
  total_miles: number
  total_duration_hrs: number
  geometry: GeoJSON.LineString
  legs: RouteLeg[]
}

// ─── Active Trip ──────────────────────────────────────────────────────────────
export interface TripSetup {
  current_location: string
  pickup: string
  destination: string
  cycle_hours_used: number
}

export interface ActiveTrip {
  created_at: string
  setup: TripSetup
  locations: {
    current: GeoLocation
    pickup: GeoLocation
    destination: GeoLocation
  }
  route: Route
  days: DayLog[]
  current_day: number
}

// ─── API Responses ────────────────────────────────────────────────────────────
export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    fields?: Record<string, string>
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ─── HOS Totals ───────────────────────────────────────────────────────────────
export interface HoursEntry {
  hours: number
  minutes: number
  decimal: number
}

export interface DayTotals {
  off_duty: HoursEntry
  sleeper_berth: HoursEntry
  driving: HoursEntry
  on_duty_not_driving: HoursEntry
  total: HoursEntry
  hos_total: number
}

// ─── Validation Result ────────────────────────────────────────────────────────
export interface ValidationResult {
  valid: boolean
  warnings: string[]
  errors: string[]
  fuel_reminder: boolean
  hours_summary: {
    driving_today: number
    on_duty_today: number
    total_on_duty_cycle: number
    cycle_remaining: number
  }
}

// ─── Driver's Daily Log (DriversDailyLog) ─────────────────────────────────────

export interface DutySegment {
  /** Start time in fractional hours e.g. 6.5 = 06:30 */
  startHour: number
  /** End time in fractional hours e.g. 14.25 = 14:15 */
  endHour: number
  status: DutyStatus
}

export interface RemarkEntry {
  /** Position on timeline in fractional hours e.g. 11.5 = 11:30 */
  timeHour: number
  location: string
  activity: string
}

export interface HoursSummary {
  offDuty: number
  sleeperBerth: number
  driving: number
  onDutyNotDriving: number
}

export interface DDLDate {
  month: number
  day: number
  year: number
}

export interface DDLHeader {
  date: DDLDate
  totalMilesDrivingToday: number
  carrierName: string
  mainOfficeAddress: string
  driverSignature: string
  coDriverName: string | null
  tractor: string
  trailer: string
}

export interface DDLFooter {
  shippingNumber: string
  shipper: string
  commodity: string
  loadNumber: string
}

export interface DriversDailyLog {
  header: DDLHeader
  dutySegments: DutySegment[]
  hoursSummary: HoursSummary
  remarks: RemarkEntry[]
  footer: DDLFooter
}
