import React from 'react'
import type { BadgeType } from '@/types'
import { C } from '@/tokens'

const MAP: Record<NonNullable<BadgeType>, { label: string; bg: string; color: string }> = {
  sale:       { label: 'SALE',       bg: C.accent,   color: C.white },
  bestseller: { label: 'BESTSELLER', bg: '#1a1025',  color: C.accent },
  new:        { label: 'NEU',        bg: C.bgSurface, color: C.textMid },
  expert:     { label: 'EXPERT',     bg: '#0a0010',  color: '#ff6644' },
}

interface Props {
  type: BadgeType
}

export default function Badge({ type }: Props) {
  if (!type) return null
  const { label, bg, color } = MAP[type]
  return (
    <span style={{
      display: 'inline-block',
      background: bg,
      color,
      fontSize: '9px',
      fontWeight: 500,
      letterSpacing: '0.12em',
      padding: '3px 7px',
      border: type === 'bestseller' ? `1px solid ${C.accent}` : 'none',
    }}>
      {label}
    </span>
  )
}
