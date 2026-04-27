import jsPDF from 'jspdf'
import type { DayLog, LogEntry } from '@/shared/types'
import { hoursInStatus, timeToMinutes } from './hos'

// ── Page dimensions (mm, Letter portrait) ────────────────────────────────────
const PW = 215.9
const ML = 8   // left margin
const MR = 8   // right margin

// ── ELD grid geometry (mm) ────────────────────────────────────────────────────
const GRID_LEFT = 32      // x: left edge of 24-hour grid
const GRID_RIGHT = 193    // x: right edge of grid
const GRID_W = GRID_RIGHT - GRID_LEFT  // 161mm
const GRID_TOP = 100      // y: top of first row
const ROW_H = 9.5         // mm per duty-status row
const GRID_BOTTOM = GRID_TOP + 4 * ROW_H  // 138mm

const ROW_ORDER = [
  'OFF_DUTY',
  'SLEEPER_BERTH',
  'DRIVING',
  'ON_DUTY_NOT_DRIVING',
] as const
type RowKey = (typeof ROW_ORDER)[number]

// ── Coordinate helpers ────────────────────────────────────────────────────────
function rowCenterY(s: RowKey): number {
  return GRID_TOP + ROW_ORDER.indexOf(s) * ROW_H + ROW_H / 2
}

function timeToX(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return GRID_LEFT + ((h ?? 0) + (m ?? 0) / 60) / 24 * GRID_W
}

function hrToX(hour: number): number {
  return GRID_LEFT + (hour / 24) * GRID_W
}

function fmtHrs(h: number): string {
  // Rounds to nearest quarter-hour then strips trailing zeros: 10.0 → "10", 7.75 → "7.75"
  const rounded = Math.round(h * 4) / 4
  return rounded % 1 === 0 ? String(rounded) : String(rounded)
}

function parseDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return { month: m ?? 1, day: d ?? 1, year: y ?? 2024 }
}

// ── Hour label helper (12-hour display) ───────────────────────────────────────
function hourLabel(h: number): string {
  if (h === 0) return 'Midnight'
  if (h === 12) return 'Noon'
  return String(h <= 12 ? h : h - 12)
}

