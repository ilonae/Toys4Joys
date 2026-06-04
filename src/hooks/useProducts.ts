import { useState, useEffect } from 'react'
import type { Product } from '@/types'
import { fetchProducts, fetchFeaturedProducts, fetchRelatedProducts, fetchSubcategories } from '@/lib/queries'

interface State {
  products: Product[]
  loading: boolean
  error: string | null
}

export function useProducts(): State {
  const [state, setState] = useState<State>({ products: [], loading: true, error: null })

  useEffect(() => {
    fetchProducts()
      .then(products => setState({ products, loading: false, error: null }))
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
