import React, { useState, useRef, useEffect } from 'react'
import { C } from '@/tokens'

interface Suggestion {
  street:  string
  zip:     string
  city:    string
  country: string
  label:   string
}

interface Props {
  label:       string
  value:       string
  onChange:    (v: string) => void
  onSelect:    (s: Pick<Suggestion, 'street' | 'zip' | 'city' | 'country'>) => void
  placeholder?: string
  required?:    boolean
  error?:       string
}

function countryName(code: string): string {
  const map: Record<string, string> = {
    de: 'Deutschland', at: 'Österreich', ch: 'Schweiz',
    fr: 'Frankreich', nl: 'Niederlande', be: 'Belgien',
    lu: 'Luxemburg', pl: 'Polen', cz: 'Tschechien',
    gb: 'Vereinigtes Königreich',
  }
  return map[code.toLowerCase()] ?? code.toUpperCase()
}

export default function AddressAutocomplete({
  label, value, onChange, onSelect, placeholder, required, error,
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open,        setOpen]        = useState(false)
  const [focused,     setFocused]     = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const wrapRef  = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleChange = (v: string) => {
    onChange(v)
    clearTimeout(timerRef.current)
    if (v.length < 3) { setSuggestions([]); setOpen(false); return }

    timerRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(v)}&lang=de&limit=6`,
          { headers: { 'Accept': 'application/json' } }
        )
        const data = await res.json()
        const features = (data.features ?? []) as any[]

        const parsed: Suggestion[] = features
          .map((f: any) => {
            const p       = f.properties ?? {}
            const street  = [p.street ?? p.name, p.housenumber].filter(Boolean).join(' ')
            const zip     = p.postcode ?? ''
            const city    = p.city ?? p.town ?? p.village ?? p.county ?? ''
            const country = countryName(p.countrycode ?? '')
            const label   = [street, zip, city, country].filter(Boolean).join(', ')
            return { street, zip, city, country, label }
          })
          .filter(s => s.street && s.city) // drop incomplete results

        setSuggestions(parsed)
        setOpen(parsed.length > 0)
      } catch {
        setSuggestions([])
        setOpen(false)
      }
    }, 280)
  }

  const handleSelect = (s: Suggestion) => {
    onChange(s.street)
    onSelect({ street: s.street, zip: s.zip, city: s.city, country: s.country })
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div ref={wrapRef} style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
      <span style={{ fontSize: '10px', letterSpacing: '0.1em', color: C.textMid, textTransform: 'uppercase' }}>
        {label}{required && <span style={{ color: C.accent, marginLeft: '2px' }}>*</span>}
      </span>
      <input
        type="text"
        value={value}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => { setFocused(true);  if (suggestions.length) setOpen(true) }}
        onBlur={() =>  setFocused(false)}
        placeholder={placeholder}
        autoComplete="off"
        style={{
          background: C.bgCard,
          border: `1px solid ${error ? C.accent : focused ? C.accent : C.border}`,
          color: C.text,
          padding: '10px 12px',
          fontSize: '13px',
          fontFamily: 'inherit',
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
      {error && <span style={{ fontSize: '10px', color: C.accent }}>{error}</span>}

      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          background: C.bgCard, border: `1px solid ${C.border}`,
          boxShadow: `0 8px 24px rgba(0,0,0,0.4)`,
          maxHeight: '240px', overflowY: 'auto',
        }}>
          {suggestions.map((s, i) => (
            <div
              key={i}
              onMouseDown={() => handleSelect(s)} // mousedown fires before blur
              style={{
                padding: '10px 14px',
                fontSize: '12px',
                color: C.textMid,
                cursor: 'pointer',
                borderBottom: i < suggestions.length - 1 ? `1px solid ${C.border}` : 'none',
                lineHeight: 1.4,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = C.bgSurface)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