// ════════════════════════════════════════════════════════════════════════════
//  HEADER
// ════════════════════════════════════════════════════════════════════════════
function drawHeader(doc: jsPDF, day: DayLog): void {
  // ── Top bar ───────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(5)
  doc.setTextColor(0)
  doc.text('U.S. DEPARTMENT OF TRANSPORTATION', ML, 8)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5)
  doc.text('ORIGINAL — Submit to carrier within 13 days', PW - MR, 7, { align: 'right' })
  doc.text('DUPLICATE — Driver retains possession for eight days', PW - MR, 10.5, { align: 'right' })

  // ── Title ─────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text("DRIVER'S DAILY LOG", PW / 2, 16, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text('(ONE CALENDAR DAY — 24 HOURS)', PW / 2, 22, { align: 'center' })

  // Separator
  doc.setLineWidth(0.3)
  doc.setDrawColor(0)
  doc.line(ML, 25, PW - MR, 25)

  // ── Date / Miles / Vehicle row ────────────────────────────────────────────
  const d = parseDate(day.date)
  const mm = String(d.month).padStart(2, '0')
  const dd = String(d.day).padStart(2, '0')
  const yyyy = String(d.year)

  // Date values — large
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(mm, 17, 36, { align: 'center' })
  doc.text(dd, 33, 36, { align: 'center' })
  doc.text(yyyy, 60, 36, { align: 'center' })

  // Date underlines
  doc.setLineWidth(0.4)
  doc.line(8, 37.5, 26, 37.5)
  doc.line(27, 37.5, 39, 37.5)
  doc.line(42, 37.5, 78, 37.5)

  // Date labels
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5)
  doc.text('(MONTH)', 17, 41, { align: 'center' })
  doc.text('(DAY)', 33, 41, { align: 'center' })
  doc.text('(YEAR)', 60, 41, { align: 'center' })

  // Total miles — centre column
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(String(day.total_miles || 0), PW / 2, 36, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5)
  doc.text('(TOTAL MILES DRIVING TODAY)', PW / 2, 41, { align: 'center' })

  // Vehicle numbers — right column
  const vehicles = [day.tractor, day.trailer].filter(Boolean).join(', ') || '—'
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(vehicles, PW - MR, 36, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5)
  doc.text('VEHICLE NUMBERS—(SHOW EACH UNIT)', PW - MR, 41, { align: 'right' })

  // Separator
  doc.setLineWidth(0.3)
  doc.line(ML, 44, PW - MR, 44)

  // ── Carrier / Driver info ─────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.text('I certify that these entries are true and correct', PW * 0.60, 51, { align: 'left' })

  const halfX = PW / 2 + 2  // x dividing carrier (left) from driver (right)

  // Carrier name
  doc.setFont('times', 'bolditalic')
  doc.setFontSize(13)
  doc.text(day.carrier_name || 'N/A', PW / 4 + 4, 60, { align: 'center' })
  doc.setLineWidth(0.4)
  doc.line(ML, 62, halfX - 2, 62)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5)
  doc.text('(NAME OF CARRIER OR CARRIERS)', PW / 4 + 4, 65.5, { align: 'center' })

  // Driver signature
  doc.setFont('times', 'bolditalic')
  doc.setFontSize(13)
  doc.text(day.driver_name || '', PW * 0.76, 60, { align: 'center' })
  doc.setLineWidth(0.4)
  doc.line(halfX, 62, PW - MR, 62)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5)
  doc.text('(DRIVER\'S SIGNATURE IN FULL)', PW * 0.76, 65.5, { align: 'center' })

  // Home terminal address
  doc.setFont('times', 'bolditalic')
  doc.setFontSize(12)
  doc.text(day.home_terminal || '', PW / 4 + 4, 75, { align: 'center' })
  doc.setLineWidth(0.4)
  doc.line(ML, 77, halfX - 2, 77)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5)
  doc.text('(MAIN OFFICE ADDRESS)', PW / 4 + 4, 80, { align: 'center' })

  // Co-driver name
  const coDriver = day.co_driver && day.co_driver.trim() && day.co_driver !== 'N/A'
    ? day.co_driver
    : '—'
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(coDriver, PW * 0.76, 75, { align: 'center' })
  doc.setLineWidth(0.4)
  doc.line(halfX, 77, PW - MR, 77)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5)
  doc.text('(NAME OF CO_DRIVER)', PW * 0.76, 80, { align: 'center' })

  // "TOTAL HOURS" label — far right, above the totals column
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(5.5)
  doc.text('TOTAL', GRID_RIGHT + 2.5, GRID_TOP - 5, { align: 'left' })
  doc.text('HOURS', GRID_RIGHT + 2.5, GRID_TOP - 2, { align: 'left' })

  // Instruction text
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(5)
  doc.setTextColor(80)
  doc.text(
    'Each change of duty status must have a location in the "remarks" section. Use local time standard at home terminal.',
    PW / 2, 87, { align: 'center', maxWidth: GRID_W + 20 }
  )
  doc.setTextColor(0)
}

