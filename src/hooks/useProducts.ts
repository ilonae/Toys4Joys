import { useCallback, useEffect, useState } from 'react'
import type { Product } from '@/types'
import { fetchProducts, fetchFeaturedProducts, fetchRelatedProducts, fetchSubcategories } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import { emit, subscribe } from '@/lib/cacheBus'
import { useFocusRefetch } from './useFocusRefetch'

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
// Products change rarely. We cache the full list so navigating Home ↔ Shop
// ↔ ProductDetail doesn't refetch on every mount.
//
// Three things bust the cache:
//   1. The cache is older than CACHE_TTL_MS
//   2. The 'products' invalidation event fires (Admin emitted it after a
//      save / delete / visibility toggle)
//   3. Window focus / visibilitychange (user came back from Admin or
//      another tab) — handled per-hook via useFocusRefetch.
const CACHE_TTL_MS = 30_000

interface Cache { products: Product[]; fetchedAt: number }
let _cache: Cache | null = null

function isFresh(c: Cache | null): c is Cache {
  return !!c && Date.now() - c.fetchedAt < CACHE_TTL_MS
}

/**
 * Force every product-derived hook (useProducts, useFeaturedProducts,
 * useRelatedProducts, useSubcategories) to refetch. Call from Admin
 * code after a mutation.
 */
export function invalidateProductsCache() {
  _cache = null
  emit('products')
}

// ── useProducts ────────────────────────────────────────────────────────────
export function useProducts(): State {
  const [state, setState] = useState<State>(() => ({
    products: isFresh(_cache) ? _cache.products : [],
    loading:  !isFresh(_cache),
    error:    null,
  }))

  const refetch = useCallback(async () => {
    setState(s => ({ ...s, loading: true }))
    try {
      const products = await fetchProducts()
      _cache = { products, fetchedAt: Date.now() }
      setState({ products, loading: false, error: null })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setState({ products: [], loading: false, error: msg })
    }
  }, [])

  useEffect(() => {
    if (!isFresh(_cache)) refetch()
    return subscribe('products', refetch)
  }, [refetch])

  useFocusRefetch(() => { if (!isFresh(_cache)) refetch() })

  return state
}

// ── useFeaturedProducts ────────────────────────────────────────────────────
export function useFeaturedProducts(): State {
  const [state, setState] = useState<State>({ products: [], loading: true, error: null })

  const refetch = useCallback(async () => {
    try {
      const products = await fetchFeaturedProducts()
      setState({ products, loading: false, error: null })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setState({ products: [], loading: false, error: msg })
    }
  }, [])

  useEffect(() => {
    refetch()
    return subscribe('products', refetch)
  }, [refetch])

  useFocusRefetch(refetch)

  return state
}

// ── useSubcategories ───────────────────────────────────────────────────────
export function useSubcategories(cat: string): { subs: string[]; loading: boolean } {
  const [subs, setSubs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const refetch = useCallback(async () => {
    if (!cat || cat === 'Alle') { setSubs([]); return }
    setLoading(true)
    try {
      const s = await fetchSubcategories(cat)
      setSubs(s)
    } catch {
      setSubs([])
    } finally {
      setLoading(false)
    }
  }, [cat])

  useEffect(() => {
    refetch()
    return subscribe('products', refetch)
  }, [refetch])

  return { subs, loading }
}

// ── useReviews ─────────────────────────────────────────────────────────────
export function useReviews(productId: string): { reviews: Review[]; loading: boolean; refetch: () => void } {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!productId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('reviews')
      .select('id, author, rating, body, created_at')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
    if (!error) setReviews((data ?? []) as Review[])
    setLoading(false)
  }, [productId])

  useEffect(() => {
    refetch()
    return subscribe('reviews', refetch)
  }, [refetch])

  useFocusRefetch(refetch)

  return { reviews, loading, refetch }
}

// ── useRelatedProducts ─────────────────────────────────────────────────────
export function useRelatedProducts(cat: string, excludeId: string): State {
  const [state, setState] = useState<State>({ products: [], loading: true, error: null })

  const refetch = useCallback(async () => {
    if (!cat || !excludeId) return
    try {
      const products = await fetchRelatedProducts(cat, excludeId)
      setState({ products, loading: false, error: null })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setState({ products: [], loading: false, error: msg })
    }
  }, [cat, excludeId])

  useEffect(() => {
    refetch()
    return subscribe('products', refetch)
  }, [refetch])

  return state
}
