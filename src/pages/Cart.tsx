import React from 'react'
import { C } from '@/tokens'
import { useLocale, useLocalProduct } from '@/contexts/LocaleContext'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { CartItem } from '@/types'
import Icon from '@/components/ui/Icon'
import Btn from '@/components/ui/Btn'
import PhotoBox from '@/components/ui/PhotoBox'
import Tag from '@/components/ui/Tag'
import { FREE_THRESHOLD, SHIPPING_RATE } from '@/lib/shipping'

const CART_ZONE_THRESHOLD = FREE_THRESHOLD.germany
const CART_ZONE_RATE      = SHIPPING_RATE.germany

interface Props {
  items: CartItem[]
  total: number
  onRemove: (id: string) => void
  onSetQty: (id: string, qty: number) => void
  onNavigate: (page: 'shop' | 'home' | 'checkout') => void
}

export default function Cart({ items, total, onRemove, onSetQty, onNavigate }: Props) {
  const { t } = useLocale()
  const isMobile = useIsMobile()
  const localProduct = useLocalProduct()
  const shipping = total >= CART_ZONE_THRESHOLD ? 0 : CART_ZONE_RATE
  const missing  = CART_ZONE_THRESHOLD - total
  const pct      = Math.min(100, (total / CART_ZONE_THRESHOLD) * 100)

  if (items.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '70vh', gap: '28px',
        borderTop: `1px solid ${C.border}`,
        padding: '32px 16px',
      }}>
        <div style={{
          width: '64px', height: '64px', border: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="cart" size={24} color={C.textDim} />
        </div>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '13px', letterSpacing: '0.1em', color: C.text }}>{t.cart.empty}</div>
          <div style={{ fontSize: '12px', color: C.textDim }}>{t.cart.emptyHint}</div>
        </div>
        <Btn variant="outline" onClick={() => onNavigate('shop')}>{t.cart.continueShopping}</Btn>
      </div>
    )
  }

  const itemCount = items.reduce((s, i) => s + i.qty, 0)

  // Order summary — shared between desktop sidebar and mobile bottom section
  const Summary = () => (
    <>
      {/* Free shipping progress */}
      <div style={{ padding: isMobile ? '20px 16px' : '32px', borderBottom: `1px solid ${C.border}` }}>
        {missing > 0 ? (
          <>
            <div style={{ fontSize: '11px', color: C.textMid, marginBottom: '14px', lineHeight: 1.6 }}>
              <span style={{ color: C.accent, fontWeight: 500 }}>€{missing.toFixed(2)}</span> {t.cart.toFreeShipping} ({t.cart.germany})
            </div>
            <div style={{ height: '2px', background: C.border, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: C.accent, width: `${pct}%`, transition: 'width 0.4s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '9px', color: C.textDim, letterSpacing: '0.08em' }}>€0</span>
              <span style={{ fontSize: '9px', color: C.textDim, letterSpacing: '0.08em' }}>€{CART_ZONE_THRESHOLD}</span>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: C.accent, letterSpacing: '0.08em' }}>
            <span>✓</span> {t.cart.freeShipping}
          </div>
        )}
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { label: t.cart.germany,       free: FREE_THRESHOLD.germany,       rate: SHIPPING_RATE.germany },
            { label: t.cart.europe,        free: FREE_THRESHOLD.europe,        rate: SHIPPING_RATE.europe },
            { label: t.cart.international, free: FREE_THRESHOLD.international, rate: SHIPPING_RATE.international },
          ].map(z => (
            <div key={z.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: C.textDim }}>
              <span>{z.label}</span>
              <span>≥ €{z.free} · €{z.rate.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div style={{ padding: isMobile ? '20px 16px' : '32px', borderBottom: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ fontSize: '10px', letterSpacing: '0.14em', color: C.textDim, marginBottom: '4px' }}>
          {t.checkout.orderSummary.toUpperCase()}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: C.textMid }}>
          <span>{t.cart.subtotal}</span>
          <span>€{total.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: C.textMid }}>
          <span>{t.cart.shipping} <span style={{ fontSize: '10px', color: C.textDim }}>({t.cart.germany})</span></span>
          <span style={{ color: shipping === 0 ? C.accent : C.textMid }}>
            {shipping === 0 ? '✓' : `€${shipping.toFixed(2)}`}
          </span>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: '16px', color: C.text,
          borderTop: `1px solid ${C.border}`, paddingTop: '16px',
        }}>
          <span>{t.cart.total}</span>
          <span style={{ fontWeight: 500 }}>€{(total + shipping).toFixed(2)}</span>
        </div>
        <div style={{ fontSize: '10px', color: C.textDim, letterSpacing: '0.04em' }}>
          {t.cart.tax} (€{((total + shipping) * 19 / 119).toFixed(2)})
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: isMobile ? '20px 16px' : '32px' }}>
        <Btn
          style={{ width: '100%', padding: '15px', letterSpacing: '0.14em', fontSize: '11px' }}
          onClick={() => onNavigate('checkout')}
        >
          {t.cart.checkout}
        </Btn>
      </div>
    </>
  )

  return (
    <div style={{ borderTop: `1px solid ${C.border}`, minHeight: '100vh' }}>
      {/* Page header */}
      <div style={{
        padding: isMobile ? '20px 16px' : '48px 56px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: isMobile ? 'center' : 'flex-end',
        justifyContent: 'space-between', gap: '12px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '4px' : '12px' }}>
          <Tag>{t.cart.title}</Tag>
          <h1 style={{ fontSize: isMobile ? '28px' : 'clamp(26px, 3.5vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em', color: C.text, margin: 0 }}>
            {itemCount}
          </h1>
        </div>
        <button
          onClick={() => onNavigate('shop')}
          style={{
            background: 'none', border: 'none', color: C.textDim, cursor: 'pointer',
            fontSize: '11px', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '6px',
            flexShrink: 0,
          }}
        >
          ← {t.cart.continueShopping}
        </button>
      </div>

      {/* Main layout — stacked on mobile */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-start' }}>

        {/* Items list */}
        <div style={{ flex: 1, borderRight: isMobile ? 'none' : `1px solid ${C.border}`, minWidth: 0 }}>
          {items.map(item => {
            const p = localProduct(item.product)
            return (
              <div
                key={item.product.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '80px 1fr auto' : '120px 1fr auto',
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                {/* Product image */}
                <div style={{ borderRight: `1px solid ${C.border}`, display: 'flex', alignItems: 'stretch' }}>
                  <PhotoBox
                    cat={item.product.cat}
                    image={item.product.image}
                    size={isMobile ? 80 : 120}
                    style={{ width: '100%', height: isMobile ? '80px' : '120px', border: 'none', borderRadius: 0 }}
                  />
                </div>

                {/* Product info */}
                <div style={{ padding: isMobile ? '14px 12px' : '28px 32px', display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
                  <div style={{ fontSize: '10px', letterSpacing: '0.12em', color: C.textDim, textTransform: 'uppercase' }}>
                    {item.product.brand}
                  </div>
                  <div style={{ fontSize: isMobile ? '13px' : '14px', color: C.text, lineHeight: 1.3 }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '11px', color: C.textDim, marginTop: '2px' }}>
                    {item.product.mat}{item.product.lvl !== 'All levels' ? ` · ${item.product.lvl}` : ''}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.border}` }}>
                      <button
                        onClick={() => item.qty > 1 ? onSetQty(item.product.id, item.qty - 1) : onRemove(item.product.id)}
                        style={{ background: 'none', border: 'none', color: C.textMid, cursor: 'pointer', padding: '6px 10px', lineHeight: 1 }}
                      >
                        <Icon name="minus" size={11} color={C.textMid} />
                      </button>
                      <span style={{ fontSize: '12px', color: C.text, minWidth: '24px', textAlign: 'center' }}>{item.qty}</span>
                      <button
                        onClick={() => onSetQty(item.product.id, item.qty + 1)}
                        style={{ background: 'none', border: 'none', color: C.textMid, cursor: 'pointer', padding: '6px 10px', lineHeight: 1 }}
                      >
                        <Icon name="plus" size={11} color={C.textMid} />
                      </button>
                    </div>
                    <button
                      onClick={() => onRemove(item.product.id)}
                      style={{
                        background: 'none', border: 'none', color: C.textDim, cursor: 'pointer',
                        fontSize: '10px', letterSpacing: '0.1em', padding: 0,
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = C.accent)}
                      onMouseLeave={e => (e.currentTarget.style.color = C.textDim)}
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div style={{
                  padding: isMobile ? '14px 10px' : '28px 32px',
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                  justifyContent: 'center', gap: '4px',
                  borderLeft: `1px solid ${C.border}`,
                }}>
                  <div style={{ fontSize: isMobile ? '14px' : '16px', color: C.text, fontWeight: 400 }}>
                    €{(item.product.price * item.qty).toFixed(2)}
                  </div>
                  {item.qty > 1 && (
                    <div style={{ fontSize: '11px', color: C.textDim }}>€{item.product.price.toFixed(2)}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Order summary */}
        <div style={{
          width: isMobile ? '100%' : '340px',
          flexShrink: 0,
          borderTop: isMobile ? `1px solid ${C.border}` : 'none',
          position: isMobile ? 'static' : 'sticky',
          top: isMobile ? 'auto' : '112px',
        }}>
          <Summary />
        </div>
      </div>
    </div>
  )
}
