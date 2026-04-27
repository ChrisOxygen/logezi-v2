import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch

# ── Layout Constants (all measurements in points, 1pt = 1/72 inch) ───────────
PAGE_WIDTH, PAGE_HEIGHT = letter  # 612 x 792 pts

GRID_LEFT = 1.2 * inch
GRID_RIGHT = 8.5 * inch
GRID_WIDTH = GRID_RIGHT - GRID_LEFT
GRID_TOP = 5.2 * inch
ROW_HEIGHT = 0.45 * inch
NUM_ROWS = 4
GRID_BOTTOM = GRID_TOP - (NUM_ROWS * ROW_HEIGHT)

ROW_TOPS = {
    'OFF_DUTY':             GRID_TOP,
    'SLEEPER_BERTH':        GRID_TOP - ROW_HEIGHT,
    'DRIVING':              GRID_TOP - (2 * ROW_HEIGHT),
    'ON_DUTY_NOT_DRIVING':  GRID_TOP - (3 * ROW_HEIGHT),
}

HOUR_WIDTH = GRID_WIDTH / 24
QUARTER_WIDTH = HOUR_WIDTH / 4

DOT_BLUE = colors.HexColor('#1a3a6e')
LINE_COLOR = colors.black
GRID_COLOR = colors.HexColor('#4a6fa5')


def _time_to_x(time_str: str) -> float:
    parts = time_str.split(':')
    hours = int(parts[0])
    minutes = int(parts[1])
    fraction = hours + (minutes / 60)
    return GRID_LEFT + (fraction / 24) * GRID_WIDTH


def _row_center_y(status: str) -> float:
    top = ROW_TOPS.get(status, GRID_TOP)
    return top - (ROW_HEIGHT / 2)


def _draw_grid(c: canvas.Canvas):
    c.setStrokeColor(DOT_BLUE)
    c.setLineWidth(1)
    c.rect(GRID_LEFT, GRID_BOTTOM, GRID_WIDTH, NUM_ROWS * ROW_HEIGHT)

    for i in range(1, NUM_ROWS):
        y = GRID_TOP - (i * ROW_HEIGHT)
        c.setStrokeColor(GRID_COLOR)
        c.setLineWidth(0.5)
        c.line(GRID_LEFT, y, GRID_RIGHT, y)

    for hour in range(25):
        x = GRID_LEFT + (hour / 24) * GRID_WIDTH
        c.setStrokeColor(GRID_COLOR)

        if hour in [0, 6, 12, 18, 24]:
            c.setLineWidth(1.0)
        else:
            c.setLineWidth(0.3)

        c.line(x, GRID_BOTTOM, x, GRID_TOP)

        if hour < 24:
            for q in [1, 2, 3]:
                qx = x + q * QUARTER_WIDTH
                c.setLineWidth(0.2)
                c.line(qx, GRID_BOTTOM, qx, GRID_BOTTOM + (ROW_HEIGHT * 0.3))

        if hour < 24:
            label = str(hour) if hour != 12 else 'noon'
            c.setFont('Helvetica', 6)
            c.setFillColor(DOT_BLUE)
            c.drawCentredString(x + HOUR_WIDTH / 2, GRID_TOP + 4, label)

    row_labels = [
        ('1. OFF DUTY', 'OFF_DUTY'),
        ('2. SLEEPER BERTH', 'SLEEPER_BERTH'),
        ('3. DRIVING', 'DRIVING'),
        ('4. ON DUTY (NOT DRIVING)', 'ON_DUTY_NOT_DRIVING'),
    ]
    c.setFont('Helvetica-Bold', 6)
    c.setFillColor(DOT_BLUE)
    for label, status in row_labels:
        y = _row_center_y(status)
        c.drawRightString(GRID_LEFT - 4, y - 3, label)


