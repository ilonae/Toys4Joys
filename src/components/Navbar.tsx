import React, { useState, useRef } from 'react'
import { C } from '@/tokens'
import { NAV_CATS } from '@/data/navigation'
import { useAuth, fullName } from '@/contexts/AuthContext'
import MegaDrop from './MegaDrop'
import Icon from './ui/Icon'
import type { Page } from '@/types'

interface Props {
  page: Page
  cartCount: number
  onNavigate: (page: Page, cat?: string, sub?: string) => void
  onOpenAuth: (tab?: 'login' | 'register' | 'track') => void
}

function MenuRow({ label, onClick, accent }: { label: string; onClick: () => void; accent?: boolean }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        background: hovered ? C.bgSurface : 'none',
        border: 'none', padding: '10px 16px',
        fontSize: '11px', letterSpacing: '0.08em',
        color: accent ? C.accent : hovered ? C.text : C.textMid,
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'background 0.1s, color 0.1s',
      }}
    >
      {label}
    </button>
  )
}

export default function Navbar({ page, cartCount, onNavigate, onOpenAuth }: Props) {
  const { user, logout } = useAuth()
  const [activeDrop, setActiveDrop] = useState<string | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const userMenuTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const enter = (cat: string) => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    setActiveDrop(cat)
  }
  const leave = () => {
    leaveTimer.current = setTimeout(() => setActiveDrop(null), 180)
  }
  const enterUserMenu = () => {
    if (userMenuTimer.current) clearTimeout(userMenuTimer.current)
    setShowUserMenu(true)
  }
  const leaveUserMenu = () => {
    userMenuTimer.current = setTimeout(() => setShowUserMenu(false), 200)
  }

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: C.bg, borderBottom: `1px solid ${C.border}`,
      height: '96px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 64px',
    }}>
      {/* Logo */}
      <div
        onClick={() => onNavigate('home')}
        style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', height: '72px' }}
      >
        <img
          src="/images/logo.svg"
          alt="TOYS4JOYS"
          draggable={false}
          style={{ height: '72px', width: 'auto', display: 'block', pointerEvents: 'none', userSelect: 'none' }}
          onError={e => {
            const img = e.currentTarget
            img.style.display = 'none'
            const fallback = img.nextElementSibling as HTMLElement | null
            if (fallback) fallback.style.display = 'block'
          }}
        />
        <span style={{ display: 'none', fontSize: '15px', fontWeight: 700, letterSpacing: '0.12em', color: C.accent, textShadow: C.neonText }}>
          TOYS4JOYS
        </span>
      </div>

      {/* Category links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {NAV_CATS.map(cat => (
          <div key={cat} style={{ position: 'relative' }} onMouseEnter={() => enter(cat)} onMouseLeave={leave}>
            <button
              onClick={() => { onNavigate('shop', cat); setActiveDrop(null) }}
              style={{
                background: 'none', border: 'none',
                color: activeDrop === cat ? C.text : C.textMid,
                fontSize: '11px', fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: 'pointer', padding: '8px 12px', transition: 'color 0.12s',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              {cat}
              <Icon name="chevron-down" size={12} color={activeDrop === cat ? C.accent : C.textDim} />
            </button>
            {activeDrop === cat && (
              <MegaDrop cat={cat} onNavigate={(p, c, s) => { onNavigate(p, c, s); setActiveDrop(null) }} />
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        <button
          style={{ background: 'none', border: 'none', color: C.textMid, cursor: 'pointer', padding: '4px' }}
          aria-label="Suche"
        >
          <Icon name="search" size={18} color={C.textMid} />
        </button>

        {/* Login / Profile button */}
        <div style={{ position: 'relative' }} onMouseEnter={enterUserMenu} onMouseLeave={leaveUserMenu}>
          <button
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
              display: 'flex', alignItems: 'center',
            }}
            onClick={() => { if (!user) { setShowUserMenu(false); onOpenAuth('login') } }}
            aria-label={user ? 'Mein Konto' : 'Anmelden'}
          >
            <Icon name={user ? 'user-check' : 'user'} size={18} color={user ? C.accent : C.textMid} />
          </button>

          {showUserMenu && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: C.bgCard, border: `1px solid ${C.border}`,
              minWidth: '190px', zIndex: 200,
            }}>
              {user ? (
                <>
                  {/* Logged-in header */}
                  <div style={{ padding: '12px 16px 10px', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: '12px', color: C.text, marginBottom: '2px' }}>{fullName(user)}</div>
                    <div style={{ fontSize: '10px', color: C.textDim }}>{user.email}</div>
                  </div>
                  <MenuRow label="MEIN KONTO"           onClick={() => { onNavigate('profile'); setShowUserMenu(false) }} />
                  <MenuRow label="MEINE BESTELLUNGEN"   onClick={() => { onNavigate('profile'); setShowUserMenu(false) }} />
                  {user.isAdmin && (
                    <>
                      <div style={{ borderTop: `1px solid ${C.border}` }} />
                      <MenuRow label="ADMIN / CMS" accent onClick={() => { onNavigate('admin'); setShowUserMenu(false) }} />
                    </>
                  )}
                  <div style={{ borderTop: `1px solid ${C.border}` }} />
                  <MenuRow label="ABMELDEN" accent onClick={() => { logout().then(() => setShowUserMenu(false)) }} />
                </>
              ) : (
                <>
                  <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: '11px', letterSpacing: '0.08em', color: C.textDim, marginBottom: '12px' }}>KONTO</div>
                    <button
                      onClick={() => { setShowUserMenu(false); onOpenAuth('login') }}
                      style={{ width: '100%', padding: '9px', background: C.accent, border: 'none', color: C.white, fontSize: '11px', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '8px' }}
                    >
                      ANMELDEN
                    </button>
                    <button
                      onClick={() => { setShowUserMenu(false); onOpenAuth('register') }}
                      style={{ width: '100%', padding: '9px', background: 'none', border: `1px solid ${C.border}`, color: C.textMid, fontSize: '11px', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      REGISTRIEREN
                    </button>
                  </div>
                  <MenuRow label="BESTELLUNG VERFOLGEN" onClick={() => { setShowUserMenu(false); onOpenAuth('track') }} />
                </>
              )}
            </div>
          )}
        </div>

        {/* Cart */}
        <button
          style={{ background: 'none', border: 'none', color: C.textMid, cursor: 'pointer', padding: '4px', position: 'relative' }}
          onClick={() => onNavigate('cart')}
          aria-label="Warenkorb"
        >
          <Icon name="cart" size={18} color={C.textMid} />
          {cartCount > 0 && (
            <span style={{
              position: 'absolute', top: '-2px', right: '-2px',
              background: C.accent, color: C.white, borderRadius: '50%',
              width: '16px', height: '16px', fontSize: '9px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500,
            }}>
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  )
}
