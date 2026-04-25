export interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

export async function searchLocations(query: string): Promise<NominatimResult[]> {
  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=0`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) return []
  return res.json() as Promise<NominatimResult[]>
}
