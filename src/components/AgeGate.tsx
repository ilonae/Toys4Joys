import React, { useEffect, useState } from 'react'
import { C } from '@/tokens'
import { useLocale } from '@/contexts/LocaleContext'
import type { Page } from '@/types'

const KEY = 't4j_age_ok'

export function useAgeGate() {
  const [verified, setVerified] = useState<boolean>(() =>
    sessionStorage.getItem(KEY) === '1'
  )
  const confirm = () => { sessionStorage.setItem(KEY, '1'); setVerified(true) }
  return { verified, confirm }
}

export default function AgeGate({
  onConfirm,
  onNavigate,
}: {
  onConfirm: () => void
  onNavigate: (page: Page) => void
}) {
  const { t } = useLocale()

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const linkStyle: React.CSSProperties = {
    background: 'none', border: 'none', padding: 0,
    color: C.textMid, cursor: 'pointer', fontFamily: 'inherit',
    fontSize: 'inherit', textDecoration: 'underline', textUnderlineOffset: '2px',
  }

  // Split the heading at the first "?" (or use full heading) — show first half in white, second in accent
  const headingParts = t.ageGate.heading.split(/\s+/)
  const headingHalf  = Math.ceil(headingParts.length / 2)
  const headingLine1 = headingParts.slice(0, headingHalf).join(' ')
  const headingLine2 = headingParts.slice(headingHalf).join(' ')

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: C.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px',
    }}>
      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        opacity: 0.25,
        pointerEvents: 'none',
      }} />

      {/* Glow orb */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px', height: '500px', borderRadius: '50%',
        background: `radial-gradient(circle, ${C.accent}14 0%, transparent 70%)`,
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px', maxWidth: '400px', textAlign: 'center' }}>

        {/* Logo */}
        <img
          src="/images/logo.svg"
          alt="TOYS4JOYS"
          style={{ height: '56px', width: 'auto', filter: `drop-shadow(0 0 16px ${C.accent}66)`, userSelect: 'none' }}
          onError={e => {
            const img = e.currentTarget
            img.style.display = 'none'
            const fb = img.nextElementSibling as HTMLElement | null
            if (fb) fb.style.display = 'block'
          }}
        />
        <span style={{ display: 'none', fontSize: '22px', fontWeight: 700, letterSpacing: '0.14em', color: C.accent }}>TOYS4JOYS</span>

        {/* Copy */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.24em', color: C.textDim, textTransform: 'uppercase' }}>
            18+
          </div>
          <h1 style={{ fontSize: 'clamp(22px, 5vw, 34px)', fontWeight: 700, letterSpacing: '-0.01em', color: C.text, margin: 0, lineHeight: 1.1 }}>
            {headingLine1}<br />
            <span style={{ color: C.accent }}>{headingLine2}</span>
          </h1>
          <p style={{ fontSize: '12px', color: C.textDim, lineHeight: 1.7, margin: 0 }}>
            {t.ageGate.sub}
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          <button
            onClick={onConfirm}
            style={{
              width: '100%', padding: '16px',
              background: C.accent, border: 'none',
              color: C.white, fontSize: '12px', fontWeight: 600,
              letterSpacing: '0.14em', cursor: 'pointer',
              fontFamily: 'inherit', transition: 'background 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = C.accentDim }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = C.accent }}
          >
            {t.ageGate.confirm}
          </button>
          <a
            href="https://www.google.com"
            rel="noopener noreferrer"
            style={{
              width: '100%', padding: '14px',
              background: 'none',
              border: `1px solid ${C.border}`,
              color: C.textDim, fontSize: '11px',
              letterSpacing: '0.12em', cursor: 'pointer',
              fontFamily: 'inherit', textDecoration: 'none',
              display: 'block', boxSizing: 'border-box' as const,
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = C.borderMid; el.style.color = C.textMid }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = C.border; el.style.color = C.textDim }}
          >
            {t.ageGate.deny}
          </a>
        </div>

        {/* Legal links — users must be able to read before confirming */}
        <div style={{ fontSize: '10px', color: C.textDim, letterSpacing: '0.06em', lineHeight: 1.8 }}>
          {t.ageGate.legal}{' '}
          <button style={linkStyle} onClick={() => onNavigate('terms')}>{t.ageGate.termsLink}</button>
          {' & '}
          <button style={linkStyle} onClick={() => onNavigate('privacy')}>{t.ageGate.privacyLink}</button>.
        </div>
      </div>
    </div>
  )
}
