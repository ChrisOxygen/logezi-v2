import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTripStore } from '@/shared/store/tripStore'
import { generateLogPDF, geocodeAddress, isApiError } from '@/shared/api/client'
import { TripMap, type LogMarker } from '@/features/map/TripMap'
import { DailyLogSheet } from './DailyLogSheet'
import { buildDriversDailyLog } from '@/shared/utils/buildDailyLog'

export function EndTripScreen() {
  const navigate = useNavigate()
  const endedTrip = useTripStore((s) => s.endedTrip)!
  const abandonTrip = useTripStore((s) => s.abandonTrip)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logMarkers, setLogMarkers] = useState<LogMarker[]>([])

  useEffect(() => {
    const locationMap = new Map<string, LogMarker['entries']>()
    endedTrip.days.forEach((day) => {
      day.entries.forEach((entry) => {
        const loc = entry.location.trim()
        if (!loc) return
        if (!locationMap.has(loc)) locationMap.set(loc, [])
        locationMap.get(loc)!.push({
          day: day.day_number,
          time: entry.time,
          status: entry.status,
          location: loc,
          remarks: entry.remarks,
        })
      })
    })

    Promise.allSettled(
      Array.from(locationMap.entries()).map(([loc, entries]) =>
        geocodeAddress(loc).then((geo) => ({ geo, entries })),
      ),
    ).then((results) => {
      const markers: LogMarker[] = []
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { geo, entries } = result.value
          markers.push({ lat: geo.lat, lng: geo.lng, entries })
        }
      })
      setLogMarkers(markers)
    })
  }, [endedTrip])

  const handleDownloadPDF = async () => {
    setDownloading(true)
    setError(null)
    try {
      const blob = await generateLogPDF(endedTrip.days)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'driver_log.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to generate PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const handleStartNew = () => {
    abandonTrip()
    navigate('/')
  }

  return (
    <div className="min-h-screen pb-16" style={{ background: 'var(--col-bg)' }}>
      {/* Map */}
      <div className="h-[38vh]">
        <TripMap trip={endedTrip} logMarkers={logMarkers} />
      </div>

      <div className="max-w-2xl mx-auto p-4 flex flex-col gap-5">

        {/* Trip complete hero */}
        <div className="card p-6 anim-fade-up">
          {/* completion accent */}
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--col-green-pale)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--col-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <span className="section-label" style={{ color: 'var(--col-green)' }}>Trip Complete</span>
          </div>

          <h2
            className="font-display font-bold mb-1"
            style={{ fontSize: '1.4rem', color: 'var(--col-text)' }}
          >
            {endedTrip.setup.pickup}
            <span style={{ color: 'var(--col-text-3)', fontWeight: 500 }}> → </span>
            {endedTrip.setup.destination}
          </h2>
          <p className="text-sm mb-5" style={{ color: 'var(--col-text-3)' }}>
            From {endedTrip.setup.current_location}
          </p>

          <div
            className="flex gap-8 pt-4"
            style={{ borderTop: '1px solid var(--col-border-2)' }}
          >
            <div className="stat-tile">
              <span className="stat-tile-label">Total Miles</span>
              <span className="stat-tile-value">{Math.round(endedTrip.route.total_miles)}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Days Logged</span>
              <span className="stat-tile-value">{endedTrip.days.length}</span>
            </div>
          </div>
        </div>

        {/* Per-day full log sheets */}
        {endedTrip.days.map((day, idx) => (
          <div
            key={day.day_number}
            className="anim-fade-up"
            style={{ animationDelay: `${(idx + 1) * 60}ms` }}
          >
            <DailyLogSheet log={buildDriversDailyLog(day)} dayNumber={day.day_number} />
          </div>
        ))}

        {error && (
          <div className="alert alert-error anim-slide-down">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 anim-fade-up delay-5">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="btn btn-amber"
          >
            {downloading ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Generating PDF…
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download Log Sheets (PDF)
              </>
            )}
          </button>
          <button className="btn btn-outline" onClick={handleStartNew}>
            Start New Trip
          </button>
        </div>

      </div>
    </div>
  )
}
