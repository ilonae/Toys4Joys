import React from 'react'
import { C } from '@/tokens'

interface Props {
  children: React.ReactNode
  style?: React.CSSProperties
}

export default function Tag({ children, style }: Props) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '10px',
      fontWeight: 400,
      letterSpacing: '0.18em',
      color: C.accent,
      textTransform: 'uppercase',
      ...style,
    }}>
      <span style={{ display: 'inline-block', width: '24px', height: '1px', background: C.accent }} />
      {children}
    </span>
  )
}
