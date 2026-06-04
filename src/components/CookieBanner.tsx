import React, { useState } from 'react'
import { C } from '@/tokens'
import type { Page } from '@/types'

const KEY = 't4j_cookie_ok'

export function useCookieConsent() {
  const [accepted, setAccepted] = useState<boolean>(() =>
    localStorage.getItem(KEY) === '1'
  )
  const accept  = () => { localStorage.setItem(KEY, '1'); setAccepted(true) }
  const decline = () => { localStorage.setItem(KEY, '0'); setAccepted(true) }
  return { accepted, accept, decline, shown: localStorage.getItem(KEY) === null }
}

export default function CookieBanner({
  onAccept,
  onDecline,
  onNavigate,
}: {
  onAccept: () => void
  onDecline: () => void
  onNavigate: (page: Page) => void
}) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 8000,
      background: C.bgCard,
      borderTop: `1px solid ${C.border}`,
      padding: '20px 32px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '24px', flexWrap: 'wrap',
    }}>
      <p style={{ fontSize: '12px', color: C.textMid, lineHeight: 1.7, margin: 0, flex: 1, minWidth: '240px' }}>
        Wir verwenden Cookies und ähnliche Technologien für sichere Zahlungen und eine bessere Nutzererfahrung.
        Weitere Informationen in unserer{' '}
        <button
          onClick={() => onNavigate('privacy')}
          style={{
            background: 'none', border: 'none', padding: 0,
            color: C.textMid, cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 'inherit', textDecoration: 'underline', textUnderlineOffset: '3px',
          }}
        >
          Datenschutzerklärung
        </button>.
      </p>
      <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
        <button
          onClick={onDecline}
          style={{
            background: 'none', border: `1px solid ${C.border}`,
            color: C.textDim, fontSize: '11px', letterSpacing: '0.1em',
            padding: '9px 20px', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = C.borderMid; el.style.color = C.textMid }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = C.border; el.style.color = C.textDim }}
        >
          NUR NOTWENDIGE
        </button>
        <button
          onClick={onAccept}
          style={{
            background: C.accent, border: 'none',
            color: C.white, fontSize: '11px', letterSpacing: '0.1em',
            padding: '9px 20px', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = C.accentDim }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = C.accent }}
        >
          ALLE AKZEPTIEREN
        </button>
      </div>
    </div>
  )
}
