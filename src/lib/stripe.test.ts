import { describe, it, expect } from 'vitest'

// Pure shipping-logic tests — no external dependencies needed
describe('shipping calculation', () => {
  const shippingFor = (subtotal: number) => subtotal >= 50 ? 0 : 4.99
  const grandTotal  = (subtotal: number) => subtotal + shippingFor(subtotal)

  it('charges €4.99 shipping under €50', () => {
    expect(shippingFor(0)).toBe(4.99)
    expect(shippingFor(49.99)).toBe(4.99)
    expect(shippingFor(25)).toBe(4.99)
  })

  it('gives free shipping at exactly €50', () => {
    expect(shippingFor(50)).toBe(0)
  })

  it('gives free shipping above €50', () => {
    expect(shippingFor(50.01)).toBe(0)
    expect(shippingFor(200)).toBe(0)
  })

  it('grandTotal adds shipping to subtotal', () => {
    expect(grandTotal(30)).toBeCloseTo(34.99)
    expect(grandTotal(60)).toBe(60)
  })
})

describe('Stripe amount conversion', () => {
  const toStripeAmount = (euros: number) => Math.round(euros * 100)

  it('converts euros to cents', () => {
    expect(toStripeAmount(54.99)).toBe(5499)
    expect(toStripeAmount(50)).toBe(5000)
    expect(toStripeAmount(9.99)).toBe(999)
  })

  it('rounds correctly for floating-point amounts', () => {
    expect(toStripeAmount(10.005)).toBe(1001)
  })
})
