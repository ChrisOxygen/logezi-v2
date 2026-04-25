import { useState, useEffect, useRef, useCallback } from 'react'
import { searchLocations, type NominatimResult } from '@/shared/api/nominatim'

interface Props {
  label: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  error?: string
  labelClassName?: string
}

export function LocationAutocomplete({ label, placeholder, value, onChange, error, labelClassName }: Props) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close dropdown on any click outside this component
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setHighlighted(-1)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const runSearch = useCallback(async (query: string) => {
    setLoading(true)
    try {
      const results = await searchLocations(query)
      setSuggestions(results)
      setOpen(results.length > 0)
      setHighlighted(-1)
    } catch {
      setSuggestions([])
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(() => runSearch(value), 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [value, runSearch])

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  const select = (result: NominatimResult) => {
    onChange(result.display_name)
    setSuggestions([])
    setOpen(false)
    setHighlighted(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault()
      select(suggestions[highlighted]!)
    } else if (e.key === 'Escape') {
      setOpen(false)
      setHighlighted(-1)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <label className={`block font-medium text-gray-700 mb-1 ${labelClassName ?? 'text-sm'}`}>
        {label}
      </label>

      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          autoComplete="off"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
        />
        {loading && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs animate-pulse">
            …
          </span>
        )}
      </div>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {suggestions.map((result, i) => (
            <li
              key={result.place_id}
              onMouseDown={() => select(result)}
              onMouseEnter={() => setHighlighted(i)}
              className={`px-3 py-2 text-sm cursor-pointer truncate ${
                i === highlighted ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {result.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
