import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useTripStore } from '@/shared/store/tripStore'
import { Header } from '@/shared/components/Header'
import { HomeScreen } from '@/features/home/HomeScreen'
import { MapScreen } from '@/features/map/MapScreen'
import { LogScreen } from '@/features/log/LogScreen'
import { EndTripScreen } from '@/features/end-trip/EndTripScreen'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const trip = useTripStore((s) => s.trip)
  if (!trip) return <Navigate to="/" replace />
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
            <ProtectedRoute>
              <MapScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/log"
          element={
            <ProtectedRoute>
              <LogScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/end-trip"
          element={
            <ProtectedRoute>
              <EndTripScreen />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
