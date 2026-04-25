# CLAUDE.md — Backend (Django)

## Overview

Stateless Django REST API. No database. Every request is a pure calculation:
inputs come in → services process → structured JSON (or PDF) goes out.

---

## Stack

| Package             | Version  | Purpose                             |
| ------------------- | -------- | ----------------------------------- |
| django              | 6.0.4    | Core framework                      |
| djangorestframework | 3.17.1   | REST API toolkit                    |
| django-cors-headers | 4.9.0    | Allow React frontend to call API    |
| python-decouple     | 3.8      | .env file management                |
| requests            | 2.33.1   | Call Nominatim and OSRM APIs        |
| reportlab           | ≥4.4.10  | Generate PDF DOT log sheets         |
| Pillow              | ≥10.0    | ReportLab image support             |
| whitenoise          | 6.12.0   | Static file serving on Vercel       |

---

## Folder Structure

```
backend/
├── core/                     # Django project config
│   ├── settings.py           # All settings (uses python-decouple)
│   ├── urls.py               # Root URL config — mounts all three apps
│   ├── exceptions.py         # Global custom exception handler
│   └── wsgi.py               # Vercel entrypoint
├── maps/                     # Geocoding + routing app
│   ├── geocoder.py           # Nominatim API calls
│   ├── router.py             # OSRM API calls
│   ├── serializers.py        # GeocodeRequestSerializer, RouteRequestSerializer
│   ├── views.py              # GeocodeView, RouteView
│   └── urls.py
├── trips/                    # HOS engine app
│   ├── hos_engine.py         # All HOS rule calculations and validation
│   ├── serializers.py        # LogEntrySerializer, ValidateEntrySerializer, etc.
│   ├── views.py              # ValidateEntryView, CalculateTotalsView
│   └── urls.py
├── logs/                     # PDF generation app
│   ├── pdf_generator.py      # ReportLab canvas — draws the DOT log sheet
│   ├── serializers.py        # GenerateLogSerializer, DayLogSerializer
│   ├── views.py              # GenerateLogView
│   └── urls.py
├── manage.py
├── requirements.txt
└── .env                      # Never commit this
```

---

## Django Skills Installed

This project has the **django-skills** collection installed:
https://github.com/saaspegasus/django-skills

Use these slash commands inside Claude Code when needed:

- `/fix-types` — fix mypy / type annotation issues in Python files
- `/upgrade-js-deps` — upgrade JS dependencies (run from root or frontend)

---

## Key Settings Decisions

- **No DATABASES configured** — stateless MVP, no persistence needed
- **No AUTH** — open API, no authentication required for MVP
- **CORS** allows `localhost:5173` (Vite dev) and `.vercel.app` in production
- **WhiteNoise** handles static files via `STATICFILES_STORAGE`
- **python-decouple** reads all secrets from `.env`
- Exception handler registered at `core.exceptions.custom_exception_handler`

---

## API Design

### Versioning

URL path versioning — all endpoints live under `/api/v1/`:

| Endpoint                        | Method | Description                              |
| ------------------------------- | ------ | ---------------------------------------- |
| `/api/v1/maps/geocode/`         | POST   | Convert address string to lat/lng        |
| `/api/v1/maps/route/`           | POST   | Get route between current/pickup/dropoff |
| `/api/v1/trips/validate-entry/` | POST   | Validate new log entry against HOS rules |
| `/api/v1/trips/calculate-totals/` | POST | Calculate total hours per duty status    |
| `/api/v1/logs/generate/`        | POST   | Generate multi-page PDF log sheets       |

### Response Envelope

Successful JSON responses:

```json
{
  "success": true,
  "data": { ... }
}
```

Error responses (all errors, all endpoints):

```json
{
  "success": false,
  "error": {
    "code": "validation_error",
    "message": "One or more fields failed validation.",
    "fields": { "field_name": "error detail" }
  }
}
```

The PDF endpoint returns `application/pdf` binary directly — not JSON.

---

## HOS Engine (`trips/hos_engine.py`)

The most critical file. Implements FMCSA HOS rules for a **property-carrying driver on the 70hr/8day cycle**.

### Constants

