import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

describe('Cart', () => {
  it('shows empty-cart message when no items', () => {
    render(<Cart items={[]} total={0} onNavigate={noop} onSetQty={noop} onRemove={noop} />)
    expect(screen.getByText(/leer/i)).toBeInTheDocument()
  })

  it('renders product names', () => {
    const items = [
      mockItem(),
      mockItem({ product: { id: 'p-2', name: 'Zweites Produkt', brand: 'Brand', cat: 'Anal', sub: '', price: 19.99, old: null, badge: null, rating: 3, rev: 5, mat: 'ABS', lvl: 'Beginner', desc: '', stock: 0, images: [] } }),
    ]
    render(<Cart items={items} total={49.98} onNavigate={noop} onSetQty={noop} onRemove={noop} />)
    expect(screen.getByText('Testprodukt')).toBeInTheDocument()
    expect(screen.getByText('Zweites Produkt')).toBeInTheDocument()
  })

  it('shows free shipping when total ≥ 50', () => {
    const items = [mockItem({ product: { id: 'p-1', name: 'Artikel', brand: 'Brand', cat: 'Dildos', sub: '', price: 60, old: null, badge: null, rating: 4, rev: 1, mat: 'Silikon', lvl: 'Beginner', desc: '', stock: 0, images: [] } })]
    render(<Cart items={items} total={60} onNavigate={noop} onSetQty={noop} onRemove={noop} />)
    const matches = screen.getAllByText(/kostenlos/i)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('shows shipping cost when total < 50', () => {
    const items = [mockItem({ product: { id: 'p-1', name: 'Artikel', brand: 'Brand', cat: 'Dildos', sub: '', price: 30, old: null, badge: null, rating: 4, rev: 1, mat: 'Silikon', lvl: 'Beginner', desc: '', stock: 0, images: [] } })]
    render(<Cart items={items} total={30} onNavigate={noop} onSetQty={noop} onRemove={noop} />)
    expect(screen.getByText('€4.99')).toBeInTheDocument()
  })

  it('calls onNavigate("checkout") when checkout button is clicked', () => {
    const onNavigate = vi.fn()
    const items = [mockItem()]
    render(<Cart items={items} total={29.99} onNavigate={onNavigate} onSetQty={noop} onRemove={noop} />)
    fireEvent.click(screen.getByText(/kasse/i))
    expect(onNavigate).toHaveBeenCalledWith('checkout')
  })
})