def _draw_status_lines(c: canvas.Canvas, entries: list):
    if not entries:
        return

    c.setLineWidth(2)
    c.setStrokeColor(LINE_COLOR)

    for i, entry in enumerate(entries):
        status = entry['status']
        x_start = _time_to_x(entry['time'])
        y = _row_center_y(status)

        if i < len(entries) - 1:
            x_end = _time_to_x(entries[i + 1]['time'])
        else:
            x_end = GRID_RIGHT

        c.line(x_start, y, x_end, y)

        if i < len(entries) - 1:
            next_status = entries[i + 1]['status']
            next_y = _row_center_y(next_status)
            c.line(x_end, y, x_end, next_y)

        if entry.get('bracket'):
            _draw_bracket(c, x_start, y)

        _draw_remark_flag(c, x_start, y)


def _draw_bracket(c: canvas.Canvas, x: float, y: float):
    c.setLineWidth(1)
    c.setStrokeColor(LINE_COLOR)
    bracket_size = 6
    c.line(x, y + bracket_size, x, y - bracket_size)
    c.line(x, y - bracket_size, x - bracket_size, y - bracket_size)


def _draw_remark_flag(c: canvas.Canvas, x: float, y: float):
    c.setLineWidth(0.8)
    c.setStrokeColor(LINE_COLOR)
    flag_size = 8
    c.line(x, y, x - flag_size, y - flag_size)


def _draw_header(c: canvas.Canvas, day_data: dict):
    c.setFont('Helvetica-Bold', 14)
    c.setFillColor(DOT_BLUE)
    c.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT - 0.6 * inch, "DRIVER'S DAILY LOG")

    c.setFont('Helvetica', 8)
    c.setFillColor(colors.black)
    c.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT - 0.8 * inch,
                        '(ONE CALENDAR DAY — 24 HOURS)')

    c.setFont('Helvetica', 9)
    c.drawString(0.5 * inch, PAGE_HEIGHT - 1.2 * inch,
                 f"Date: {day_data.get('date', '')}")

    c.drawString(0.5 * inch, PAGE_HEIGHT - 1.5 * inch,
                 f"Driver: {day_data.get('driver_name', '')}")
    c.drawString(3.5 * inch, PAGE_HEIGHT - 1.5 * inch,
                 f"Driver No.: {day_data.get('driver_number', '')}")

    c.drawString(0.5 * inch, PAGE_HEIGHT - 1.8 * inch,
                 f"Tractor No.: {day_data.get('tractor', '')}")
    c.drawString(3.5 * inch, PAGE_HEIGHT - 1.8 * inch,
                 f"Trailer No.: {day_data.get('trailer', '')}")

    c.drawString(0.5 * inch, PAGE_HEIGHT - 2.1 * inch,
                 f"Total Driving Miles Today: {day_data.get('total_miles', '')}")

    c.drawString(0.5 * inch, PAGE_HEIGHT - 2.4 * inch,
                 f"Shipper: {day_data.get('shipper', '')}")
    c.drawString(3.5 * inch, PAGE_HEIGHT - 2.4 * inch,
                 f"Commodity: {day_data.get('commodity', '')}")
    c.drawString(0.5 * inch, PAGE_HEIGHT - 2.7 * inch,
                 f"Load No.: {day_data.get('load_number', '')}")

    c.drawString(0.5 * inch, PAGE_HEIGHT - 3.0 * inch,
                 f"Carrier: {day_data.get('carrier_name', '')}    "
                 f"Home Terminal: {day_data.get('home_terminal', '')}")

    c.drawString(0.5 * inch, PAGE_HEIGHT - 3.3 * inch,
                 f"Co-Driver: {day_data.get('co_driver', 'N/A')}")

    c.setFont('Helvetica-Oblique', 7)
    c.setFillColor(colors.grey)
    c.drawCentredString(
        PAGE_WIDTH / 2,
        GRID_TOP + 0.3 * inch,
        'Each change of duty status must have a location in the "remarks" section. '
        'Use local time standard at home operating center.'
    )


