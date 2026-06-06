import { useState, useEffect } from 'react'
import type { Product } from '@/types'
import { fetchProducts, fetchFeaturedProducts, fetchRelatedProducts, fetchSubcategories } from '@/lib/queries'
import { supabase } from '@/lib/supabase'

export interface Review {
  id:         string
  author:     string
  rating:     number
  body:       string
  created_at: string
}

interface State {
  products: Product[]
  loading: boolean
  error: string | null
}

// ── Module-level cache w/ TTL ──────────────────────────────────────────────
// Products change rarely, so we cache to avoid re-fetching on every Shop
// remount. Three things invalidate the cache:
//   1. The cache is older than CACHE_TTL_MS (default 30s)
//   2. Window regains focus (user came back from Admin or another tab)
//   3. Someone explicitly calls invalidateProductsCache() — Admin mutations do
const CACHE_TTL_MS = 30_000

interface Cache {
  products: Product[]
  fetchedAt: number
}

let _cache: Cache | null = null
const _subscribers = new Set<() => void>()

function isFresh(c: Cache | null): c is Cache {
  return !!c && Date.now() - c.fetchedAt < CACHE_TTL_MS
}

/**
 * Force every active useProducts() to refetch.
 * Call this from Admin code right after you mutate a product so customer
 * views update without a full-page reload.
 */
export function invalidateProductsCache() {
  _cache = null
  _subscribers.forEach(notify => notify())
}

// Refetch on tab/window refocus — user came back from Admin in another tab
// or alt-tabbed back to the browser. Single global listener — installed once.
let _focusInstalled = false
function installFocusListener() {
  if (_focusInstalled || typeof window === 'undefined') return
  _focusInstalled = true
  const onFocus = () => {
    if (!isFresh(_cache)) _subscribers.forEach(notify => notify())
  }
  window.addEventListener('focus', onFocus)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') onFocus()
  })
}

export function useProducts(): State {
  const [state, setState] = useState<State>(() => ({
    products: isFresh(_cache) ? _cache.products : [],
    loading:  !isFresh(_cache),
    error:    null,
  }))

  useEffect(() => {
    installFocusListener()
    let cancelled = false

    const load = async () => {
      // Serve from cache if fresh
      if (isFresh(_cache)) {
        setState({ products: _cache.products, loading: false, error: null })
        return
      }
      // Stale or absent — refetch
      setState(s => ({ ...s, loading: true }))
      try {
        const products = await fetchProducts()
        if (cancelled) return
        _cache = { products, fetchedAt: Date.now() }
        setState({ products, loading: false, error: null })
      } catch (e) {
        if (cancelled) return
        const msg = e instanceof Error ? e.message : 'Unknown error'
        setState({ products: [], loading: false, error: msg })
      }
    }

    // Subscribe to global invalidations
    _subscribers.add(load)
    load()

    return () => {
      cancelled = true
      _subscribers.delete(load)
    }
  }, [])

  return state
}

export function useFeaturedProducts(): State {
  const [state, setState] = useState<State>({ products: [], loading: true, error: null })

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const products = await fetchFeaturedProducts()
        if (!cancelled) setState({ products, loading: false, error: null })
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : 'Unknown error'
          setState({ products: [], loading: false, error: msg })
        }
      }
    }

    // Also subscribed to the products-cache invalidation: when an admin
    // hides a product or marks it featured, the homepage should reflect that.
    _subscribers.add(load)
    load()

    return () => {
      cancelled = true
      _subscribers.delete(load)
    }
  }, [])

  return state
}

export function useSubcategories(cat: string): { subs: string[]; loading: boolean } {
  const [subs, setSubs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!cat || cat === 'Alle') { setSubs([]); return }
    let cancelled = false
    setLoading(true)
    fetchSubcategories(cat)
      .then(s => { if (!cancelled) { setSubs(s); setLoading(false) } })
      .catch(() => { if (!cancelled) { setSubs([]); setLoading(false) } })
    return () => { cancelled = true }
  }, [cat])

  return { subs, loading }
}

export function useReviews(productId: string): { reviews: Review[]; loading: boolean } {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!productId) return
    let cancelled = false
    setLoading(true)
    supabase
      .from('reviews')
      .select('id, author, rating, body, created_at')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error) setReviews((data ?? []) as Review[])
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [productId])

  return { reviews, loading }
}

export function useRelatedProducts(cat: string, excludeId: string): State {
  const [state, setState] = useState<State>({ products: [], loading: true, error: null })

  useEffect(() => {
    if (!cat || !excludeId) return
    let cancelled = false
    fetchRelatedProducts(cat, excludeId)
      .then(products => { if (!cancelled) setState({ products, loading: false, error: null }) })
      .catch(e => {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : 'Unknown error'
          setState({ products: [], loading: false, error: msg })
        }
      })
    return () => { cancelled = true }
  }, [cat, excludeId])

  return state
}
