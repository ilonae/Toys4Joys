import { useState, useEffect } from 'react'
import type { Product } from '@/types'
import { fetchProducts, fetchFeaturedProducts, fetchRelatedProducts, fetchSubcategories } from '@/lib/queries'

interface State {
  products: Product[]
  loading: boolean
  error: string | null
}

// Module-level cache — survives navigation/remounts within the same session.
// Products rarely change; no need to re-fetch every time the Shop mounts.
let _cache: Product[] | null = null

export function useProducts(): State {
  const [state, setState] = useState<State>({
    products: _cache ?? [],
    loading:  _cache === null,
    error:    null,
  })

  useEffect(() => {
    if (_cache !== null) return // already fetched this session
    fetchProducts()
      .then(products => { _cache = products; setState({ products, loading: false, error: null }) })
      .catch(e => setState({ products: [], loading: false, error: e.message }))
  }, [])

  return state
}

export function useFeaturedProducts(): State {
  const [state, setState] = useState<State>({ products: [], loading: true, error: null })

  useEffect(() => {
    fetchFeaturedProducts()
      .then(products => setState({ products, loading: false, error: null }))
      .catch(e => setState({ products: [], loading: false, error: e.message }))
  }, [])

  return state
}

export function useSubcategories(cat: string): { subs: string[]; loading: boolean } {
  const [subs, setSubs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!cat || cat === 'Alle') { setSubs([]); return }
    setLoading(true)
    fetchSubcategories(cat)
      .then(s => { setSubs(s); setLoading(false) })
      .catch(() => { setSubs([]); setLoading(false) })
  }, [cat])

  return { subs, loading }
}

export function useRelatedProducts(cat: string, excludeId: string): State {
  const [state, setState] = useState<State>({ products: [], loading: true, error: null })

  useEffect(() => {
    if (!cat || !excludeId) return
    fetchRelatedProducts(cat, excludeId)
      .then(products => setState({ products, loading: false, error: null }))
      .catch(e => setState({ products: [], loading: false, error: e.message }))
  }, [cat, excludeId])

  return state
}
