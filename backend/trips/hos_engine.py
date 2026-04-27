from datetime import datetime, timedelta

# ── HOS Constants (FMCSA Property-Carrying Driver Rules) ─────────────────────
MAX_DRIVING_HOURS = 11
MAX_ON_DUTY_WINDOW = 14
REQUIRED_BREAK_AFTER = 8
REQUIRED_BREAK_DURATION = 0.5
REQUIRED_OFF_DUTY_RESET = 10
MAX_CYCLE_HOURS = 70
FUEL_REMINDER_MILES = 1000
STOP_DUTY_DURATION = 1.0

STATUS_OFF_DUTY = 'OFF_DUTY'
STATUS_SLEEPER = 'SLEEPER_BERTH'
STATUS_DRIVING = 'DRIVING'
STATUS_ON_DUTY = 'ON_DUTY_NOT_DRIVING'

ALL_STATUSES = [STATUS_OFF_DUTY, STATUS_SLEEPER, STATUS_DRIVING, STATUS_ON_DUTY]


def parse_time(time_str: str) -> datetime:
    try:
        return datetime.strptime(time_str, '%H:%M')
    except ValueError:
        raise ValueError(f'Invalid time format: "{time_str}". Use HH:MM (e.g., 06:30).')


def calculate_duration_hrs(start: str, end: str) -> float:
    start_dt = parse_time(start)
    end_dt = parse_time(end)

    if end_dt <= start_dt:
        end_dt += timedelta(hours=24)

    delta = end_dt - start_dt
    return round(delta.total_seconds() / 3600, 4)


def calculate_totals(entries: list) -> dict:
    totals = {
        STATUS_OFF_DUTY: 0.0,
        STATUS_SLEEPER: 0.0,
        STATUS_DRIVING: 0.0,
        STATUS_ON_DUTY: 0.0,
    }

    if not entries:
        return _format_totals(totals)

    for i, entry in enumerate(entries):
        start_time = entry['time']

        if i < len(entries) - 1:
            end_time = entries[i + 1]['time']
        else:
            end_time = '00:00'

        duration = calculate_duration_hrs(start_time, end_time)
        s = entry.get('status', STATUS_OFF_DUTY)

        if s in totals:
            totals[s] += duration

    return _format_totals(totals)


def _format_totals(totals: dict) -> dict:
    def to_h_m(decimal_hrs: float) -> dict:
        total_minutes = round(decimal_hrs * 60)
        return {
            'hours': total_minutes // 60,
            'minutes': total_minutes % 60,
            'decimal': round(decimal_hrs, 2),
        }

    off_duty = totals[STATUS_OFF_DUTY]
    sleeper = totals[STATUS_SLEEPER]
    driving = totals[STATUS_DRIVING]
    on_duty = totals[STATUS_ON_DUTY]
    grand_total = off_duty + sleeper + driving + on_duty
    hos_total = round(driving + on_duty, 2)

    return {
        'off_duty': to_h_m(off_duty),
        'sleeper_berth': to_h_m(sleeper),
        'driving': to_h_m(driving),
        'on_duty_not_driving': to_h_m(on_duty),
        'total': to_h_m(grand_total),
        'hos_total': hos_total,
    }


def validate_entry(entries_so_far: list, new_entry: dict,
                   cycle_hours_used: float, total_miles_today: float) -> dict:
    warnings = []
    errors = []

    current_totals = calculate_totals(entries_so_far)
    driving_so_far = current_totals['driving']['decimal']
    on_duty_so_far = current_totals['on_duty_not_driving']['decimal']
    total_on_duty_so_far = driving_so_far + on_duty_so_far

    new_status = new_entry.get('status', '')

    # Rule 1: 11-hour driving limit
    if new_status == STATUS_DRIVING:
        if driving_so_far >= MAX_DRIVING_HOURS:
            errors.append(
                f'Driving limit reached. You have driven {driving_so_far:.1f} hrs '
                f'(maximum is {MAX_DRIVING_HOURS} hrs). A 10-hour off-duty reset is required.'
            )
        elif driving_so_far >= 10:
            warnings.append(
                f'Approaching driving limit — {driving_so_far:.1f} of {MAX_DRIVING_HOURS} hrs used.'
            )

    # Rule 2: 14-hour on-duty window
    if new_status in [STATUS_DRIVING, STATUS_ON_DUTY]:
        if total_on_duty_so_far >= MAX_ON_DUTY_WINDOW:
            errors.append(
                f'14-hour on-duty window exceeded. '
                f'You have been on duty for {total_on_duty_so_far:.1f} hrs.'
            )
        elif total_on_duty_so_far >= 13:
            warnings.append(
                f'Approaching 14-hour window — {total_on_duty_so_far:.1f} hrs used.'
            )

    # Rule 3: 30-minute break after 8 hours driving
    if new_status == STATUS_DRIVING and driving_so_far >= REQUIRED_BREAK_AFTER:
        if not _had_qualifying_break(entries_so_far):
            errors.append(
                f'A 30-minute break is required after {REQUIRED_BREAK_AFTER} hours of driving. '
                f'Log an Off Duty or Sleeper Berth entry of at least 30 minutes before continuing.'
            )

    # Rule 4: 70-hour / 8-day cycle
    projected_cycle = cycle_hours_used + total_on_duty_so_far
    if new_status in [STATUS_DRIVING, STATUS_ON_DUTY]:
        if projected_cycle >= MAX_CYCLE_HOURS:
            errors.append(
                f'70-hour/8-day cycle limit reached. '
                f'Projected cycle total: {projected_cycle:.1f} hrs. '
                f'A 34-hour restart is required.'
            )
        elif projected_cycle >= 65:
            warnings.append(
                f'Approaching 70-hour cycle limit — approximately {MAX_CYCLE_HOURS - projected_cycle:.1f} hrs remaining.'
            )

    # Rule 5: Fuel reminder
    fuel_reminder = False
    if total_miles_today >= FUEL_REMINDER_MILES:
        if not _had_fuel_stop(entries_so_far):
            fuel_reminder = True
            warnings.append(
                f'You have driven over {FUEL_REMINDER_MILES} miles without logging a fuel stop. '
                f'Log an On Duty (Not Driving) entry with "Fueling" in remarks.'
            )

    return {
        'valid': len(errors) == 0,
        'warnings': warnings,
        'errors': errors,
        'fuel_reminder': fuel_reminder,
        'hours_summary': {
            'driving_today': driving_so_far,
            'on_duty_today': on_duty_so_far,
            'total_on_duty_cycle': round(projected_cycle, 2),
            'cycle_remaining': round(MAX_CYCLE_HOURS - projected_cycle, 2),
        },
    }


def _had_qualifying_break(entries: list) -> bool:
    rest_duration = 0.0
    for i in range(len(entries) - 1, -1, -1):
        entry = entries[i]
        s = entry.get('status')

        if s in [STATUS_OFF_DUTY, STATUS_SLEEPER]:
            if i < len(entries) - 1:
                duration = calculate_duration_hrs(entry['time'], entries[i + 1]['time'])
                rest_duration += duration

        if s == STATUS_DRIVING and rest_duration == 0:
            return False

        if rest_duration >= REQUIRED_BREAK_DURATION:
            return True

    return rest_duration >= REQUIRED_BREAK_DURATION


def _had_fuel_stop(entries: list) -> bool:
    for entry in entries:
        remarks = entry.get('remarks', '').lower()
        if 'fuel' in remarks or 'gas' in remarks:
            return True
    return False
