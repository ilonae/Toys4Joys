import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Order } from '@/types'

export function useOrders() {
  const { user } = useAuth()
  const [orders, setOrders]   = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setOrders([])
      setLoading(false)
      return
    }

    setLoading(true)
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(err.message)
        else setOrders((data as Order[]) ?? [])
        setLoading(false)
      })
  }, [user?.id])

  return { orders, loading, error }
}

// Admin version — fetches ALL orders (requires is_admin = true in profiles)
export function useAllOrders() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders]   = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) {
          console.error('[useAllOrders] fetch failed:', err.message)
          setError(err.message)
        } else {
          if (data?.length === 0) console.warn('[useAllOrders] 0 orders — check is_admin = true in profiles')
          setOrders((data as Order[]) ?? [])
        }
        setLoading(false)
      })
  }, [])

  // Wait for auth to fully resolve before fetching — prevents race condition
  // where query fires before Supabase client has the session token attached.
  useEffect(() => {
    if (authLoading) return
    if (!user?.isAdmin) return
    refetch()
  }, [authLoading, user?.id, refetch])

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
      refetch()
      return null
    } catch (e) {
      console.error('[updateStatus] network error:', e)
      return 'Netzwerkfehler — siehe Browser-Konsole'
    }
  }

  return { orders, loading, error, updateStatus, refetch }
}
