import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Btn from './Btn'

describe('Btn', () => {
  it('renders children', () => {
    render(<Btn>Kaufen</Btn>)
    expect(screen.getByText('Kaufen')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<Btn onClick={onClick}>Klick mich</Btn>)
    fireEvent.click(screen.getByText('Klick mich'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is set', () => {
    render(<Btn disabled>Gesperrt</Btn>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('does not fire onClick when disabled', () => {
    const onClick = vi.fn()
    render(<Btn disabled onClick={onClick}>Gesperrt</Btn>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('renders outline variant', () => {
    render(<Btn variant="outline">Outline</Btn>)
    const btn = screen.getByRole('button')
    expect(btn).toBeInTheDocument()
    // outline variant has transparent background
    expect(btn.style.background).toBe('transparent')
  })

  it('applies small padding when small prop is set', () => {
    render(<Btn small>Klein</Btn>)
    const btn = screen.getByRole('button')
    expect(btn.style.padding).toBe('7px 16px')
  })
})
