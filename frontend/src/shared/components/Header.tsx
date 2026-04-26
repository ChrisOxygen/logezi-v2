import { Link, useLocation } from 'react-router-dom'
import { useTripStore } from '@/shared/store/tripStore'

export function Header() {
  const location = useLocation()
  const trip = useTripStore((s) => s.trip)
  const endedTrip = useTripStore((s) => s.endedTrip)

  const active = location.pathname

  return (
    <header
      className="sticky top-0 z-50"
      style={{ background: 'var(--col-navy)', borderBottom: '1px solid rgba(255,255,255,.07)' }}
    >
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          {/* Truck glyph */}
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden="true">
            <rect x="0" y="3" width="12" height="8" rx="1.5" fill="var(--col-amber)" opacity=".9"/>
            <path d="M12 5h4l2 3v3h-6V5z" fill="var(--col-amber)"/>
            <circle cx="3.5" cy="12" r="2" fill="var(--col-navy)" stroke="var(--col-amber)" strokeWidth="1.2"/>
            <circle cx="14.5" cy="12" r="2" fill="var(--col-navy)" stroke="var(--col-amber)" strokeWidth="1.2"/>
          </svg>
          <span
            className="font-display font-extrabold tracking-widest text-sm uppercase"
            style={{ color: 'var(--col-amber)', letterSpacing: '0.12em' }}
          >
            HOS Logger
          </span>
        </Link>

        <nav className="flex gap-1">
          {trip && (
            <>
              <NavChip to="/map"  label="Map"  active={active} />
              <NavChip to="/log"  label="Log"  active={active} />
            </>
          )}
          {endedTrip && !trip && (
            <NavChip to="/end-trip" label="Last Trip" active={active} />
          )}
        </nav>
      </div>
    </header>
  )
}

function NavChip({ to, label, active }: { to: string; label: string; active: string }) {
  const isActive = active === to
  return (
    <Link
      to={to}
      className="nav-chip"
      style={
        isActive
          ? { background: 'var(--col-amber)', color: '#fff' }
          : { color: 'rgba(255,255,255,.55)' }
      }
      onMouseEnter={isActive ? undefined : (e) => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.08)'
        ;(e.currentTarget as HTMLElement).style.color = '#fff'
      }}
      onMouseLeave={isActive ? undefined : (e) => {
        (e.currentTarget as HTMLElement).style.background = ''
        ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.55)'
      }}
    >
      {label}
    </Link>
  )
}
