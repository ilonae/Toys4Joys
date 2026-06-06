import React, { useState, useRef, useEffect } from 'react'
import { C } from '@/tokens'
import { NAV_CATS } from '@/data/navigation'
import { useAuth, fullName } from '@/contexts/AuthContext'
import { useLocale, useLocalCategory } from '@/contexts/LocaleContext'
import MegaDrop from './MegaDrop'
import Icon from './ui/Icon'
import LanguageSwitcher from './LanguageSwitcher'
import { useIsMobile } from '@/hooks/useIsMobile'
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
  const { t } = useLocale()
  const localCategory = useLocalCategory()
  const isMobile = useIsMobile()
  const [activeDrop, setActiveDrop] = useState<string | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const userMenuTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close mobile menu on desktop resize
  useEffect(() => {
    if (!isMobile) setMobileMenuOpen(false)
  }, [isMobile])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

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

  const go = (p: Page, cat?: string, sub?: string) => {
    onNavigate(p, cat, sub)
    setMobileMenuOpen(false)
    setActiveDrop(null)
  }

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        height: isMobile ? '64px' : '112px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 12px' : '12px 80px',
      }}>
        {/* Logo */}
        <div
          onClick={() => go('home')}
          style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', padding: '0 4px' }}
        >
          <img
            src="/images/logo.svg"
            alt="TOYS4JOYS"
            draggable={false}
            style={{ height: isMobile ? '44px' : '72px', width: 'auto', display: 'block', pointerEvents: 'none', userSelect: 'none' }}
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

        {/* Desktop: Category links */}
        {!isMobile && (
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
                  {localCategory(cat)}
                  <Icon name="chevron-down" size={12} color={activeDrop === cat ? C.accent : C.textDim} />
                </button>
                {activeDrop === cat && (
                  <MegaDrop cat={cat} onNavigate={(p, c, s) => { onNavigate(p, c, s); setActiveDrop(null) }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0' : '18px' }}>
          {/* Desktop only: language + search + user */}
          {!isMobile && (
            <>
              <LanguageSwitcher />
              <button
                style={{ background: 'none', border: 'none', color: C.textMid, cursor: 'pointer', padding: '4px' }}
                aria-label="Suche"
              >
                <Icon name="search" size={18} color={C.textMid} />
              </button>

              <div style={{ position: 'relative' }} onMouseEnter={enterUserMenu} onMouseLeave={leaveUserMenu}>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                  onClick={() => { if (!user) { setShowUserMenu(false); onOpenAuth('login') } }}
                  aria-label={user ? t.nav.profile : t.nav.login}
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
                        <div style={{ padding: '12px 16px 10px', borderBottom: `1px solid ${C.border}` }}>
                          <div style={{ fontSize: '12px', color: C.text, marginBottom: '2px' }}>{fullName(user)}</div>
                          <div style={{ fontSize: '10px', color: C.textDim }}>{user.email}</div>
                        </div>
                        <MenuRow label={t.nav.profile.toUpperCase()} onClick={() => { onNavigate('profile', undefined, 'overview'); setShowUserMenu(false) }} />
                        <MenuRow label={t.nav.orders.toUpperCase()}  onClick={() => { onNavigate('profile', undefined, 'orders');   setShowUserMenu(false) }} />
                        {user.isAdmin && (
                          <>
                            <div style={{ borderTop: `1px solid ${C.border}` }} />
                            <MenuRow label={t.nav.admin.toUpperCase()} accent onClick={() => { onNavigate('admin'); setShowUserMenu(false) }} />
                          </>
                        )}
                        <div style={{ borderTop: `1px solid ${C.border}` }} />
                        <MenuRow label={t.nav.logout.toUpperCase()} accent onClick={() => { logout().then(() => setShowUserMenu(false)) }} />
                      </>
                    ) : (
                      <>
                        <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${C.border}` }}>
                          <div style={{ fontSize: '11px', letterSpacing: '0.08em', color: C.textDim, marginBottom: '12px' }}>{t.nav.profile.toUpperCase()}</div>
                          <button
                            onClick={() => { setShowUserMenu(false); onOpenAuth('login') }}
                            style={{ width: '100%', padding: '9px', background: C.accent, border: 'none', color: C.white, fontSize: '11px', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '8px' }}
                          >
                            {t.nav.login.toUpperCase()}
                          </button>
                          <button
                            onClick={() => { setShowUserMenu(false); onOpenAuth('register') }}
                            style={{ width: '100%', padding: '9px', background: 'none', border: `1px solid ${C.border}`, color: C.textMid, fontSize: '11px', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            {t.nav.register.toUpperCase()}
                          </button>
                        </div>
                        <MenuRow label={t.profile.trackingNumber} onClick={() => { setShowUserMenu(false); onOpenAuth('track') }} />
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Cart — always visible */}
          <button
            style={{
              background: 'none', border: 'none', color: C.textMid, cursor: 'pointer',
              padding: isMobile ? '12px' : '4px', position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={() => go('cart')}
            aria-label={t.nav.cart}
          >
            <Icon name="cart" size={18} color={C.textMid} />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: isMobile ? '6px' : '-2px', right: isMobile ? '6px' : '-2px',
                background: C.accent, color: C.white, borderRadius: '50%',
                width: '16px', height: '16px', fontSize: '9px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500,
              }}>
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile: Hamburger */}
          {isMobile && (
            <button
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onClick={() => setMobileMenuOpen(o => !o)}
              aria-label={mobileMenuOpen ? 'Menü schließen' : 'Menü öffnen'}
            >
              <Icon name={mobileMenuOpen ? 'x' : 'menu'} size={20} color={C.text} />
            </button>
          )}
        </div>
      </nav>

      {/* Mobile full-screen menu */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fade-in"
          style={{
            position: 'fixed', top: '64px', left: 0, right: 0, bottom: 0,
            background: C.bg, zIndex: 99,
            overflowY: 'auto',
            borderTop: `1px solid ${C.border}`,
            display: 'flex', flexDirection: 'column',
            paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          }}
        >
          {/* Shop all */}
          <button
            onClick={() => go('shop')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '18px 24px',
              background: 'none', border: 'none', borderBottom: `1px solid ${C.border}`,
              color: C.accent, fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {t.shop.all}
            <Icon name="chevron-right" size={14} color={C.accentDim} />
          </button>

          {/* Categories */}
          {NAV_CATS.map(cat => (
            <button
              key={cat}
              onClick={() => go('shop', cat)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '18px 24px',
                background: 'none', border: 'none', borderBottom: `1px solid ${C.border}`,
                color: C.textMid, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              }}
            >
              {localCategory(cat)}
              <Icon name="chevron-right" size={14} color={C.textDim} />
            </button>
          ))}

          {/* Language */}
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}` }}>
            <LanguageSwitcher />
          </div>

          {/* User section */}
          <div style={{ padding: '20px 24px', marginTop: 'auto' }}>
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '11px', color: C.textDim, marginBottom: '4px', letterSpacing: '0.06em' }}>
                  {fullName(user)}
                </div>
                <button
                  onClick={() => go('profile', undefined, 'overview')}
                  style={{ width: '100%', padding: '13px', background: 'none', border: `1px solid ${C.border}`, color: C.textMid, fontSize: '11px', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {t.nav.profile.toUpperCase()}
                </button>
                <button
                  onClick={() => { logout().then(() => setMobileMenuOpen(false)) }}
                  style={{ width: '100%', padding: '13px', background: 'none', border: `1px solid ${C.border}`, color: C.accent, fontSize: '11px', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {t.nav.logout.toUpperCase()}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenAuth('login') }}
                  style={{ width: '100%', padding: '14px', background: C.accent, border: 'none', color: C.white, fontSize: '12px', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {t.nav.login.toUpperCase()}
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenAuth('register') }}
                  style={{ width: '100%', padding: '14px', background: 'none', border: `1px solid ${C.border}`, color: C.textMid, fontSize: '12px', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {t.nav.register.toUpperCase()}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
