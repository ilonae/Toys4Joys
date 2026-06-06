/**
 * Tiny pub/sub for cache invalidation signals across hooks.
 *
 * Pattern:
 *   - When a piece of data mutates somewhere in the app (e.g. Admin
 *     updates a product), emit the corresponding event:
 *       emit('products')
 *   - Every hook that derives from that data subscribes to the event
 *     and refetches when fired:
 *       useEffect(() => subscribe('products', refetch), [refetch])
 *
 * Events are just string keys — no payload. Subscribers are responsible
 * for their own refetch logic.
 */

type EventName = 'products' | 'orders' | 'reviews' | 'wishlist' | 'auth'

const listeners: Record<EventName, Set<() => void>> = {
  products: new Set(),
  orders:   new Set(),
  reviews:  new Set(),
  wishlist: new Set(),
  auth:     new Set(),
}

/** Notify every listener of a given event. */
export function emit(event: EventName): void {
  // Snapshot before calling — a listener that adds/removes during dispatch
  // would otherwise mutate the set we're iterating
  for (const fn of Array.from(listeners[event])) {
    try { fn() } catch (e) { console.error(`[cacheBus] listener for "${event}" threw:`, e) }
  }
}

/** Register a listener. Returns an unsubscribe function. */
export function subscribe(event: EventName, fn: () => void): () => void {
  listeners[event].add(fn)
  return () => { listeners[event].delete(fn) }
}
