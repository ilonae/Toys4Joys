import { useEffect, useRef } from 'react'

/**
 * Call `refetch` whenever the tab/window regains focus, with a small
 * cooldown so a quick blur-focus storm doesn't spam the network.
 *
 * Typical use — keep a hook's data fresh when the user alt-tabs back
 * from another tab where they made a change:
 *
 *   useFocusRefetch(refetch)
 *
 * Pass `enabled = false` to temporarily disable (e.g. while a mutation
 * is in flight).
 */
export function useFocusRefetch(
  refetch: () => void,
  enabled = true,
  cooldownMs = 1500,
): void {
  const lastFiredRef = useRef(0)
  // Latest closure of refetch — avoids stale captures without adding
  // refetch to the effect deps (which would re-attach the listener every render)
  const refetchRef = useRef(refetch)
  useEffect(() => { refetchRef.current = refetch })

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    const onFocus = () => {
      const now = Date.now()
      if (now - lastFiredRef.current < cooldownMs) return
      lastFiredRef.current = now
      refetchRef.current()
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') onFocus()
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [enabled, cooldownMs])
}
