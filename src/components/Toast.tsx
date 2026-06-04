import React from 'react'
import { C } from '@/tokens'
import type { Toast as ToastType } from '@/hooks/useToast'

interface Props {
  toasts: ToastType[]
  onDismiss: (id: number) => void
}

export default function Toast({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null
  return (
    <div style={{
      position: 'fixed',
      bottom: '28px',
      right: '28px',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          className="fade-in"
          onClick={() => onDismiss(t.id)}
          style={{
            background: C.bgSurface,
            border: `1px solid ${C.borderMid}`,
            color: C.text,
            fontSize: '12px',
            fontWeight: 300,
            letterSpacing: '0.05em',
            padding: '12px 20px',
            cursor: 'pointer',
            borderLeft: `2px solid ${C.accent}`,
            minWidth: '220px',
          }}
        >
          {t.msg}
        </div>
      ))}
    </div>
  )
}
