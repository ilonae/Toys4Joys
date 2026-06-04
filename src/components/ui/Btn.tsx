import React from 'react'
import { C } from '@/tokens'

type Variant = 'primary' | 'ghost' | 'outline'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  small?: boolean
}

const styles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: C.accent,
    color: C.white,
    border: 'none',
  },
  ghost: {
    background: 'transparent',
    color: C.textMid,
    border: 'none',
  },
  outline: {
    background: 'transparent',
    color: C.accent,
    border: `1px solid ${C.accent}`,
  },
}

export default function Btn({ variant = 'primary', small = false, style, children, ...rest }: Props) {
  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: small ? '7px 16px' : '11px 24px',
        fontSize: small ? '10px' : '11px',
        fontWeight: 400,
        letterSpacing: '0.1em',
        cursor: 'pointer',
        transition: 'opacity 0.15s, background 0.15s',
        ...styles[variant],
        ...style,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.8' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
      {...rest}
    >
      {children}
    </button>
  )
}
