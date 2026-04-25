# CLAUDE.md — Logezi HOS Logger

## Project Overview

A full-stack trucking compliance tool. A truck driver enters their trip details and the app:

1. Geocodes locations using the Nominatim (OpenStreetMap) API
2. Calculates the driving route using the OSRM routing API
3. Applies FMCSA Hours of Service (HOS) rules — validates log entries and calculates totals
4. Renders interactive ELD (Electronic Logging Device) daily log sheets
5. Displays the full route on a map with stops marked
6. Generates downloadable PDF DOT log sheets via ReportLab

This is a **stateless MVP** — no database. Every request is calculated fresh from inputs.

---

## Repository Structure

```
logezi-django/
├── backend/          # Django REST API (Python)
│   └── CLAUDE.md     # Django-specific context
├── frontend/         # React app (Vite + TypeScript)
│   └── CLAUDE.md     # React-specific context
├── vercel.json       # Vercel monorepo deployment config
├── .gitignore
└── CLAUDE.md         # ← you are here
```

---

## Tech Stack

| Layer       | Technology                                    |
| ----------- | --------------------------------------------- |
| Backend     | Django 6.0.4 + Django REST Framework 3.17.1   |
| Frontend    | React + TypeScript + Tailwind CSS (Vite)      |
| Map         | Leaflet.js + OpenStreetMap tiles              |
| Geocoding   | Nominatim API (free, no key required)         |
| Routing     | OSRM API (free, no key required)              |
| PDF         | ReportLab                                     |
| Hosting     | Vercel (monorepo — both apps in one repo)     |
| Env vars    | python-decouple (.env)                        |

---

## API Endpoints

| Method | Endpoint                        | Description                                    |
| ------ | ------------------------------- | ---------------------------------------------- |
| POST   | /api/v1/maps/geocode/           | Convert an address string to lat/lng           |
| POST   | /api/v1/maps/route/             | Get driving route between 3 locations          |
| POST   | /api/v1/trips/validate-entry/   | Validate a new log entry against HOS rules     |
| POST   | /api/v1/trips/calculate-totals/ | Calculate total hours per duty status for a day |
| POST   | /api/v1/logs/generate/          | Generate and download PDF DOT log sheets       |

### Response Envelope (JSON endpoints)

```json
{
  "success": true,
  "data": { ... }
}
```

Error responses follow this shape:

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

The PDF endpoint (`/api/v1/logs/generate/`) returns a binary PDF file directly, not JSON.

---

## HOS Rules (Property Carrier — 70hr/8day)

These are the core business rules. Never change these constants without updating both
the backend engine and the frontend display logic:

| Rule                        | Value                          |
| --------------------------- | ------------------------------ |
| Max driving per day         | 11 hours                       |
| Max on-duty window per day  | 14 hours                       |
| Mandatory break after       | 8 hours driving → 30 min break |
| Min off-duty between shifts | 10 hours                       |
| Cycle limit                 | 70 hrs / 8 days                |
| Fuel stop reminder          | Every 1,000 miles              |
| Pickup/dropoff duration     | 1 hour each (on-duty)          |

---

## ELD Log Sheet — 4 Duty Statuses

The ELD grid is a 24-hour timeline (Midnight → Midnight) with 4 rows:

| Line | Status                | API Value      |
| ---- | --------------------- | -------------- |
| 1    | Off Duty              | `OFF_DUTY`     |
| 2    | Sleeper Berth         | `SLEEPER_BERTH`|
| 3    | Driving               | `DRIVING`      |
| 4    | On Duty (Not Driving) | `ON_DUTY`      |

**Status values are uppercase strings.** The frontend and backend must agree on these exact values.

Drawing rules:

- Horizontal lines represent time spent in a status
- Vertical lines mark transitions between statuses
- 45° diagonal flags mark each transition point
- REMARKS section shows location + remarks text at each change

---

## Django Skills Installed

This project uses the **django-skills** collection from:
https://github.com/saaspegasus/django-skills

Available skills (use slash commands in Claude Code):

- `/fix-types` — interactively fix mypy/type checking issues in Python code
- `/upgrade-js-deps` — upgrade JS dependencies safely with post-upgrade checks

---

## External APIs

### Nominatim (OpenStreetMap)

- Free, no API key required
- Used for: geocoding (address string → lat/lng)
- Requires a `User-Agent` header — set via `NOMINATIM_USER_AGENT` env var
- Base URL: `https://nominatim.openstreetmap.org`

### OSRM (Open Source Routing Machine)

- Free, no API key required
- Used for: driving route between waypoints (distance + duration + GeoJSON polyline)
- Base URL: `https://router.project-osrm.org`

### Leaflet.js + OpenStreetMap

- Free, no API key required
- Used for: rendering the route map in the frontend

---

## Environment Variables

### Backend (`backend/.env`)

```
DJANGO_SECRET_KEY=
DEBUG=True
NOMINATIM_USER_AGENT=hos_logger_app/1.0
```

### Frontend (`frontend/.env`)

```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## Deployment

Both apps deploy to **Vercel** from a single GitHub repository.

- Backend → Vercel Python runtime (detects `manage.py` automatically)
- Frontend → Vercel static build (Vite `dist/` output)
- Routes are split in `vercel.json`: `/api/*` → Django, everything else → React

Run locally:

```bash
# Backend
cd backend && venv\Scripts\activate && python manage.py runserver

# Frontend
cd frontend && npm run dev
```
