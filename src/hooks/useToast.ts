import { useState, useCallback } from 'react'

export interface Toast {
  id: number
  msg: string
}

let _id = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((msg: string) => {
    const id = ++_id
    setToasts(prev => [...prev, { id, msg }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 2200)
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, push, dismiss }
}
