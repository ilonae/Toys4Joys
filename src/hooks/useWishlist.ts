import { useState, useCallback } from 'react'
import type { Product } from '@/types'

const KEY = 't4j_wishlist'

function load(): Map<string, Product> {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) ?? '[]') as Product[]
    return new Map(arr.map(p => [p.id, p]))
  } catch { return new Map() }
}

function persist(map: Map<string, Product>) {
  localStorage.setItem(KEY, JSON.stringify(Array.from(map.values())))
}

export function useWishlist() {
  const [items, setItems] = useState<Map<string, Product>>(() => load())

  const toggle = useCallback((product: Product) => {
    setItems(prev => {
      const next = new Map(prev)
      if (next.has(product.id)) next.delete(product.id)
      else next.set(product.id, product)
      persist(next)
      return next
    })
  }, [])

  const has  = useCallback((id: string) => items.has(id), [items])
  const list = Array.from(items.values())

  return { toggle, has, count: items.size, list }
}
