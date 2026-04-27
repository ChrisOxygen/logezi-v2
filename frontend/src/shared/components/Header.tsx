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
        <Link to="/" className="flex items-center group">
          <img
            src="/brand/logezi-logo-white.webp"
            alt="logEzi"
            className="h-7 w-auto"
          />
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
