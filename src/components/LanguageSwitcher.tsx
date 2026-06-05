import React, { useEffect, useRef, useState } from 'react'
import { C } from '@/tokens'
import { LOCALES } from '@/lib/i18n'
import { useLocale } from '@/contexts/LocaleContext'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const current = LOCALES.find(l => l.code === locale) ?? LOCALES[0]

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', handler)
    window.addEventListener('keydown', keyHandler)
    return () => {
      window.removeEventListener('mousedown', handler)
      window.removeEventListener('keydown', keyHandler)
    }
  }, [open])

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'none',
          border: `1px solid ${open ? C.borderMid : 'transparent'}`,
          padding: '6px 10px', fontFamily: 'inherit',
          fontSize: '10px', letterSpacing: '0.12em',
          color: C.textMid, cursor: 'pointer',
          transition: 'border-color 0.15s, color 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = C.text }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = C.textMid }}
      >
        <span style={{ fontSize: '13px', lineHeight: 1 }}>{current.flag}</span>
        <span style={{ fontWeight: 500 }}>{current.label}</span>
        <svg
          width="9" height="9" viewBox="0 0 12 12" fill="none"
          style={{
            transition: 'transform 0.15s',
            transform: open ? 'rotate(180deg)' : 'none',
          }}
        >
          <path d="M2 4.5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0,
            background: C.bgCard,
            border: `1px solid ${C.borderMid}`,
            minWidth: '140px',
            zIndex: 200,
            boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
          }}
        >
          {LOCALES.map(l => {
            const active = l.code === locale
            return (
              <button
                key={l.code}
                role="option"
                aria-selected={active}
                onClick={() => { setLocale(l.code); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%',
                  background: active ? C.bgSurface : 'none',
                  border: 'none',
                  padding: '10px 14px',
                  fontFamily: 'inherit',
                  fontSize: '11px', letterSpacing: '0.1em',
                  color: active ? C.text : C.textMid,
                  cursor: 'pointer', textAlign: 'left',
                  borderLeft: `2px solid ${active ? C.accent : 'transparent'}`,
                  transition: 'background 0.12s, color 0.12s',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = C.bgSurface
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }}
              >
                <span style={{ fontSize: '14px', lineHeight: 1 }}>{l.flag}</span>
                <span style={{ fontWeight: active ? 500 : 400, flex: 1 }}>{l.label}</span>
                {active && <span style={{ color: C.accent, fontSize: '11px' }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