// ════════════════════════════════════════════════════════════════════════════
//  ELD GRID
// ════════════════════════════════════════════════════════════════════════════
function drawGridAndLabels(doc: jsPDF): void {
  doc.setDrawColor(0)
  doc.setTextColor(0)

  // Outer border
  doc.setLineWidth(0.5)
  doc.rect(GRID_LEFT, GRID_TOP, GRID_W, 4 * ROW_H)

  // Horizontal row dividers
  doc.setLineWidth(0.3)
  for (let i = 1; i < 4; i++) {
    const y = GRID_TOP + i * ROW_H
    doc.line(GRID_LEFT, y, GRID_RIGHT, y)
  }

  // Row labels (right-aligned, left of grid)
  const rowLabels: [RowKey, string[]][] = [
    ['OFF_DUTY',            ['Off', 'Duty']],
    ['SLEEPER_BERTH',       ['Sleeper', 'Berth']],
    ['DRIVING',             ['Driving']],
    ['ON_DUTY_NOT_DRIVING', ['On Duty', '(Not Driving)']],
  ]
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(5.5)
  for (const [key, lines] of rowLabels) {
    const cy = rowCenterY(key)
    const lineH = 2.3
    const startY = cy - ((lines.length - 1) * lineH) / 2 + 0.8
    for (let li = 0; li < lines.length; li++) {
      doc.text(lines[li]!, GRID_LEFT - 1.5, startY + li * lineH, { align: 'right' })
    }
  }

  // Hour labels above grid
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5)
  for (let h = 0; h < 24; h++) {
    const cx = hrToX(h + 0.5)
    doc.text(hourLabel(h), cx, GRID_TOP - 1.8, { align: 'center' })
  }

  // Hour vertical lines (full row height each)
  for (let h = 0; h <= 24; h++) {
    const x = hrToX(h)
    const isMajor = h % 6 === 0
    doc.setLineWidth(isMajor ? 0.4 : 0.2)
    doc.line(x, GRID_TOP, x, GRID_BOTTOM)
  }

  // Quarter-hour tick marks: at top AND bottom edges of every row
  doc.setLineWidth(0.15)
  for (let h = 0; h < 24; h++) {
    for (let q = 1; q <= 3; q++) {
      const x = hrToX(h + q / 4)
      const tickH = q === 2 ? ROW_H * 0.38 : ROW_H * 0.22  // half-hr taller than quarter-hr
      for (let r = 0; r < 4; r++) {
        const rowTop = GRID_TOP + r * ROW_H
        const rowBot = rowTop + ROW_H
        // Top edge → tick goes down
        doc.line(x, rowTop, x, rowTop + tickH)
        // Bottom edge → tick goes up
        doc.line(x, rowBot - tickH, x, rowBot)
      }
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  STATUS LINES
// ════════════════════════════════════════════════════════════════════════════
function drawStatusLines(doc: jsPDF, entries: LogEntry[]): void {
  if (entries.length === 0) return

  const sorted = [...entries].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))

  // DOT navy blue for all tracking lines
  doc.setDrawColor(26, 58, 110)

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i]!
    const status = entry.status as RowKey
    const x1 = timeToX(entry.time)
    const x2 = i + 1 < sorted.length ? timeToX(sorted[i + 1]!.time) : GRID_RIGHT
    const y = rowCenterY(status)

    // Horizontal status line
    doc.setLineWidth(0.65)
    doc.line(x1, y, x2, y)

    // Vertical transition line — clean 90° corner, no diagonal flags
    if (i + 1 < sorted.length) {
      const nextStatus = sorted[i + 1]!.status as RowKey
      const nextY = rowCenterY(nextStatus)
      doc.setLineWidth(0.65)
      doc.line(x2, y, x2, nextY)
    }

    // Bracket mark for "truck did not move"
    if (entry.bracket) {
      doc.setLineWidth(0.4)
      const bSz = 2.5
      doc.line(x1, y - bSz, x1, y + bSz)  // vertical bar
      doc.line(x1 - bSz, y - bSz, x1, y - bSz)  // horizontal arm
    }
  }

  // Reset draw color
  doc.setDrawColor(0)
}

// ════════════════════════════════════════════════════════════════════════════
//  TOTALS COLUMN
// ════════════════════════════════════════════════════════════════════════════
function drawTotals(doc: jsPDF, day: DayLog): void {
  const x = GRID_RIGHT + 3
  const statuses: RowKey[] = ['OFF_DUTY', 'SLEEPER_BERTH', 'DRIVING', 'ON_DUTY_NOT_DRIVING']

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(0)

  for (const status of statuses) {
    const h = hoursInStatus(day.entries, status)
    const cy = rowCenterY(status)
    doc.text(fmtHrs(h), x + 10, cy + 1.5, { align: 'right' })
  }

  // "=24" total at bottom
  doc.setFontSize(8)
  doc.text('=24', x + 10, GRID_BOTTOM + 4.5, { align: 'right' })
}

