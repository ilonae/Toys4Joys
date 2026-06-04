import React, { useEffect, useState } from 'react'
import { C } from '@/tokens'

// ── Launch target: 05 June 2026, 23:00 Berlin time ───────────────────────────
const LAUNCH = new Date('2026-06-05T23:00:00+02:00').getTime()

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function getTimeLeft() {
  const diff = Math.max(0, LAUNCH - Date.now())
  const days    = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours   = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)
  return { days, hours, minutes, seconds, done: diff === 0 }
}

function Unit({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div style={{
        fontSize: 'clamp(56px, 10vw, 128px)',
        fontWeight: 700,
        letterSpacing: '-0.04em',
        lineHeight: 1,
        color: C.text,
        fontVariantNumeric: 'tabular-nums',
        minWidth: '2ch',
        textAlign: 'center',
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '10px',
        letterSpacing: '0.22em',
        color: C.textDim,
        textTransform: 'uppercase',
      }}>
        {label}
      </div>
    </div>
  )
}

function Sep() {
  return (
    <div style={{
      fontSize: 'clamp(40px, 7vw, 96px)',
      fontWeight: 300,
      color: C.accent,
      lineHeight: 1,
      marginBottom: '32px',
      opacity: 0.6,
      alignSelf: 'flex-start',
      paddingTop: '8px',
    }}>
      :
    </div>
  )
}

export default function ComingSoon() {
  const [time, setTime] = useState(getTimeLeft())

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: '40px 32px',
    }}>

      {/* Grid background */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        opacity: 0.3,
      }} />

      {/* Neon glow orb */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px', height: '600px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${C.accent}18 0%, transparent 70%)`,
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Accent lines */}
      <div style={{ position: 'absolute', left: '5%', top: '20%', width: '1px', height: '200px', background: `linear-gradient(transparent, ${C.accent}, transparent)`, zIndex: 0 }} />
      <div style={{ position: 'absolute', right: '5%', bottom: '25%', width: '1px', height: '140px', background: `linear-gradient(transparent, ${C.accent}, transparent)`, zIndex: 0 }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '64px', textAlign: 'center' }}>

        {/* Logo */}
        <img
          src="/images/logo.svg"
          alt="TOYS4JOYS"
          draggable={false}
          style={{
            height: 'clamp(48px, 8vw, 96px)',
            width: 'auto',
            filter: `drop-shadow(0 0 20px ${C.accent}88)`,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
          onError={e => {
            const img = e.currentTarget
            img.style.display = 'none'
            const fb = img.nextElementSibling as HTMLElement | null
            if (fb) fb.style.display = 'block'
          }}
        />
        <span style={{ display: 'none', fontSize: 'clamp(24px, 5vw, 56px)', fontWeight: 700, letterSpacing: '0.14em', color: C.accent, textShadow: C.neonText }}>
          TOYS4JOYS
        </span>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.28em', color: C.accent, textTransform: 'uppercase' }}>
            Berlin · 05. Juni 2026
          </div>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 56px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
            color: C.text,
            margin: 0,
          }}>
            Wir kommen.<br />
            <span style={{ color: C.accent }}>05. Juni 2026.</span>
          </h1>
          <div style={{ fontSize: '13px', color: C.textDim, letterSpacing: '0.06em' }}>
            23:00 Uhr
          </div>
        </div>

        {/* Countdown */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <Unit value={pad(time.days)}    label="Tage" />
          <Sep />
          <Unit value={pad(time.hours)}   label="Stunden" />
          <Sep />
          <Unit value={pad(time.minutes)} label="Minuten" />
          <Sep />
          <Unit value={pad(time.seconds)} label="Sekunden" />
        </div>

        {/* Tagline */}
        <div style={{
          fontSize: '12px',
          color: C.textDim,
          letterSpacing: '0.1em',
          lineHeight: 1.8,
          maxWidth: '360px',
          borderTop: `1px solid ${C.border}`,
          paddingTop: '32px',
        }}>
          Premium Kink. Aus Berlin.<br />
          Kein Kompromiss. Kein Warten mehr.
        </div>
      </div>
    </div>
  )
}
