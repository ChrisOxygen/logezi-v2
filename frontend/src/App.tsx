import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useTripStore } from '@/shared/store/tripStore'
import { Header } from '@/shared/components/Header'
import { HomeScreen } from '@/features/home/HomeScreen'
import { MapScreen } from '@/features/map/MapScreen'
import { LogScreen } from '@/features/log/LogScreen'
import { EndTripScreen } from '@/features/end-trip/EndTripScreen'

function ActiveTripRoute({ children }: { children: React.ReactNode }) {
  const trip = useTripStore((s) => s.trip)
  const endedTrip = useTripStore((s) => s.endedTrip)
  if (!trip && endedTrip) return <Navigate to="/end-trip" replace />
  if (!trip) return <Navigate to="/" replace />
  return <>{children}</>
}

function EndedTripRoute({ children }: { children: React.ReactNode }) {
  const endedTrip = useTripStore((s) => s.endedTrip)
  if (!endedTrip) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route
          path="/map"
          element={
            <ActiveTripRoute>
              <MapScreen />
            </ActiveTripRoute>
          }
        />
        <Route
          path="/log"
          element={
            <ActiveTripRoute>
              <LogScreen />
            </ActiveTripRoute>
          }
        />
        <Route
          path="/end-trip"
          element={
            <EndedTripRoute>
              <EndTripScreen />
            </EndedTripRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
