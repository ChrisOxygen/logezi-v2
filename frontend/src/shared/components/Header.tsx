import { Link, useLocation } from 'react-router-dom'
import { useTripStore } from '@/shared/store/tripStore'

export function Header() {
  const location = useLocation()
  const trip = useTripStore((s) => s.trip)
  const endedTrip = useTripStore((s) => s.endedTrip)

  const active = location.pathname

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-bold text-gray-900 text-sm tracking-wide">
          HOS Logger
        </Link>

        <nav className="flex gap-1">
          {trip && (
            <>
              <NavLink to="/map" label="Map" active={active} />
              <NavLink to="/log" label="Log" active={active} />
            </>
          )}
          {endedTrip && !trip && (
            <NavLink to="/end-trip" label="Last Trip" active={active} />
          )}
        </nav>
      </div>
    </header>
  )
}

function NavLink({ to, label, active }: { to: string; label: string; active: string }) {
  return (
    <Link
      to={to}
      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
        active === to
          ? 'bg-blue-600 text-white'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {label}
    </Link>
  )
}
