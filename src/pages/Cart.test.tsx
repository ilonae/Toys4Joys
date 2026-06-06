import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LocaleProvider } from '@/contexts/LocaleContext'
import Cart from './Cart'
import type { CartItem } from '@/types'

const mockItem = (overrides?: Partial<CartItem>): CartItem => ({
  qty: 1,
  product: {
    id: 'p-1',
    name: 'Testprodukt',
    brand: 'TestBrand',
    cat: 'Dildos',
    sub: '',
    price: 29.99,
    old: null,
    badge: null,
    rating: 4,
    rev: 10,
    mat: 'Silikon',
    lvl: 'Beginner',
    desc: 'Beschreibung',
    stock: 0,
    images: [],
    ...overrides?.product,
  },
  ...overrides,
})

const noop = () => {}

// Cart calls useLocale() / useLocalProduct(), both of which require the
// LocaleProvider to be mounted. Wrap every render so the context is there.
// Default locale is 'de', which matches the German strings asserted below.
const renderCart = (ui: React.ReactElement) =>
  render(<LocaleProvider>{ui}</LocaleProvider>)

describe('Cart', () => {
  it('shows empty-cart message when no items', () => {
    renderCart(<Cart items={[]} total={0} onNavigate={noop} onSetQty={noop} onRemove={noop} />)
    expect(screen.getByText(/leer/i)).toBeInTheDocument()
  })

  it('renders product names', () => {
    const items = [
      mockItem(),
      mockItem({ product: { id: 'p-2', name: 'Zweites Produkt', brand: 'Brand', cat: 'Anal', sub: '', price: 19.99, old: null, badge: null, rating: 3, rev: 5, mat: 'ABS', lvl: 'Beginner', desc: '', stock: 0, images: [] } }),
    ]
    renderCart(<Cart items={items} total={49.98} onNavigate={noop} onSetQty={noop} onRemove={noop} />)
    expect(screen.getByText('Testprodukt')).toBeInTheDocument()
    expect(screen.getByText('Zweites Produkt')).toBeInTheDocument()
  })

  it('shows free shipping when total ≥ 49', () => {
    const items = [mockItem({ product: { id: 'p-1', name: 'Artikel', brand: 'Brand', cat: 'Dildos', sub: '', price: 60, old: null, badge: null, rating: 4, rev: 1, mat: 'Silikon', lvl: 'Beginner', desc: '', stock: 0, images: [] } })]
    renderCart(<Cart items={items} total={60} onNavigate={noop} onSetQty={noop} onRemove={noop} />)
    // Empty-state copy says "Dein Warenkorb ist leer" — but with items, the
    // free-shipping banner reads "KOSTENLOSER VERSAND INKLUSIVE".
    const matches = screen.getAllByText(/kostenlos/i)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('shows shipping cost when total < 49', () => {
    const items = [mockItem({ product: { id: 'p-1', name: 'Artikel', brand: 'Brand', cat: 'Dildos', sub: '', price: 30, old: null, badge: null, rating: 4, rev: 1, mat: 'Silikon', lvl: 'Beginner', desc: '', stock: 0, images: [] } })]
    renderCart(<Cart items={items} total={30} onNavigate={noop} onSetQty={noop} onRemove={noop} />)
    expect(screen.getByText('€4.99')).toBeInTheDocument()
  })

  it('calls onNavigate("checkout") when checkout button is clicked', () => {
    const onNavigate = vi.fn()
    const items = [mockItem()]
    renderCart(<Cart items={items} total={29.99} onNavigate={onNavigate} onSetQty={noop} onRemove={noop} />)
    // German "ZUR KASSE" — the regex matches "kasse" case-insensitively
    fireEvent.click(screen.getByText(/kasse/i))
    expect(onNavigate).toHaveBeenCalledWith('checkout')
  })
})
