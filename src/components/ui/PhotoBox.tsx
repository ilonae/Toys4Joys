import React from 'react'
import { C } from '@/tokens'
import type { Category } from '@/types'

// SVG path data per category — minimal, abstract
const PATHS: Record<string, string> = {
  'Latex & Fetischwear': 'M20 30 C20 20 35 15 50 15 C65 15 80 20 80 30 L80 70 C80 80 65 85 50 85 C35 85 20 80 20 70 Z M35 40 C35 35 45 32 50 32 C55 32 65 35 65 40',
  'BDSM & Kontrolle':    'M20 20 L80 20 L80 50 M50 20 L50 80 M20 65 C20 65 50 55 80 65 M30 80 L70 80',
  'Vibratoren & Elektro':'M50 15 C65 15 75 30 75 50 C75 70 65 85 50 85 C35 85 25 70 25 50 C25 30 35 15 50 15 M50 35 L50 65 M38 50 L62 50',
  'Dildos':              'M42 15 C38 15 33 20 33 28 L33 72 C33 80 38 85 50 85 C62 85 67 80 67 72 L67 28 C67 20 62 15 58 15 Z',
  'Anal':                'M50 20 C60 20 70 35 70 55 C70 72 60 82 50 82 C40 82 30 72 30 55 C30 35 40 20 50 20 M50 45 C53 45 56 48 56 52 C56 56 53 58 50 58',
}

interface Props {
  cat: Category | string
  image?: string
  size?: number
  style?: React.CSSProperties
}

export default function PhotoBox({ cat, image, size = 180, style }: Props) {
  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    background: C.bgCard,
    border: `1px solid ${C.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    ...style,
  }

  if (image) {
    return (
      <div style={containerStyle}>
        <img
          src={image}
          alt={cat}
          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8%', display: 'block', boxSizing: 'border-box' }}
        />
      </div>
    )
  }

  const d = PATHS[cat] ?? PATHS['BDSM & Kontrolle']
  return (
    <div style={containerStyle}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 100 100" fill="none"
        stroke={C.borderMid} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
      </svg>
    </div>
  )
}
