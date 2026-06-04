import React from 'react'
import { C } from '@/tokens'
import { useSubcategories } from '@/hooks/useProducts'

interface Props {
  cat: string
  onNavigate: (page: 'shop', cat?: string, sub?: string) => void
}

export default function MegaDrop({ cat, onNavigate }: Props) {
  const { subs, loading } = useSubcategories(cat)

  if (loading || subs.length === 0) return null

  // Split subs into columns of max 6
  const colSize = 6
  const columns: string[][] = []
  for (let i = 0; i < subs.length; i += colSize) {
    columns.push(subs.slice(i, i + colSize))
  }

  return (
    <div
      className="slide-down"
      style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        background: C.bgSurface,
        border: `1px solid ${C.border}`,
        borderTop: `1px solid ${C.borderMid}`,
        padding: '28px 32px',
        display: 'flex',
        gap: '40px',
        minWidth: '300px',
        zIndex: 200,
        boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
      }}
    >
      {columns.map((col, ci) => (
        <div key={ci} style={{ minWidth: '120px' }}>
          {col.map(item => (
            <div
              key={item}
              onClick={() => onNavigate('shop', cat, item)}
              style={{
                fontSize: '12px',
                fontWeight: 300,
                color: C.textMid,
                marginBottom: '8px',
                cursor: 'pointer',
                transition: 'color 0.12s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.color = C.text }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.color = C.textMid }}
            >
              {item}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
