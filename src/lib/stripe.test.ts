import { describe, it, expect } from 'vitest'
import { calcShipping } from '@/lib/shipping'

describe('shipping calculation — Germany', () => {
  it('charges €4.99 under €49', () => {
    expect(calcShipping(0,     'Deutschland')).toBe(4.99)
    expect(calcShipping(48.99, 'Deutschland')).toBe(4.99)
    expect(calcShipping(25,    'Deutschland')).toBe(4.99)
  })

  it('gives free shipping at exactly €49', () => {
    expect(calcShipping(49, 'Deutschland')).toBe(0)
  })

  it('gives free shipping above €49', () => {
    expect(calcShipping(49.01, 'Deutschland')).toBe(0)
    expect(calcShipping(200,   'Deutschland')).toBe(0)
  })
})

describe('shipping calculation — Europe', () => {
  it('charges €8.99 under €100', () => {
    expect(calcShipping(50,  'Frankreich')).toBe(8.99)
    expect(calcShipping(99,  'Österreich')).toBe(8.99)
  })

  it('gives free shipping at €100+', () => {
    expect(calcShipping(100, 'Frankreich')).toBe(0)
    expect(calcShipping(150, 'Niederlande')).toBe(0)
  })
})

describe('shipping calculation — International', () => {
  it('charges €19.99 under €149', () => {
    expect(calcShipping(100, 'Japan')).toBe(19.99)
    expect(calcShipping(148, 'USA')).toBe(19.99)
  })

  it('gives free shipping at €149+', () => {
    expect(calcShipping(149, 'Japan')).toBe(0)
    expect(calcShipping(200, 'USA')).toBe(0)
  })
})

describe('Stripe amount conversion', () => {
  const toStripeAmount = (euros: number) => Math.round(euros * 100)

  it('converts euros to cents', () => {
    expect(toStripeAmount(54.99)).toBe(5499)
    expect(toStripeAmount(49)).toBe(4900)
    expect(toStripeAmount(9.99)).toBe(999)
  })

  it('rounds correctly for floating-point amounts', () => {
    expect(toStripeAmount(10.005)).toBe(1001)
  })
})
