import React from 'react'
import { C } from '@/tokens'
import { useLocale } from '@/contexts/LocaleContext'
import type { Page } from '@/types'

interface Props {
  onNavigate: (page: Page) => void
}

export default function Footer({ onNavigate }: Props) {
  const { t } = useLocale()

  const FOOTER_LINKS: { label: string; page: Page }[] = [
    { label: t.footer.about,      page: 'about'      },
    { label: t.footer.shipping,   page: 'shipping'   },
    { label: t.footer.withdrawal, page: 'withdrawal' },
    { label: t.footer.privacy,    page: 'privacy'    },
    { label: t.footer.terms,      page: 'terms'      },
    { label: t.footer.imprint,    page: 'imprint'    },
  ]

  return (
    <footer style={{ borderTop: `1px solid ${C.border}` }}>

      {/* ── Statement logo block ──────────────────────────────────────────── */}
      <div style={{
        padding: '80px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        borderBottom: `1px solid ${C.border}`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle grid background */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          opacity: 0.25,
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <img
            src="/images/logo.svg"
            alt="TOYS4JOYS"
            draggable={false}
            style={{
              width: 'clamp(200px, 30vw, 420px)', height: 'auto', display: 'block',
              filter: `drop-shadow(0 0 24px ${C.accent}99)`,
              pointerEvents: 'none', userSelect: 'none',
            }}
            onError={e => {
              const img = e.currentTarget
              img.style.display = 'none'
              const fallback = img.nextElementSibling as HTMLElement | null
              if (fallback) fallback.style.display = 'block'
            }}
          />
          <span style={{
            display: 'none',
            fontSize: 'clamp(48px, 10vw, 120px)', fontWeight: 700,
            letterSpacing: '0.14em', color: C.accent,
            textShadow: C.neonText, userSelect: 'none',
          }}>
            TOYS4JOYS
          </span>
          <div style={{ fontSize: '11px', letterSpacing: '0.18em', color: C.textDim, textTransform: 'uppercase' }}>
            {t.footer.tagline}
          </div>
        </div>
      </div>

      {/* ── Links + copyright ─────────────────────────────────────────────── */}
      <div style={{ padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {FOOTER_LINKS.map(({ label, page }) => (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              style={{
                background: 'none', border: 'none', padding: 0,
                fontSize: '11px', color: C.textDim, cursor: 'pointer',
                letterSpacing: '0.06em', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = C.textMid }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = C.textDim }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '24px', fontSize: '10px', color: C.textGhost, letterSpacing: '0.08em' }}>
          <span>© 2026 Toys4Joys · Viet Anh Nguyen · Berlin</span>
          <span>{t.footer.adult}</span>
        </div>
      </div>
    </footer>
  )
}
