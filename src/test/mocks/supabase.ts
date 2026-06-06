// Reusable Supabase mock — import in test files that touch Supabase.
//
// The query builder is BOTH chainable AND thenable, so the same mock works
// whether the caller terminates a chain with .single(), .limit(), .order(),
// or any other selector that's awaited. Default resolved value is empty:
//   { data: [], error: null }
import { vi } from 'vitest'

function makeQueryBuilder(initialResult: { data: unknown; error: unknown } = { data: [], error: null }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {}

  // Chainable PostgREST-style methods. Each returns the builder so the next
  // call can chain. The mock's `then` resolves to `initialResult`, so any
  // chain that's awaited resolves to empty data + no error.
  for (const method of [
    'select', 'insert', 'update', 'upsert', 'delete',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in',
    'order', 'limit', 'range', 'match', 'or', 'and', 'not',
    'contains', 'containedBy', 'rangeGt', 'rangeLt',
  ]) {
    builder[method] = vi.fn(() => builder)
  }

  // Terminal methods that resolve directly
  builder.single        = vi.fn().mockResolvedValue({ ...initialResult, data: null })
  builder.maybeSingle   = vi.fn().mockResolvedValue({ ...initialResult, data: null })
  builder.csv           = vi.fn().mockResolvedValue({ ...initialResult, data: '' })

  // Make the builder itself thenable — supports `await supabase.from(...).select(...).eq(...).order(...)`
  builder.then = (onFulfilled: (value: { data: unknown; error: unknown }) => unknown) =>
    Promise.resolve(initialResult).then(onFulfilled)

  return builder
}

export const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signUp:             vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signOut:            vi.fn().mockResolvedValue({ error: null }),
    getSession:         vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser:            vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    onAuthStateChange:  vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    updateUser:         vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
  from: vi.fn(() => makeQueryBuilder()),
  storage: {
    from: vi.fn().mockReturnValue({
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
      upload:       vi.fn().mockResolvedValue({ data: { path: '' }, error: null }),
      download:     vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}))
