import { useEffect, useRef } from 'react'
import type { DriversDailyLog, DutySegment } from '@/shared/types'
import { DUTY_STATUS_COLORS } from '@/shared/types'

// ── Canvas grid constants ─────────────────────────────────────────────────────

const CANVAS_WIDTH = 720
const CANVAS_HEIGHT = 200
const GRID_LEFT = 110
const GRID_RIGHT = 710
const GRID_WIDTH = GRID_RIGHT - GRID_LEFT
const GRID_TOP = 22
const ROW_HEIGHT = 36

type RowKey = 'OFF_DUTY' | 'SLEEPER_BERTH' | 'DRIVING' | 'ON_DUTY_NOT_DRIVING'
const ROW_ORDER: RowKey[] = ['OFF_DUTY', 'SLEEPER_BERTH', 'DRIVING', 'ON_DUTY_NOT_DRIVING']
const ROW_DISPLAY = ['1. Off Duty', '2. Sleeper', '3. Driving', '4. On Duty']

function hourToX(hour: number): number {
  return GRID_LEFT + (hour / 24) * GRID_WIDTH
}

function rowY(status: RowKey): number {
  const index = ROW_ORDER.indexOf(status)
  return GRID_TOP + index * ROW_HEIGHT + ROW_HEIGHT / 2
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  ctx.font = '11px monospace'
  ctx.fillStyle = '#374151'
  ctx.textAlign = 'right'
  for (let i = 0; i < ROW_ORDER.length; i++) {
    const y = GRID_TOP + i * ROW_HEIGHT + ROW_HEIGHT / 2
    ctx.fillText(ROW_DISPLAY[i] ?? '', GRID_LEFT - 6, y + 4)
  }

  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  for (let h = 0; h <= 24; h++) {
    const x = GRID_LEFT + (h / 24) * GRID_WIDTH
    ctx.beginPath()
    ctx.moveTo(x, GRID_TOP)
    ctx.lineTo(x, GRID_TOP + ROW_HEIGHT * ROW_ORDER.length)
    ctx.stroke()

    if (h % 2 === 0) {
      ctx.fillStyle = '#9ca3af'
      ctx.font = '9px monospace'
      ctx.textAlign = 'center'
      const label = h === 0 ? 'M' : h === 12 ? 'N' : h === 24 ? 'M' : String(h > 12 ? h - 12 : h)
      ctx.fillText(label, x, GRID_TOP - 5)
    }
  }

  ctx.strokeStyle = '#d1d5db'
  ctx.lineWidth = 1
  for (let i = 0; i <= ROW_ORDER.length; i++) {
    const y = GRID_TOP + i * ROW_HEIGHT
    ctx.beginPath()
    ctx.moveTo(GRID_LEFT, y)
    ctx.lineTo(GRID_RIGHT, y)
    ctx.stroke()
  }
}

function drawSegments(ctx: CanvasRenderingContext2D, segments: DutySegment[]) {
  if (segments.length === 0) return

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!
    const x1 = hourToX(seg.startHour)
    const x2 = hourToX(seg.endHour)
    const y = rowY(seg.status as RowKey)
    const color = DUTY_STATUS_COLORS[seg.status] ?? '#6b7280'

    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x1, y)
    ctx.lineTo(x2, y)
    ctx.stroke()

    if (i > 0) {
      const prevSeg = segments[i - 1]!
      const prevY = rowY(prevSeg.status as RowKey)
      ctx.strokeStyle = '#6b7280'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(x1, prevY)
      ctx.lineTo(x1, y)
      ctx.stroke()
    }

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x1, y, 3, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ── ELD Grid component ────────────────────────────────────────────────────────

