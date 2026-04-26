import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { ActiveTrip, DutyStatus } from '@/shared/types'
import { DUTY_STATUS_LABELS } from '@/shared/types'

export interface LogMarker {
  lat: number
  lng: number
  entries: Array<{
    day: number
    time: string
    status: DutyStatus
    location: string
    remarks: string
  }>
}

// Fix default marker icon broken by Vite bundling
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)['_getIconUrl']
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const colorIcon = (color: string) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  })

interface TripMapProps {
  trip: ActiveTrip
  logMarkers?: LogMarker[]
}

export function TripMap({ trip, logMarkers = [] }: TripMapProps) {
  const { locations, route } = trip

  const routePositions: [number, number][] = route.geometry.coordinates.map(
    ([lng, lat]) => [lat as number, lng as number],
  )

  const center: [number, number] = [locations.current.lat, locations.current.lng]

  return (
    <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {routePositions.length > 0 && (
        <Polyline positions={routePositions} color="#3b82f6" weight={4} opacity={0.8} />
      )}

      <Marker
        position={[locations.current.lat, locations.current.lng]}
        icon={colorIcon('green')}
      >
        <Popup>Start: {locations.current.display_name}</Popup>
      </Marker>

      <Marker
        position={[locations.pickup.lat, locations.pickup.lng]}
        icon={colorIcon('orange')}
      >
        <Popup>Pickup: {locations.pickup.display_name}</Popup>
      </Marker>

      <Marker
        position={[locations.destination.lat, locations.destination.lng]}
        icon={colorIcon('red')}
      >
        <Popup>Destination: {locations.destination.display_name}</Popup>
      </Marker>

      {logMarkers.map((marker, i) => (
        <Marker key={i} position={[marker.lat, marker.lng]} icon={colorIcon('blue')}>
          <Popup>
            <div style={{ minWidth: 180 }}>
              <strong style={{ display: 'block', marginBottom: 6 }}>{marker.entries[0].location}</strong>
              {marker.entries.map((e, j) => (
                <div key={j} style={{ marginBottom: 4, paddingBottom: 4, borderBottom: j < marker.entries.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>Day {e.day} · {e.time}</div>
                  <div style={{ fontSize: 12 }}>{DUTY_STATUS_LABELS[e.status]}</div>
                  {e.remarks && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{e.remarks}</div>}
                </div>
              ))}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
