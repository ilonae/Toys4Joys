import React, { useState, useEffect } from 'react'
import { C } from '@/tokens'
import { useLocale, useLocalProduct, useLocalCategory } from '@/contexts/LocaleContext'
import type { Product } from '@/types'
import { useRelatedProducts, useReviews } from '@/hooks/useProducts'
import Badge from '@/components/ui/Badge'
import PhotoBox from '@/components/ui/PhotoBox'
import Btn from '@/components/ui/Btn'
import Icon from '@/components/ui/Icon'
import ProductCard from '@/components/ProductCard'
import Tag from '@/components/ui/Tag'

interface Props {
  product: Product
  onAdd: (p: Product) => void
  onWish: (product: Product) => void
  wished: (id: string) => boolean
  onNavigate: (page: 'shop') => void
  onProduct: (p: Product) => void
}

type Tab = 'desc' | 'details' | 'reviews'

export default function ProductDetail({ product, onAdd, onWish, wished, onNavigate, onProduct }: Props) {
  const { t, locale } = useLocale()
  const localProduct = useLocalProduct()
  const localCategory = useLocalCategory()
  const p = localProduct(product)
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState<Tab>('desc')
  const [activeImg, setActiveImg] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const dateLocale = locale === 'de' ? 'de-DE' : locale === 'es' ? 'es-ES' : 'en-GB'

  // Reset to first image whenever the product changes
  useEffect(() => { setActiveImg(0) }, [product.id])

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxOpen])

  const currentUrl = product.images[activeImg] ?? product.image

  const { products: related }     = useRelatedProducts(product.cat, product.id)
  const { reviews, loading: revLoading } = useReviews(product.id)

  const tabs: { key: Tab; label: string }[] = [
    { key: 'desc',    label: t.product.descTab },
    { key: 'details', label: t.product.detailsTab },
    { key: 'reviews', label: `${t.product.reviewsTab} (${product.rev})` },
  ]

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ padding: '16px 32px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: C.textDim, cursor: 'pointer' }} onClick={() => onNavigate('shop')}>Shop</span>
        <span style={{ fontSize: '11px', color: C.textDim }}>›</span>
        <span style={{ fontSize: '11px', color: C.textDim, cursor: 'pointer' }} onClick={() => onNavigate('shop')}>{localCategory(product.cat)}</span>
        <span style={{ fontSize: '11px', color: C.textDim }}>›</span>
        <span style={{ fontSize: '11px', color: C.textMid }}>{p.name}</span>
      </div>

      <div style={{ display: 'flex', gap: '0', borderBottom: `1px solid ${C.border}` }}>
        {/* Image panel */}
        <div style={{
          width: '480px', flexShrink: 0,
          borderRight: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column',
          background: C.bgCard,
          minHeight: '500px',
        }}>
          {/* Main image — click to open lightbox */}
          <div
            onClick={() => currentUrl && setLightboxOpen(true)}
            style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minHeight: '400px',
              cursor: currentUrl ? 'zoom-in' : 'default',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {currentUrl ? (
              <img
                src={currentUrl}
                alt={p.name}
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  position: 'absolute', inset: 0,
                }}
              />
            ) : (
              <PhotoBox cat={product.cat} size={320} style={{ border: 'none', background: 'transparent' }} />
            )}

            {/* Zoom hint */}
            {currentUrl && (
              <div style={{
                position: 'absolute', bottom: '14px', right: '16px',
                fontSize: '9px', color: C.textDim, letterSpacing: '0.12em',
                display: 'flex', alignItems: 'center', gap: '4px',
                pointerEvents: 'none',
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.textDim} strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                </svg>
                ZOOM
              </div>
            )}
          </div>

          {/* Thumbnail strip — only when multiple images */}
          {product.images.length > 1 && (
            <div style={{ display: 'flex', borderTop: `1px solid ${C.border}` }}>
              {product.images.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  style={{
                    flex: 1,
                    aspectRatio: '1',
                    maxWidth: '120px',
                    border: 'none',
                    borderRight: i < product.images.length - 1 ? `1px solid ${C.border}` : 'none',
                    borderTop: `2px solid ${i === activeImg ? C.accent : 'transparent'}`,
                    background: C.bgCard,
                    cursor: 'pointer',
                    padding: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'border-color 0.12s, background 0.12s',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={url}
                    alt={`${p.name} ${i + 1}`}
                    style={{
                      width: '100%', height: '100%',
                      objectFit: 'contain',
                      opacity: i === activeImg ? 1 : 0.4,
                      transition: 'opacity 0.12s',
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info panel */}
        <div style={{ flex: 1, padding: '48px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Badge type={product.badge} />
            <span style={{ fontSize: '10px', letterSpacing: '0.12em', color: C.textDim }}>{product.brand}</span>
          </div>

          <h1 style={{ fontSize: 'clamp(20px, 2.5vw, 30px)', fontWeight: 700, letterSpacing: '-0.01em', color: C.text, lineHeight: 1.2 }}>
            {p.name}
          </h1>

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: C.accent, fontSize: '14px' }}>{'★'.repeat(Math.round(product.rating))}</span>
            <span style={{ fontSize: '12px', color: C.textDim }}>{product.rating} · {product.rev} {t.product.reviews.toLowerCase()}</span>
          </div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span style={{ fontSize: '28px', fontWeight: 400, color: C.text }}>€{product.price}</span>
            {product.old && (
              <span style={{ fontSize: '16px', color: C.textDim, textDecoration: 'line-through' }}>€{product.old}</span>
            )}
            {product.old && (
              <span style={{ fontSize: '12px', color: C.accent }}>
                −{Math.round((1 - product.price / product.old) * 100)}%
              </span>
            )}
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[product.mat, product.lvl, product.sub].map(tg => (
              <span key={tg} style={{
                fontSize: '10px', letterSpacing: '0.08em',
                border: `1px solid ${C.border}`,
                color: C.textMid,
                padding: '4px 10px',
              }}>{tg}</span>
            ))}
          </div>

          {/* Qty + Add */}
          {/* Stock badge */}
          {product.stock > 0 && product.stock <= 5 && (
            <div style={{ fontSize: '11px', color: '#c97c30', letterSpacing: '0.06em' }}>
              {t.product.onlyLeft} {product.stock}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
            {product.stock === 0 ? (
              <>
                <div style={{
                  padding: '12px 28px',
                  border: `1px solid ${C.border}`,
                  fontSize: '12px', letterSpacing: '0.12em',
                  color: C.textDim,
                }}>
                  {t.product.soldOut}
                </div>
                {/* Wishlist still available */}
                <button
                  onClick={() => onWish(product)}
                  style={{
                    background: 'none',
                    border: `1px solid ${wished(product.id) ? C.accentDim : C.border}`,
                    cursor: 'pointer', padding: '11px 14px',
                    display: 'flex', alignItems: 'center',
                    transition: 'border-color 0.15s',
                    flexShrink: 0,
                  }}
                  title={t.product.wishlist}
                >
                  <Icon name={wished(product.id) ? 'heart-filled' : 'heart'} size={18} color={wished(product.id) ? C.accent : C.textMid} />
                </button>
              </>
            ) : (
              <>
                {/* Qty stepper */}
                <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.border}`, flexShrink: 0 }}>
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    style={{ background: 'none', border: 'none', color: C.textMid, cursor: 'pointer', padding: '10px 14px' }}
                  >
                    <Icon name="minus" size={14} color={C.textMid} />
                  </button>
                  <span style={{ fontSize: '13px', color: C.text, minWidth: '28px', textAlign: 'center' }}>{qty}</span>
                  <button
                    onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    style={{ background: 'none', border: 'none', color: C.textMid, cursor: 'pointer', padding: '10px 14px' }}
                  >
                    <Icon name="plus" size={14} color={C.textMid} />
                  </button>
                </div>

                {/* Add to cart */}
                <Btn
                  onClick={() => { for (let i = 0; i < qty; i++) onAdd(product) }}
                  style={{ letterSpacing: '0.1em', padding: '11px 28px', gap: '9px', boxShadow: `0 0 18px rgba(229,15,56,0.25)` }}
                >
                  <Icon name="cart" size={14} color={C.white} />
                  {t.product.addToCart}
                </Btn>

                {/* Wishlist */}
                <button
                  onClick={() => onWish(product)}
                  style={{
                    background: 'none',
                    border: `1px solid ${wished(product.id) ? C.accentDim : C.border}`,
                    cursor: 'pointer', padding: '11px 14px',
                    display: 'flex', alignItems: 'center',
                    transition: 'border-color 0.15s', flexShrink: 0,
                  }}
                >
                  <Icon name={wished(product.id) ? 'heart-filled' : 'heart'} size={18} color={wished(product.id) ? C.accent : C.textMid} />
                </button>
              </>
            )}
          </div>

          {/* Shipping note */}
          <div style={{ fontSize: '11px', color: C.textDim, borderTop: `1px solid ${C.border}`, paddingTop: '16px' }}>
            {t.product.shipping}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', padding: '0 32px' }}>
          {tabs.map(tb => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              style={{
                background: 'none', border: 'none',
                borderBottom: tab === tb.key ? `2px solid ${C.accent}` : '2px solid transparent',
                color: tab === tb.key ? C.text : C.textDim,
                fontSize: '11px', letterSpacing: '0.1em',
                padding: '18px 20px',
                cursor: 'pointer',
                transition: 'color 0.12s',
              }}
            >
              {tb.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '40px 32px', borderBottom: `1px solid ${C.border}`, maxWidth: '720px' }}>
        {tab === 'desc' && (
          p.desc?.trim() ? (
            <p style={{ fontSize: '14px', fontWeight: 300, color: C.textMid, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              {p.desc}
            </p>
          ) : (
            <p style={{ fontSize: '13px', color: C.textDim, fontStyle: 'italic' }}>
              {t.product.noDescription}
            </p>
          )
        )}
        {tab === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              [t.product.material, product.mat],
              [t.product.level,    product.lvl],
              [t.product.category, localCategory(product.cat)],
              [t.product.sub,      product.sub],
              [t.product.brand,    product.brand],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: '24px', fontSize: '12px' }}>
                <span style={{ color: C.textDim, width: '140px', flexShrink: 0, letterSpacing: '0.06em' }}>{k}</span>
                <span style={{ color: C.text }}>{v}</span>
              </div>
            ))}
          </div>
        )}
        {tab === 'reviews' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            {/* Aggregate header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', paddingBottom: '24px', borderBottom: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: '48px', fontWeight: 700, color: C.text, lineHeight: 1 }}>{product.rating.toFixed(1)}</div>
                <div style={{ color: C.accent, fontSize: '20px', letterSpacing: '0.1em', marginTop: '6px' }}>
                  {'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}
                </div>
                <div style={{ fontSize: '11px', color: C.textDim, marginTop: '4px', letterSpacing: '0.06em' }}>
                  {product.rev} {t.product.reviews.toLowerCase()}
                </div>
              </div>
            </div>

            {/* Individual reviews */}
            {revLoading ? (
              <div style={{ fontSize: '11px', color: C.textDim, letterSpacing: '0.08em' }}>{t.general.loading.toUpperCase()}</div>
            ) : reviews.length === 0 ? (
              <div style={{ fontSize: '13px', color: C.textDim }}>{t.product.noReviews}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: C.border }}>
                {reviews.map(r => (
                  <div key={r.id} style={{ background: C.bg, padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: C.text }}>{r.author}</div>
                        <div style={{ color: C.accent, fontSize: '13px', letterSpacing: '0.06em' }}>
                          {'★'.repeat(r.rating)}
                          <span style={{ color: C.border }}>{'★'.repeat(5 - r.rating)}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', color: C.textDim, flexShrink: 0 }}>
                        {new Date(r.created_at).toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', color: C.textMid, lineHeight: 1.75 }}>{r.body}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && currentUrl && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(4,2,8,0.96)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, cursor: 'zoom-out',
          }}
        >
          {/* Full-res image */}
          <img
            src={currentUrl}
            alt={p.name}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '88vw', maxHeight: '88vh',
              objectFit: 'contain',
              cursor: 'default',
            }}
          />

          {/* Close button */}
          <button
            onClick={() => setLightboxOpen(false)}
            style={{
              position: 'absolute', top: '24px', right: '28px',
              background: 'none', border: `1px solid ${C.border}`,
              color: C.textMid, cursor: 'pointer',
              padding: '7px 14px', fontSize: '10px', letterSpacing: '0.12em',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            ESC
          </button>

          {/* Multi-image dots (navigate without leaving lightbox) */}
          {product.images.length > 1 && (
            <div style={{
              position: 'absolute', bottom: '28px',
              display: 'flex', gap: '10px', alignItems: 'center',
            }}>
              {product.images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setActiveImg(i) }}
                  style={{
                    width: i === activeImg ? '24px' : '8px',
                    height: '3px',
                    borderRadius: '2px',
                    background: i === activeImg ? C.accent : C.borderMid,
                    border: 'none', cursor: 'pointer', padding: 0,
                    transition: 'width 0.18s, background 0.18s',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section style={{ padding: '48px 32px' }}>
          <Tag style={{ marginBottom: '24px' }}>{t.product.relatedTitle}</Tag>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '16px',
          }}>
            {related.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                wished={wished(p.id)}
                onWish={onWish}
                onAdd={onAdd}
                onClick={onProduct}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
