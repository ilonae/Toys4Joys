import React from 'react'

interface Props {
  name: 'cart' | 'heart' | 'heart-filled' | 'search' | 'close' | 'chevron-down' | 'minus' | 'plus' | 'arrow-right' | 'user' | 'user-check'
  size?: number
  color?: string
  style?: React.CSSProperties
}

const ICONS: Record<string, string> = {
  cart:          'M6 2 L3 6 L21 6 L19 16 L5 16 L3 6 M9 21 A1 1 0 1 0 11 21 A1 1 0 1 0 9 21 M16 21 A1 1 0 1 0 18 21 A1 1 0 1 0 16 21',
  heart:         'M12 21 C12 21 3 13.5 3 8 C3 5.2 5.2 3 8 3 C9.9 3 11.6 4 12 5.5 C12.4 4 14.1 3 16 3 C18.8 3 21 5.2 21 8 C21 13.5 12 21 12 21',
  'heart-filled':'M12 21 C12 21 3 13.5 3 8 C3 5.2 5.2 3 8 3 C9.9 3 11.6 4 12 5.5 C12.4 4 14.1 3 16 3 C18.8 3 21 5.2 21 8 C21 13.5 12 21 12 21',
  search:        'M11 19 A8 8 0 1 0 11 3 A8 8 0 1 0 11 19 M21 21 L16.65 16.65',
  close:         'M18 6 L6 18 M6 6 L18 18',
  'chevron-down':'M6 9 L12 15 L18 9',
  minus:         'M5 12 L19 12',
  plus:          'M12 5 L12 19 M5 12 L19 12',
  'arrow-right': 'M5 12 L19 12 M13 6 L19 12 L13 18',
  'user':        'M12 12 A4 4 0 1 0 12 4 A4 4 0 1 0 12 12 M4 20 C4 17 7.6 14.5 12 14.5 C16.4 14.5 20 17 20 20',
  'user-check':  'M12 12 A4 4 0 1 0 12 4 A4 4 0 1 0 12 12 M4 20 C4 17 7.6 14.5 12 14.5 C16.4 14.5 20 17 20 20 M16 4 L17.5 5.5 L21 2',
}

export default function Icon({ name, size = 20, color = 'currentColor', style }: Props) {
  const d = ICONS[name]
  const filled = name === 'heart-filled'
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}
      stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0, ...style }}
    >
      <path d={d} />
    </svg>
  )
}