```python
MAX_DRIVING_HOURS = 11
MAX_ON_DUTY_WINDOW = 14
REQUIRED_BREAK_AFTER = 8        # hours of driving before mandatory break
REQUIRED_BREAK_DURATION = 0.5   # 30 minutes
REQUIRED_OFF_DUTY_RESET = 10    # hours off to reset driving clock
MAX_CYCLE_HOURS = 70
FUEL_REMINDER_MILES = 1000
STOP_DUTY_DURATION = 1.0        # 1 hour on-duty for pickup or dropoff
```

### Duty Status Constants (uppercase — used in API and PDF)

```python
STATUS_OFF_DUTY = 'OFF_DUTY'
STATUS_SLEEPER  = 'SLEEPER_BERTH'
STATUS_DRIVING  = 'DRIVING'
STATUS_ON_DUTY  = 'ON_DUTY'
```

### Key Functions

- `calculate_totals(entries)` — returns hours per status for a day, formatted as `{hours, minutes, decimal}`
- `validate_entry(entries_so_far, new_entry, cycle_hours_used, total_miles_today)` — checks HOS rules, returns `{valid, warnings, errors, fuel_reminder, hours_summary}`

### Log Entry Schema

```json
{
  "time": "06:30",
  "status": "ON_DUTY",
  "location": "Dallas, TX",
  "remarks": "Pre-trip",
  "bracket": false
}
```

- `time`: HH:MM, 15-minute increments only (00, 15, 30, 45)
- `status`: one of the four uppercase constants above
- `bracket`: `true` if truck did not move during this period

---

## Maps Services

### `maps/geocoder.py` — Nominatim

Converts address strings to `{lat, lng, display_name, city, state}`.

- Scoped to `countrycodes=us`
- Raises `ValidationError` if address not found
- Raises `APIException` on timeout/connection error

### `maps/router.py` — OSRM

Gets a driving route for 2+ waypoints (each `{lat, lng}`).

- Coordinates passed as `lng,lat` (OSRM order)
- Returns `{total_miles, total_duration_hrs, geometry (GeoJSON), legs[]}`
- Raises `APIException` on OSRM errors

---

## PDF Generator (`logs/pdf_generator.py`)

Uses ReportLab to draw the DOT daily log form on letter-size pages (612×792 pts).

Key layout:
- 24-hour grid with 4 duty status rows
- Horizontal lines per status period, vertical transition lines
- 45° diagonal flags at each status change
- Remarks section below the grid
- Totals box on the right (hours/minutes per status + circled HOS total)
- Post-trip inspection section at bottom

Entry point: `generate_log_pdf(days, totals_per_day) → bytes`

---

## Error Handling (`core/exceptions.py`)

Custom DRF exception handler. Maps all errors to a consistent shape:

| Exception type        | HTTP status | `code` value             |
| --------------------- | ----------- | ------------------------ |
| `ValidationError`     | 422         | `validation_error`       |
| `ParseError`          | 400         | `parse_error`            |
| `MethodNotAllowed`    | 405         | `method_not_allowed`     |
| `UnsupportedMediaType`| 415         | `unsupported_media_type` |
| `APIException`        | varies      | from `exc.default_code`  |
| Unhandled (500)       | 500         | `server_error`           |

Validation errors include a `fields` dict with flattened dot-notation keys
(e.g. `"entries.0.time": "Minutes must be 00, 15, 30, or 45."`).

---

## Running Locally

```bash
cd backend
venv\Scripts\activate        # Windows
python manage.py runserver
```

API available at: `http://127.0.0.1:8000/api/v1/`

---

## Deployment (Vercel)

- WSGI entrypoint: `core.wsgi.application`
- Static files: WhiteNoise (`CompressedManifestStaticFilesStorage`)
- Environment variables: set in Vercel dashboard

Required Vercel env vars:

- `DJANGO_SECRET_KEY`
- `DEBUG` = `False`
- `NOMINATIM_USER_AGENT` (e.g. `hos_logger_app/1.0`)

---

## Common Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Generate a new secret key
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Check for issues
python manage.py check

# Freeze dependencies
pip freeze > requirements.txt
```
