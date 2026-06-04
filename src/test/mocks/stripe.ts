// Reusable Stripe mock — import in test files that touch Stripe
import { vi } from 'vitest'

export const mockStripe = {
  confirmPayment: vi.fn().mockResolvedValue({ error: null }),
  elements: null,
}

export const mockElements = {
  submit: vi.fn().mockResolvedValue({ error: null }),
  getElement: vi.fn().mockReturnValue(null),
}

// Auto-mock the entire @stripe/react-stripe-js module
vi.mock('@stripe/react-stripe-js', async () => {
  const actual = await vi.importActual('@stripe/react-stripe-js')
  return {
    ...actual,
    useStripe: () => mockStripe,
    useElements: () => mockElements,
    Elements: ({ children }: { children: React.ReactNode }) => children,
    PaymentElement: () => null,
  }
})
