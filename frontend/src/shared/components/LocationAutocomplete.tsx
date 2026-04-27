import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { searchLocations, type NominatimResult } from '@/shared/api/nominatim'

interface Props {
  label: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  error?: string
  labelClassName?: string
}

interface DropdownPos {
  top: number
  left: number
  width: number
}

export function LocationAutocomplete({ label, placeholder, value, onChange, error }: Props) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const [dropdownPos, setDropdownPos] = useState<DropdownPos | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputWrapRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const calcPos = useCallback(() => {
    if (!inputWrapRef.current) return
    const rect = inputWrapRef.current.getBoundingClientRect()
    setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
  }, [])

  useEffect(() => {
    if (!open) return
    calcPos()
    window.addEventListener('scroll', calcPos, true)
    window.addEventListener('resize', calcPos)
    return () => {
      window.removeEventListener('scroll', calcPos, true)
      window.removeEventListener('resize', calcPos)
    }
  }, [open, calcPos])

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
    <div ref={containerRef}>
      <label className="field-label">{label}</label>

      <div ref={inputWrapRef} className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          autoComplete="off"
          className="field"
          style={{ paddingRight: '2rem' }}
        />
        {loading && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs animate-pulse"
            style={{ color: 'var(--col-text-3)' }}
          >
            ···
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs mt-1" style={{ color: 'var(--col-red)' }}>{error}</p>
      )}

      {open && suggestions.length > 0 && dropdownPos && createPortal(
        <ul
          className="rounded-xl overflow-hidden anim-slide-down"
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 9999,
            background: '#ffffff',
            border: '1px solid var(--col-border)',
            boxShadow: '0 8px 24px rgba(13,27,46,.15)',
            maxHeight: '14rem',
            overflowY: 'auto',
          }}
        >
          {suggestions.map((result, i) => (
            <li
              key={result.place_id}
              onMouseDown={() => select(result)}
              onMouseEnter={() => setHighlighted(i)}
              className="px-3 py-2.5 text-sm cursor-pointer truncate transition-colors"
              style={{
                background: i === highlighted ? 'var(--col-amber-pale)' : 'transparent',
                color: i === highlighted ? 'var(--col-amber-dim)' : 'var(--col-text-2)',
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--col-border-2)' : 'none',
              }}
            >
              {result.display_name}
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  )
}
