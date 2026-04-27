import { useEffect, useRef } from 'react'
import type { LogEntry, DutyStatus } from '@/shared/types'
import { DUTY_STATUS_COLORS } from '@/shared/types'

const CANVAS_WIDTH = 720
const CANVAS_HEIGHT = 200
const GRID_LEFT = 100
const GRID_RIGHT = 700
const GRID_WIDTH = GRID_RIGHT - GRID_LEFT
const GRID_TOP = 20
const ROW_HEIGHT = 36

const ROW_LABELS: DutyStatus[] = ['OFF_DUTY', 'SLEEPER_BERTH', 'DRIVING', 'ON_DUTY_NOT_DRIVING']
const ROW_DISPLAY = ['1. Off Duty', '2. Sleeper', '3. Driving', '4. On Duty']

function timeToX(time: string): number {
  const [h, m] = time.split(':').map(Number)
  const totalMinutes = (h ?? 0) * 60 + (m ?? 0)
  return GRID_LEFT + (totalMinutes / (24 * 60)) * GRID_WIDTH
}

function rowY(status: DutyStatus): number {
  const index = ROW_LABELS.indexOf(status)
  return GRID_TOP + index * ROW_HEIGHT + ROW_HEIGHT / 2
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Row labels
  ctx.font = '11px monospace'
  ctx.fillStyle = '#374151'
  ctx.textAlign = 'right'
  for (let i = 0; i < ROW_LABELS.length; i++) {
    const y = GRID_TOP + i * ROW_HEIGHT + ROW_HEIGHT / 2
    ctx.fillText(ROW_DISPLAY[i] ?? '', GRID_LEFT - 6, y + 4)
  }

  // Hour grid lines (vertical)
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  for (let h = 0; h <= 24; h++) {
    const x = GRID_LEFT + (h / 24) * GRID_WIDTH
    ctx.beginPath()
    ctx.moveTo(x, GRID_TOP)
    ctx.lineTo(x, GRID_TOP + ROW_HEIGHT * ROW_LABELS.length)
    ctx.stroke()

    // Hour labels — every 2 hrs
    if (h % 2 === 0) {
      ctx.fillStyle = '#9ca3af'
      ctx.font = '9px monospace'
      ctx.textAlign = 'center'
      const label = h === 0 ? 'M' : h === 12 ? 'N' : h === 24 ? 'M' : String(h > 12 ? h - 12 : h)
      ctx.fillText(label, x, GRID_TOP - 5)
    }
  }

  // Row separator lines (horizontal)
  ctx.strokeStyle = '#d1d5db'
  ctx.lineWidth = 1
  for (let i = 0; i <= ROW_LABELS.length; i++) {
    const y = GRID_TOP + i * ROW_HEIGHT
    ctx.beginPath()
    ctx.moveTo(GRID_LEFT, y)
    ctx.lineTo(GRID_RIGHT, y)
    ctx.stroke()
  }
}

function drawEntries(ctx: CanvasRenderingContext2D, entries: LogEntry[]) {
  if (entries.length === 0) return

  const sorted = [...entries].sort((a, b) => a.time.localeCompare(b.time))

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i]!
    const next = sorted[i + 1]

    const x1 = timeToX(entry.time)
    const x2 = next ? timeToX(next.time) : GRID_RIGHT
    const y = rowY(entry.status)

    const color = DUTY_STATUS_COLORS[entry.status]

    // Horizontal line for duration
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x1, y)
    ctx.lineTo(x2, y)
    ctx.stroke()

    // Vertical connector from previous row to this row
    if (i > 0) {
      const prevEntry = sorted[i - 1]!
      const prevY = rowY(prevEntry.status)
      ctx.strokeStyle = '#6b7280'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(x1, prevY)
      ctx.lineTo(x1, y)
      ctx.stroke()
    }

    // Transition flag dot
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x1, y, 3, 0, Math.PI * 2)
    ctx.fill()
  }
}

interface Props {
  entries: LogEntry[]
}

export function LogGrid({ entries }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawGrid(ctx)
    drawEntries(ctx, entries)
  }, [entries])

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
