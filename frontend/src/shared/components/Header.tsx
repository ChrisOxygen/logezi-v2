import { Link, useLocation } from 'react-router-dom'
import { useTripStore } from '@/shared/store/tripStore'

const NAV = [
  { path: '/', label: 'Home' },
  { path: '/map', label: 'Map' },
  { path: '/log', label: 'Log' },
  { path: '/end-trip', label: 'End Trip' },
]

export function Header() {
  const location = useLocation()
  const trip = useTripStore((s) => s.trip)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-bold text-gray-900 text-sm tracking-wide">
          HOS Logger
        </Link>
        {trip && (
          <nav className="flex gap-1">
            {NAV.slice(1).map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  location.pathname === path
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}