// ════════════════════════════════════════════════════════════════════════════
//  SECOND RULER (below grid)
// ════════════════════════════════════════════════════════════════════════════
function drawSecondRuler(doc: jsPDF, y: number): void {
  doc.setDrawColor(0)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5)

  // Hour labels above ruler line
  for (let h = 0; h < 24; h++) {
    const cx = hrToX(h + 0.5)
    doc.text(hourLabel(h), cx, y - 1.5, { align: 'center' })
  }

  // Ruler baseline
  doc.setLineWidth(0.3)
  doc.line(GRID_LEFT, y, GRID_RIGHT, y)

  // Left and right caps
  doc.line(GRID_LEFT, y, GRID_LEFT, y + 3.5)
  doc.line(GRID_RIGHT, y, GRID_RIGHT, y + 3.5)

  // Hour ticks (downward from line)
  for (let h = 0; h <= 24; h++) {
    const x = hrToX(h)
    const isMajor = h % 6 === 0
    doc.setLineWidth(isMajor ? 0.4 : 0.25)
    doc.line(x, y, x, y + (isMajor ? 3.5 : 2.2))
  }

  // Quarter-hour sub-ticks
  doc.setLineWidth(0.15)
  for (let h = 0; h < 24; h++) {
    for (let q = 1; q <= 3; q++) {
      const x = hrToX(h + q / 4)
      doc.line(x, y, x, y + (q === 2 ? 1.6 : 1.0))
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  REMARKS
// ════════════════════════════════════════════════════════════════════════════
function drawRemarks(doc: jsPDF, entries: LogEntry[], rulerY: number): void {
  const baselineY = rulerY + 7

  doc.setDrawColor(0)
  doc.setTextColor(0)

  // "REMARKS" label
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text('REMARKS', GRID_LEFT - 1.5, baselineY, { align: 'right' })

  // Horizontal baseline
  doc.setLineWidth(0.3)
  doc.line(GRID_LEFT, baselineY, GRID_RIGHT, baselineY)

  // Only ON_DUTY_NOT_DRIVING entries with a non-empty location
  const sorted = [...entries]
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
    .filter((e) => e.status === 'ON_DUTY_NOT_DRIVING' && e.location.trim() !== '')

  const dropLen = 7.5  // mm: vertical drop below baseline
  const armLen = 2.5   // mm: horizontal L-arm to the right

  for (const entry of sorted) {
    const x = timeToX(entry.time)

    // Vertical drop from baseline going downward
    doc.setLineWidth(0.3)
    doc.line(x, baselineY, x, baselineY + dropLen)

    // Horizontal L-arm pointing right at the bottom of the drop
    doc.line(x, baselineY + dropLen, x + armLen, baselineY + dropLen)

    // Diagonal text label at 45° clockwise (lower-right direction)
    // starting from the tip of the L-arm
    const label = entry.location + (entry.remarks?.trim() ? ` ${entry.remarks}` : '')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.text(label, x + armLen, baselineY + dropLen, { angle: -45 })
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  FOOTER
// ════════════════════════════════════════════════════════════════════════════
function drawFooter(doc: jsPDF, day: DayLog): void {
  const y = 230

  // Separator
  doc.setLineWidth(0.3)
  doc.setDrawColor(0)
  doc.line(ML, y - 6, PW - MR, y - 6)

  // Prior / Shipping No.
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(0)
  doc.text('Prior or Shipping No.', ML, y)

  // Underline + value
  const snX = ML + 39
  doc.line(snX, y + 0.5, snX + 25, y + 0.5)
  if (day.load_number) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(day.load_number, snX + 12, y - 0.5, { align: 'center' })
  }

  // Shipper / Commodity / Load row
  const rowY = y + 14
  const col2 = PW / 3 + 4
  const col3 = (PW / 3) * 2 + 4

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  doc.text('SHIPPER:', ML, rowY)
  doc.text('COMMODITY:', col2, rowY)
  doc.text('LOAD NO.:', col3, rowY)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(day.shipper || '', ML + 20, rowY)
  doc.text(day.commodity || '', col2 + 24, rowY)
  doc.text(day.load_number || '', col3 + 20, rowY)

  // Underlines
  doc.setLineWidth(0.3)
  doc.line(ML + 18, rowY + 1, col2 - 2, rowY + 1)
  doc.line(col2 + 22, rowY + 1, col3 - 2, rowY + 1)
  doc.line(col3 + 18, rowY + 1, PW - MR, rowY + 1)
}

// ════════════════════════════════════════════════════════════════════════════
//  SINGLE PAGE
// ════════════════════════════════════════════════════════════════════════════
function drawPage(doc: jsPDF, day: DayLog): void {
  const secondRulerY = GRID_BOTTOM + 6

  drawHeader(doc, day)
  drawGridAndLabels(doc)
  drawStatusLines(doc, day.entries)
  drawTotals(doc, day)
  drawSecondRuler(doc, secondRulerY)
  drawRemarks(doc, day.entries, secondRulerY)
  drawFooter(doc, day)
}

// ════════════════════════════════════════════════════════════════════════════
//  PUBLIC ENTRY POINT
// ════════════════════════════════════════════════════════════════════════════
export function generateDOTPdf(days: DayLog[]): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })

  days.forEach((day, i) => {
    if (i > 0) doc.addPage()
    drawPage(doc, day)
  })

  doc.save('driver_log.pdf')
}