def _draw_remarks(c: canvas.Canvas, entries: list):
    remarks_y = GRID_BOTTOM - 0.25 * inch

    c.setFont('Helvetica-Bold', 8)
    c.setFillColor(DOT_BLUE)
    c.drawString(GRID_LEFT, remarks_y, 'REMARKS:')

    c.setFont('Helvetica', 7)
    c.setFillColor(colors.black)

    for entry in entries:
        remark_parts = []
        if entry.get('time'):
            remark_parts.append(entry['time'])
        if entry.get('location'):
            remark_parts.append(entry['location'])
        if entry.get('remarks'):
            remark_parts.append(f"— {entry['remarks']}")

        remark_text = '  '.join(remark_parts)
        x_pos = _time_to_x(entry['time'])
        c.drawString(x_pos, remarks_y - 12, remark_text[:40])


def _draw_totals(c: canvas.Canvas, totals: dict):
    box_x = 8.6 * inch
    box_y = GRID_TOP

    c.setFont('Helvetica-Bold', 7)
    c.setFillColor(DOT_BLUE)
    c.drawString(box_x, box_y, 'TOTAL HOURS')

    rows = [
        ('Off Duty', totals.get('off_duty', {})),
        ('Sleeper', totals.get('sleeper_berth', {})),
        ('Driving', totals.get('driving', {})),
        ('On Duty', totals.get('on_duty_not_driving', {})),
        ('TOTAL', totals.get('total', {})),
    ]

    c.setFont('Helvetica', 8)
    c.setFillColor(colors.black)
    for i, (label, data) in enumerate(rows):
        y = box_y - (i + 1) * 0.3 * inch
        h = data.get('hours', 0)
        m = data.get('minutes', 0)
        c.drawString(box_x, y, f'{label}: {h:02d}h {m:02d}m')

    hos_total = totals.get('hos_total', 0)
    c.setFont('Helvetica-Bold', 14)
    c.setFillColor(colors.red)
    c.drawCentredString(box_x + 0.4 * inch, box_y - 2.0 * inch, str(hos_total))
    c.circle(box_x + 0.4 * inch, box_y - 1.95 * inch, 0.25 * inch, stroke=1, fill=0)


def _draw_post_trip_inspection(c: canvas.Canvas, day_data: dict):
    y = 1.5 * inch

    c.setFont('Helvetica-Bold', 10)
    c.setFillColor(DOT_BLUE)
    c.drawCentredString(PAGE_WIDTH / 2, y, 'POST TRIP INSPECTION REPORT')

    c.setFont('Helvetica', 8)
    c.setFillColor(colors.black)
    c.drawString(0.5 * inch, y - 0.3 * inch,
                 f"Date: {day_data.get('date', '')}   "
                 f"Tractor/Trailer: {day_data.get('tractor', '')} / {day_data.get('trailer', '')}")

    defect_status = day_data.get('post_trip', {}).get('defects', 'none')
    if defect_status == 'none':
        c.drawString(0.5 * inch, y - 0.55 * inch,
                     'No defects found in this motor vehicle.')
    else:
        c.drawString(0.5 * inch, y - 0.55 * inch,
                     f'Defects found: {defect_status}')

    c.drawString(0.5 * inch, y - 0.8 * inch,
                 f"Driver's Name: {day_data.get('driver_name', '')}")
    c.line(2.5 * inch, y - 0.8 * inch, 5.0 * inch, y - 0.8 * inch)
    c.drawString(5.5 * inch, y - 0.8 * inch, "Driver's Signature: _______________")


def generate_log_pdf(days: list, totals_per_day: list) -> bytes:
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)

    for i, (day_data, totals) in enumerate(zip(days, totals_per_day)):
        c.setPageSize(letter)

        _draw_header(c, day_data)
        _draw_grid(c)
        _draw_status_lines(c, day_data.get('entries', []))
        _draw_remarks(c, day_data.get('entries', []))
        _draw_totals(c, totals)
        _draw_post_trip_inspection(c, day_data)

        if i < len(days) - 1:
            c.showPage()

    c.save()
    buffer.seek(0)
    return buffer.read()
