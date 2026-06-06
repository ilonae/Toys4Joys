import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { emit, subscribe } from '@/lib/cacheBus'
import { useFocusRefetch } from './useFocusRefetch'
import type { Order } from '@/types'

// ── Customer-facing: a user's own orders ──────────────────────────────────
// Refetches automatically when:
//   - the user changes
//   - the tab regains focus (e.g. user just completed a payment in another
//     tab and webhook flipped the order to 'paid')
//   - the 'orders' invalidation event is emitted
export function useOrders() {
  const { user } = useAuth()
  const [orders, setOrders]   = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!user) {
      setOrders([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setOrders((data as Order[]) ?? [])
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    refetch()
    return subscribe('orders', refetch)
  }, [refetch])

  useFocusRefetch(refetch, !!user)

  return { orders, loading, error, refetch }
}

// ── Admin: all orders ─────────────────────────────────────────────────────
// Same staleness story: admin opens dashboard → goes to another tab → new
// payment lands → admin tab is stale. Focus + bus + cache solve it.
export function useAllOrders() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders]   = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
    if (err) {
      console.error('[useAllOrders] fetch failed:', err.message)
      setError(err.message)
    } else {
      if (data?.length === 0) console.warn('[useAllOrders] 0 orders — check is_admin = true in profiles')
      setOrders((data as Order[]) ?? [])
    }
    setLoading(false)
  }, [])

  // Wait for auth to fully resolve before fetching — prevents race condition
  // where query fires before Supabase client has the session token attached.
  useEffect(() => {
    if (authLoading) return
    if (!user?.isAdmin) return
    refetch()
    return subscribe('orders', refetch)
  }, [authLoading, user?.id, refetch])

  useFocusRefetch(refetch, !!user?.isAdmin)

  const updateStatus = async (orderId: string, status: string, trackingNumber?: string): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return 'Nicht angemeldet'
    try {
      const res = await fetch('/api/update-order-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ orderId, status, trackingNumber }),
      })
      // Be defensive: a 500 from a function may not return JSON
      let json: any = null
      try { json = await res.json() } catch { /* ignore non-JSON bodies */ }
      if (!res.ok) {
        const detail = json?.error ?? json?.message ?? `HTTP ${res.status}`
        console.error('[updateStatus] failed:', res.status, detail)
        return `Aktualisierung fehlgeschlagen (${res.status}): ${detail}`
      }
      // Notify every order-derived hook (customer's own list, admin list)
      // so all open tabs reflect the status change.
      emit('orders')
      return null
    } catch (e) {
      console.error('[updateStatus] network error:', e)
      return 'Netzwerkfehler — siehe Browser-Konsole'
    }
  }

  return { orders, loading, error, updateStatus, refetch }
}
