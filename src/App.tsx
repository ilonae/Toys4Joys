import React, { useState, Component } from 'react'
import { C } from '@/tokens'
import { AuthProvider } from '@/contexts/AuthContext'
import { LocaleProvider } from '@/contexts/LocaleContext'
import ComingSoon from '@/pages/ComingSoon'
import Navbar from '@/components/Navbar'
import AgeGate, { useAgeGate } from '@/components/AgeGate'
import CookieBanner, { useCookieConsent } from '@/components/CookieBanner'

// ── 🚀 LAUNCH TOGGLE ─────────────────────────────────────────────────────────
// Controlled by VITE_COMING_SOON env var.
// Production (Vercel): unset or "true"  → shows countdown page
// Local dev (.env.local): set VITE_COMING_SOON=false → shows full site
const COMING_SOON = import.meta.env.VITE_COMING_SOON !== 'false'
// ─────────────────────────────────────────────────────────────────────────────
import Footer from '@/components/Footer'
import Toast from '@/components/Toast'
import AuthModal from '@/components/AuthModal'
import Landing from '@/pages/Landing'
import Shop from '@/pages/Shop'
import ProductDetail from '@/pages/ProductDetail'
import Cart from '@/pages/Cart'
import Checkout from '@/pages/Checkout'
import ProfilePage from '@/pages/ProfilePage'
import Admin from '@/pages/Admin'
import StaticPage from '@/pages/StaticPage'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'
import { useToast } from '@/hooks/useToast'
import { usePageMeta } from '@/hooks/usePageMeta'
import type { Page, Product } from '@/types'

const STATIC_PAGES: Page[] = ['about', 'shipping', 'privacy', 'terms', 'imprint', 'press', 'withdrawal']

// Legal pages accessible BEFORE age verification —
// users must be able to read T&C and Privacy before they can confirm the gate
const LEGAL_PAGES: Page[] = ['terms', 'privacy', 'imprint', 'withdrawal', 'about', 'shipping']

interface NavState {
  page: Page
  cat?: string
  sub?: string
  product?: Product
}

// ── Error boundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '20px', background: C.bg, color: C.text, textAlign: 'center', padding: '32px' }}>
        <div style={{ fontSize: '12px', letterSpacing: '0.1em', color: C.accent }}>UNERWARTETER FEHLER</div>
        <div style={{ fontSize: '12px', color: C.textDim, maxWidth: '360px', lineHeight: 1.7 }}>
          Etwas ist schiefgelaufen. Bitte lade die Seite neu oder kontaktiere uns unter{' '}
          <a href="mailto:hallo@toys4joys.de" style={{ color: C.textMid }}>hallo@toys4joys.de</a>.
        </div>
        <button onClick={() => window.location.reload()} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.textMid, padding: '10px 24px', cursor: 'pointer', fontSize: '11px', letterSpacing: '0.1em', fontFamily: 'inherit' }}>
          SEITE NEU LADEN
        </button>
      </div>
    )
    return this.props.children
  }
}

function AppInner() {
  const [nav, setNav] = useState<NavState>({ page: 'home' })
  const age    = useAgeGate()
  const cookie = useCookieConsent()
  const [authModal, setAuthModal] = useState<{ open: boolean; tab: 'login' | 'register' | 'track' }>({
    open: false,
    tab: 'login',
  })

  const cart = useCart()
  const wish = useWishlist()
  const toast = useToast()

  usePageMeta({ page: nav.page, product: nav.product, cat: nav.cat })

  const navigate = (page: Page, cat?: string, sub?: string) => {
    setNav({ page, cat, sub })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openProduct = (product: Product) => {
    setNav({ page: 'product', product })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const addToCart = (product: Product) => {
    cart.add(product)
    toast.push(`${product.name} wurde hinzugefügt`)
  }

  const toggleWish = (product: Product) => {
    const wasWished = wish.has(product.id)
    wish.toggle(product)
    toast.push(wasWished ? 'Von Wunschliste entfernt' : 'Zur Wunschliste hinzugefügt')
  }

  const openAuth = (tab: 'login' | 'register' | 'track' = 'login') => {
    setAuthModal({ open: true, tab })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: C.bg, color: C.text }}>
      <Navbar
        page={nav.page}
        cartCount={cart.count}
        onNavigate={(page, cat, sub) => navigate(page, cat, sub)}
        onOpenAuth={openAuth}
      />

      <div style={{ flex: 1 }}>
        {nav.page === 'home' && (
          <Landing
            onNavigate={(page, cat) => navigate(page, cat)}
            onAdd={addToCart}
            onWish={toggleWish}
            wished={wish.has}
            onProduct={openProduct}
          />
        )}
        {nav.page === 'shop' && (
          <Shop
            initialCat={nav.cat}
            onProduct={openProduct}
            onAdd={addToCart}
            onWish={toggleWish}
            wished={wish.has}
          />
        )}
        {nav.page === 'product' && nav.product && (
          <ProductDetail
            product={nav.product}
            onAdd={addToCart}
            onWish={toggleWish}
            wished={wish.has}
            onNavigate={() => navigate('shop')}
            onProduct={openProduct}
          />
        )}
        {nav.page === 'cart' && (
          <Cart
            items={cart.items}
            total={cart.total}
            onRemove={cart.remove}
            onSetQty={cart.setQty}
            onNavigate={(page) => navigate(page)}
          />
        )}
        {nav.page === 'checkout' && (
          <Checkout
            items={cart.items}
            total={cart.total}
            onNavigate={(page) => navigate(page)}
            onClearCart={cart.clear}
          />
        )}
        {nav.page === 'profile' && (
          <ProfilePage
            onNavigate={(page) => navigate(page)}
            wishlist={wish.list}
            wishCount={wish.count}
            onProduct={openProduct}
            onAdd={addToCart}
            onWish={toggleWish}
            wished={wish.has}
          />
        )}
        {nav.page === 'admin' && (
          <Admin onNavigate={(page) => navigate(page)} />
        )}
        {STATIC_PAGES.includes(nav.page) && (
          <StaticPage page={nav.page} onNavigate={(page) => navigate(page)} />
        )}
      </div>

      <Footer onNavigate={(page) => navigate(page)} />
      <Toast toasts={toast.toasts} onDismiss={toast.dismiss} />

      <AuthModal
        open={authModal.open}
        initialTab={authModal.tab}
        onClose={() => setAuthModal(a => ({ ...a, open: false }))}
        onSuccess={() => {
          toast.push('Willkommen bei TOYS4JOYS!')
          navigate('profile')
        }}
      />

      {/* Age gate — hidden on legal pages so users can read T&C before confirming */}
      {!age.verified && !LEGAL_PAGES.includes(nav.page) && (
        <AgeGate onConfirm={age.confirm} onNavigate={navigate} />
      )}

      {/* Cookie consent — shown until accepted/declined */}
      {age.verified && cookie.shown && (
        <CookieBanner onAccept={cookie.accept} onDecline={cookie.decline} onNavigate={navigate} />
      )}
    </div>
  )
}

export default function App() {
  if (COMING_SOON) return <ComingSoon />
  return (
    <ErrorBoundary>
      <LocaleProvider>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </LocaleProvider>
    </ErrorBoundary>
  )
}
