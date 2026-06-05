import React from 'react'
import { C } from '@/tokens'
import { useLocale, useLocalProduct } from '@/contexts/LocaleContext'
import type { Product } from '@/types'
import Badge from './ui/Badge'
import PhotoBox from './ui/PhotoBox'
import Icon from './ui/Icon'
import Btn from './ui/Btn'

interface Props {
  product: Product
  wished: boolean
  onWish: (product: Product) => void
  onAdd: (product: Product) => void
  onClick: (product: Product) => void
}

export default function ProductCard({ product, wished, onWish, onAdd, onClick }: Props) {
  const { t } = useLocale()
  const localProduct = useLocalProduct()
  const p = localProduct(product)
  return (
    <div
      style={{
        background: C.bg,
        border: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        position: 'relative',
        height: '100%',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.borderMid }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border }}
      onClick={() => onClick(product)}
    >
      {/* Badge */}
      {product.badge && (
        <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 2 }}>
          <Badge type={product.badge} />
        </div>
      )}

      {/* Wishlist */}
      <button
        style={{
          position: 'absolute', top: '10px', right: '10px', zIndex: 2,
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
        }}
        onClick={e => { e.stopPropagation(); onWish(product) }}
        aria-label={t.product.wishlist}
      >
        <Icon
          name={wished ? 'heart-filled' : 'heart'}
          size={16}
          color={wished ? C.accent : C.textDim}
        />
      </button>

      {/* Image */}
      <div style={{ width: '100%', height: '220px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
        {product.image ? (
          <img
            src={product.image}
            alt={p.name}
            loading="lazy"
            decoding="async"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <PhotoBox cat={product.cat} size={260} style={{ width: '100%', height: '220px', border: 'none' }} />
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        <div style={{
          fontSize: '9px', letterSpacing: '0.12em', color: C.textDim, textTransform: 'uppercase',
          minHeight: '12px',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {product.brand}
        </div>
        <div style={{
          fontSize: '13px', fontWeight: 300, color: C.text, lineHeight: 1.35,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
          minHeight: 'calc(13px * 1.35 * 2)',
        }}>
          {p.name}
        </div>

        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minHeight: '14px' }}>
          <span style={{ color: C.accent, fontSize: '11px' }}>{'★'.repeat(Math.round(product.rating))}</span>
          <span style={{ fontSize: '10px', color: C.textDim }}>({product.rev})</span>
        </div>

        {/* Level */}
        <div style={{
          fontSize: '10px', color: C.textDim, letterSpacing: '0.08em',
          minHeight: '14px',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {product.lvl} · {product.mat}
        </div>

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
          <span style={{ fontSize: '16px', fontWeight: 400, color: C.text }}>
            €{product.price}
          </span>
          {product.old && (
            <span style={{ fontSize: '12px', color: C.textDim, textDecoration: 'line-through' }}>
              €{product.old}
            </span>
          )}
        </div>

        {/* Add to cart / sold out */}
        {product.stock === 0 ? (
          <div style={{
            width: '100%', marginTop: '10px', padding: '8px',
            border: `1px solid ${C.border}`,
            fontSize: '11px', letterSpacing: '0.1em',
            color: C.textDim, textAlign: 'center',
            boxSizing: 'border-box' as const,
          }}>
            {t.product.soldOut}
          </div>
        ) : (
          <Btn
            small
            onClick={e => { e.stopPropagation(); onAdd(product) }}
            style={{ width: '100%', marginTop: '10px', letterSpacing: '0.1em' }}
          >
            {t.product.addToCart}
          </Btn>
        )}
      </div>
    </div>
  )
}