function ELDGrid({ segments }: { segments: DutySegment[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawGrid(ctx)
    drawSegments(ctx, segments)
  }, [segments])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="max-w-full"
      style={{ minWidth: CANVAS_WIDTH }}
    />
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fractionalToHHMM(h: number): string {
  const hours = Math.floor(h)
  const minutes = Math.round((h - hours) * 60)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function formatDecimalHours(h: number): string {
  const hrs = Math.floor(h)
  const mins = Math.round((h - hrs) * 60)
  if (mins === 0) return `${hrs}h 00m`
  return `${hrs}h ${String(mins).padStart(2, '0')}m`
}

// ── DailyLogSheet ─────────────────────────────────────────────────────────────

interface Props {
  log: DriversDailyLog
  dayNumber: number
}

export function DailyLogSheet({ log, dayNumber }: Props) {
  const { header, dutySegments, hoursSummary, remarks, footer } = log
  const { date } = header

  const dateStr = `${String(date.month).padStart(2, '0')}/${String(date.day).padStart(2, '0')}/${date.year}`

  const summaryRows = [
    { label: '1. Off Duty',            value: hoursSummary.offDuty,          color: DUTY_STATUS_COLORS.OFF_DUTY },
    { label: '2. Sleeper Berth',        value: hoursSummary.sleeperBerth,     color: DUTY_STATUS_COLORS.SLEEPER_BERTH },
    { label: '3. Driving',             value: hoursSummary.driving,           color: DUTY_STATUS_COLORS.DRIVING },
    { label: '4. On Duty (Not Driving)', value: hoursSummary.onDutyNotDriving, color: DUTY_STATUS_COLORS.ON_DUTY_NOT_DRIVING },
  ]

  const totalHours = summaryRows.reduce((sum, r) => sum + r.value, 0)

  return (
    <div className="card overflow-hidden" style={{ border: '1px solid var(--col-border-2)' }}>
      {/* ── Sheet header bar ── */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ background: 'var(--col-navy)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-3">
          <span
            className="font-display font-bold"
            style={{ fontSize: '1.1rem', color: '#ffffff', letterSpacing: '0.04em' }}
          >
            DRIVER'S DAILY LOG
          </span>
          <span
            className="font-display font-bold px-2 py-0.5 rounded"
            style={{ fontSize: '0.75rem', background: 'var(--col-amber)', color: '#fff', letterSpacing: '0.06em' }}
          >
            DAY {dayNumber}
          </span>
        </div>
        <span
          className="font-mono text-sm"
          style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace' }}
        >
          {dateStr}
        </span>
      </div>

      <div className="p-5 flex flex-col gap-5">

        {/* ── Header fields ── */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
          <HeaderField label="Driver" value={header.driverSignature} />
          <HeaderField label="Co-Driver" value={header.coDriverName ?? '—'} />
          <HeaderField label="Carrier" value={header.carrierName} />
          <HeaderField label="Main Office" value={header.mainOfficeAddress} />
          <HeaderField label="Tractor No." value={header.tractor} />
          <HeaderField label="Trailer No." value={header.trailer} />
          <HeaderField label="Total Miles Today" value={String(header.totalMilesDrivingToday)} />
        </div>

        {/* ── ELD Grid ── */}
        <div>
          <span className="section-label">24-Hour Log Grid</span>
          <div className="mt-2 overflow-x-auto">
            <ELDGrid segments={dutySegments} />
          </div>
        </div>

        {/* ── Hours summary + Remarks (side-by-side) ── */}
        <div className="grid grid-cols-2 gap-5">

          {/* Hours summary table */}
          <div>
            <span className="section-label">Hours Summary</span>
            <div
              className="mt-2 rounded-lg overflow-hidden"
              style={{ border: '1px solid var(--col-border-2)' }}
            >
              {summaryRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between px-3 py-1.5"
                  style={{ borderBottom: '1px solid var(--col-border-2)' }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ background: row.color }}
                    />
                    <span className="text-xs" style={{ color: 'var(--col-text-2)' }}>{row.label}</span>
                  </div>
                  <span
                    className="font-mono text-xs font-semibold"
                    style={{ color: 'var(--col-text)', fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {formatDecimalHours(row.value)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between px-3 py-1.5" style={{ background: 'var(--col-surface-2)' }}>
                <span className="text-xs font-semibold" style={{ color: 'var(--col-text)' }}>Total</span>
                <span
                  className="font-mono text-xs font-bold"
                  style={{ color: 'var(--col-navy)', fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {formatDecimalHours(totalHours)}
                </span>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <span className="section-label">Remarks</span>
            <div className="mt-2 flex flex-col gap-1">
              {remarks.length === 0 ? (
                <span className="text-xs" style={{ color: 'var(--col-text-3)' }}>No remarks</span>
              ) : (
                remarks.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span
                      className="font-mono text-xs shrink-0 pt-0.5"
                      style={{ color: 'var(--col-text-3)', fontFamily: 'JetBrains Mono, monospace', minWidth: '3.2rem' }}
                    >
                      {fractionalToHHMM(r.timeHour)}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold" style={{ color: 'var(--col-text)' }}>{r.location}</span>
                      <span className="text-xs" style={{ color: 'var(--col-text-2)' }}>{r.activity}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* ── Footer ── */}
        {(footer.shipper || footer.commodity || footer.shippingNumber) && (
          <div
            className="grid grid-cols-2 gap-x-8 gap-y-2 pt-3"
            style={{ borderTop: '1px solid var(--col-border-2)' }}
          >
            <HeaderField label="Shipper" value={footer.shipper} />
            <HeaderField label="Commodity" value={footer.commodity} />
            <HeaderField label="Shipping / Load No." value={footer.shippingNumber || footer.loadNumber} />
          </div>
        )}

      </div>
    </div>
  )
}

function HeaderField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span className="text-xs shrink-0" style={{ color: 'var(--col-text-3)' }}>{label}</span>
      <span
        className="text-sm font-semibold text-right"
        style={{ color: value && value !== '—' ? 'var(--col-text)' : 'var(--col-text-3)' }}
      >
        {value || '—'}
      </span>
    </div>
  )
}
