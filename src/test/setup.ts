import '@testing-library/jest-dom'

// Silence console.error in tests unless explicitly needed
const originalError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = args[0]?.toString() ?? ''
    // Allow React + Testing Library warnings to surface, suppress noise
    if (msg.includes('Warning: ReactDOM.render')) return
    originalError(...args)
  }
})
afterAll(() => {
  console.error = originalError
})
