/**
 * Smoke tests for every top-level page.
 *
 * Goal: catch "useX() must be used inside Provider" crashes (and similar)
 * without writing full functional assertions. Each test just renders the
 * page with required providers; pass = no exception during render.
 *
 * Mocks:
 *   - @/lib/supabase: shimmed via src/test/mocks/supabase (vi.mock is
 *     hoisted, so importing the mock helper here mocks it for everything
 *     this file imports).
 *   - @/lib/stripe:  shimmed via src/test/mocks/stripe.
 *
 * If a smoke test fails, the page render-crashed — fix the provider tree
 * (or the page) before shipping.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// IMPORTANT: must come before any page import, so the supabase client used
// by useProducts/useOrders/queries.ts is the mock, not the real one.
import './mocks/supabase'
import './mocks/stripe'

// Avoid Sanity/Stripe + IO during smoke tests
vi.mock('@/lib/stripe', () => ({
  API_BASE: '',
  stripePromise: Promise.resolve(null),
}))

import { LocaleProvider } from '@/contexts/LocaleContext'
import { AuthProvider }   from '@/contexts/AuthContext'

import Landing       from '@/pages/Landing'
import Shop          from '@/pages/Shop'
import ProductDetail from '@/pages/ProductDetail'
import Cart          from '@/pages/Cart'
import Checkout      from '@/pages/Checkout'
import ProfilePage   from '@/pages/ProfilePage'
import StaticPage    from '@/pages/StaticPage'
import ComingSoon    from '@/pages/ComingSoon'
import type { Product } from '@/types'

const Providers = ({ children }: { children: React.ReactNode }) => (
  <LocaleProvider>
    <AuthProvider>{children}</AuthProvider>
  </LocaleProvider>
)

const renderPage = (ui: React.ReactElement) => render(<Providers>{ui}</Providers>)

const noop = () => {}
const noopP: () => Product | undefined = () => undefined
const noopWish = (_id: string) => false

const sampleProduct: Product = {
  id: 'sample-1',
  name: 'Sample Product',
  brand: 'Brand',
  cat: 'Dildos',
  sub: '',
  price: 49.99,
  old: null,
  badge: null,
  rating: 4,
  rev: 12,
  mat: 'Silikon',
  lvl: 'Beginner',
  desc: 'Description',
  stock: 5,
  images: [],
}

describe('Page smoke tests', () => {
  it('Landing renders without crashing', () => {
    renderPage(
      <Landing
        onNavigate={noop}
        onAdd={noop}
        onWish={noop}
        wished={noopWish}
        onProduct={noop}
      />
    )
  })

  it('Shop renders without crashing', () => {
    renderPage(
      <Shop
        onProduct={noop}
        onAdd={noop}
        onWish={noop}
        wished={noopWish}
      />
    )
  })

  it('ProductDetail renders without crashing', () => {
    renderPage(
      <ProductDetail
        product={sampleProduct}
        onAdd={noop}
        onWish={noop}
        wished={noopWish}
        onNavigate={noop}
        onProduct={noop}
      />
    )
  })

  it('Cart (empty) renders without crashing', () => {
    renderPage(
      <Cart items={[]} total={0} onNavigate={noop} onSetQty={noop} onRemove={noop} />
    )
  })

  it('Checkout renders without crashing', () => {
    renderPage(
      <Checkout
        items={[{ product: sampleProduct, qty: 1 }]}
        total={49.99}
        onNavigate={noop}
        onClearCart={noop}
      />
    )
    // Without user → checkout shows the address step (German). Don't assert
    // specific copy; just ensuring the render didn't throw is the smoke.
  })

  it('ProfilePage renders without crashing (logged out)', () => {
    // No user → page should fall back to a "not signed in" CTA.
    renderPage(
      <ProfilePage
        onNavigate={noop}
        wishlist={[]}
        wishCount={0}
        onProduct={noop}
        onAdd={noop}
        onWish={noop}
        wished={noopWish}
      />
    )
  })

  for (const page of ['about', 'shipping', 'privacy', 'terms', 'imprint', 'withdrawal'] as const) {
    it(`StaticPage "${page}" renders without crashing`, () => {
      renderPage(<StaticPage page={page} onNavigate={noop} />)
    })
  }

  it('ComingSoon renders without crashing', () => {
    // ComingSoon doesn't need any context, but render through Providers
    // anyway since that mirrors how App.tsx mounts it. Multiple "Berlin"
    // matches exist (date tag + tagline) so use queryAllByText, not query.
    renderPage(<ComingSoon />)
    expect(screen.queryAllByText(/Berlin/i).length).toBeGreaterThan(0)
  })
})
