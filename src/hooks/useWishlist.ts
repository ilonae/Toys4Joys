import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { mapProduct, PRODUCT_COLS } from '@/lib/queries'
import type { Product } from '@/types'

/**
 * Persistent wishlist hook.
 *
 *   - Guests: stored in browser localStorage under `t4j_wishlist`
 *     (snapshot of full Product objects, same as before).
 *   - Signed-in users: stored server-side in `public.wishlists`
 *     (rows of (user_id, product_id, created_at), product hydrated via join).
 *   - On login: any guest items in localStorage are merged into the user's
 *     server wishlist, then localStorage is cleared. So a guest can browse,
 *     wishlist things, and have those items follow them once they sign up.
 *   - All toggles are optimistic — UI updates immediately; if the DB write
 *     fails we revert and surface a console error.
 */

const KEY = 't4j_wishlist'

// ── localStorage shim (used for guests + as the merge source on login) ──
function loadLocal(): Map<string, Product> {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) ?? '[]') as Product[]
    return new Map(arr.map(p => [p.id, p]))
  } catch { return new Map() }
}

function persistLocal(map: Map<string, Product>) {
  try { localStorage.setItem(KEY, JSON.stringify(Array.from(map.values()))) } catch { /* */ }
}

function clearLocal() {
  try { localStorage.removeItem(KEY) } catch { /* */ }
}

// ── Server I/O ──────────────────────────────────────────────────────────
async function fetchServer(userId: string): Promise<Map<string, Product>> {
  const { data, error } = await supabase
    .from('wishlists')
    .select(`created_at, products!inner(${PRODUCT_COLS})`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[useWishlist] fetch failed:', error.message)
    return new Map()
  }
  const out = new Map<string, Product>()
  // Supabase types the embedded relation as an array even though it's a
  // many-to-one — handle both shapes defensively.
  type Row = { products: Record<string, unknown> | Record<string, unknown>[] }
  for (const row of (data ?? []) as unknown as Row[]) {
    const productRaw = Array.isArray(row.products) ? row.products[0] : row.products
    if (!productRaw) continue
    const product = mapProduct(productRaw)
    out.set(product.id, product)
  }
  return out
}

async function insertServer(userId: string, productId: string): Promise<boolean> {
  const { error } = await supabase
    .from('wishlists')
    .upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id,product_id', ignoreDuplicates: true })
  if (error) {
    console.error('[useWishlist] insert failed:', error.message)
    return false
  }
  return true
}

async function deleteServer(userId: string, productId: string): Promise<boolean> {
  const { error } = await supabase
    .from('wishlists')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)
  if (error) {
    console.error('[useWishlist] delete failed:', error.message)
    return false
  }
  return true
}

// ── Main hook ───────────────────────────────────────────────────────────
export function useWishlist() {
  const { user } = useAuth()
  // Initial state: localStorage so guests have something immediately
  const [items, setItems] = useState<Map<string, Product>>(() => loadLocal())
  // Track which user we last hydrated for, so we don't re-merge on every render
  const hydratedFor = useRef<string | null>(null)

  // On auth change, sync state with the right backend
  useEffect(() => {
    let cancelled = false

    async function sync() {
      if (!user) {
        // Logged out → reset memory to whatever's in localStorage
        // (preserves any guest wishlist accumulated before login)
        if (hydratedFor.current !== null) {
          hydratedFor.current = null
          setItems(loadLocal())
        }
        return
      }
      if (hydratedFor.current === user.id) return // already in sync

      // 1) Pull what's currently on the server
      const server = await fetchServer(user.id)
      if (cancelled) return

      // 2) Merge any guest items from localStorage into the server set
      const local = loadLocal()
      const toUpload: Product[] = []
      for (const [id, product] of local) {
        if (!server.has(id)) toUpload.push(product)
      }
      if (toUpload.length > 0) {
        const { error } = await supabase
          .from('wishlists')
          .upsert(
            toUpload.map(p => ({ user_id: user.id, product_id: p.id })),
            { onConflict: 'user_id,product_id', ignoreDuplicates: true }
          )
        if (error) {
          console.error('[useWishlist] merge upload failed:', error.message)
        } else {
          // Optimistically add them to the in-memory set so the UI reflects
          // the merge without waiting for a refetch.
          for (const p of toUpload) server.set(p.id, p)
        }
      }

      // 3) Clear localStorage now that everything lives on the server
      clearLocal()

      if (cancelled) return
      hydratedFor.current = user.id
      setItems(server)
    }

    sync()
    return () => { cancelled = true }
  }, [user?.id])

  const toggle = useCallback((product: Product) => {
    // Optimistic UI update + rollback on failure
    let hadIt = false
    setItems(prev => {
      const next = new Map(prev)
      if (next.has(product.id)) {
        next.delete(product.id)
        hadIt = true
      } else {
        next.set(product.id, product)
      }
      // For guests we still write to localStorage so the wishlist survives
      // a refresh; for signed-in users localStorage is intentionally empty
      // (cleared after the server merge).
      if (!user) persistLocal(next)
      return next
    })

    if (!user) return

    // Fire-and-forget server write; rollback the optimistic change on error
    const op = hadIt ? deleteServer(user.id, product.id) : insertServer(user.id, product.id)
    op.then(ok => {
      if (ok) return
      setItems(prev => {
        const next = new Map(prev)
        if (hadIt) next.set(product.id, product)
        else        next.delete(product.id)
        return next
      })
    })
  }, [user?.id])

  const has  = useCallback((id: string) => items.has(id), [items])
  const list = Array.from(items.values())

  return { toggle, has, count: items.size, list }
}
