import React from 'react'
import { C } from '@/tokens'
import { useLocale, useLocalProduct } from '@/contexts/LocaleContext'
import type { CartItem } from '@/types'
import Icon from '@/components/ui/Icon'
import Btn from '@/components/ui/Btn'
import PhotoBox from '@/components/ui/PhotoBox'
import Tag from '@/components/ui/Tag'
import { FREE_THRESHOLD, SHIPPING_RATE } from '@/lib/shipping'

// Cart doesn't know the destination country yet → show German threshold
// as the baseline; full zone pricing is shown in Checkout once address is entered.
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
  const localProduct = useLocalProduct()
  const shipping = total >= CART_ZONE_THRESHOLD ? 0 : CART_ZONE_RATE
  const missing  = CART_ZONE_THRESHOLD - total
  const pct      = Math.min(100, (total / CART_ZONE_THRESHOLD) * 100)

  // ── Empty state ────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '70vh', gap: '28px',
        borderTop: `1px solid ${C.border}`,
      }}>
        <div style={{
          width: '64px', height: '64px', border: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="cart" size={24} color={C.textDim} />
        </div>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '13px', letterSpacing: '0.1em', color: C.text }}>
            {t.cart.empty}
          </div>
          <div style={{ fontSize: '12px', color: C.textDim }}>
            {t.cart.emptyHint}
          </div>
        </div>
        <Btn variant="outline" onClick={() => onNavigate('shop')}>{t.cart.continueShopping}</Btn>
      </div>
    )
  }

  const itemCount = items.reduce((s, i) => s + i.qty, 0)

  return (
    <div style={{ borderTop: `1px solid ${C.border}`, minHeight: '100vh' }}>

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div style={{
        padding: '48px 56px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Tag>{t.cart.title}</Tag>
          <h1 style={{ fontSize: 'clamp(26px, 3.5vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em', color: C.text, margin: 0 }}>
            {itemCount}
          </h1>
        </div>
        <button
          onClick={() => onNavigate('shop')}
          style={{
            background: 'none', border: 'none', color: C.textDim, cursor: 'pointer',
            fontSize: '11px', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          ← {t.cart.continueShopping}
        </button>
      </div>

      {/* ── Main layout: items + summary ─────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>

        {/* Items list */}
        <div style={{ flex: 1, borderRight: `1px solid ${C.border}` }}>
          {items.map(item => {
            const p = localProduct(item.product)
            return (
            <div
              key={item.product.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr auto',
                gap: '0',
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              {/* Product image */}
              <div style={{
                borderRight: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'stretch',
              }}>
                <PhotoBox
                  cat={item.product.cat}
                  image={item.product.image}
                  size={120}
                  style={{ width: '100%', height: '120px', border: 'none', borderRadius: 0 }}
                />
              </div>

              {/* Product info */}
              <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
                <div style={{ fontSize: '10px', letterSpacing: '0.12em', color: C.textDim, textTransform: 'uppercase' }}>
                  {item.product.brand}
                </div>
                <div style={{ fontSize: '14px', color: C.text, lineHeight: 1.3 }}>
                  {p.name}
                </div>
                <div style={{ fontSize: '11px', color: C.textDim, marginTop: '2px' }}>
                  {item.product.mat}{item.product.lvl !== 'All levels' ? ` · ${item.product.lvl}` : ''}
                </div>

                {/* Qty + Remove */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.border}` }}>
                    <button
                      onClick={() => item.qty > 1 ? onSetQty(item.product.id, item.qty - 1) : onRemove(item.product.id)}
                      style={{ background: 'none', border: 'none', color: C.textMid, cursor: 'pointer', padding: '7px 12px', lineHeight: 1 }}
                    >
                      <Icon name="minus" size={11} color={C.textMid} />
                    </button>
                    <span style={{ fontSize: '12px', color: C.text, minWidth: '28px', textAlign: 'center' }}>
                      {item.qty}
                    </span>
                    <button
                      onClick={() => onSetQty(item.product.id, item.qty + 1)}
                      style={{ background: 'none', border: 'none', color: C.textMid, cursor: 'pointer', padding: '7px 12px', lineHeight: 1 }}
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
                padding: '28px 32px',
                display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                justifyContent: 'center', gap: '4px',
                borderLeft: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: '16px', color: C.text, fontWeight: 400 }}>
                  €{(item.product.price * item.qty).toFixed(2)}
                </div>
                {item.qty > 1 && (
                  <div style={{ fontSize: '11px', color: C.textDim }}>
                    €{item.product.price.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
            )
          })}
        </div>

        {/* ── Order summary sidebar ────────────────────────────────────────── */}
        <div style={{ width: '340px', flexShrink: 0, position: 'sticky', top: '56px' }}>

          {/* Free shipping progress (Germany baseline) */}
          <div style={{ padding: '32px', borderBottom: `1px solid ${C.border}` }}>
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
            {/* Zone overview */}
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
          <div style={{ padding: '32px', borderBottom: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Btn
              style={{ width: '100%', padding: '15px', letterSpacing: '0.14em', fontSize: '11px' }}
              onClick={() => onNavigate('checkout')}
            >
              {t.cart.checkout}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  )
}
