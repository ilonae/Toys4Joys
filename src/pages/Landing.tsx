import React from 'react'
import { C } from '@/tokens'
import { useLocale } from '@/contexts/LocaleContext'
import Tag from '@/components/ui/Tag'
import Btn from '@/components/ui/Btn'
import PhotoBox from '@/components/ui/PhotoBox'
import ProductCard from '@/components/ProductCard'
import { useFeaturedProducts } from '@/hooks/useProducts'
import type { Product } from '@/types'

interface Props {
  onNavigate: (page: 'shop' | 'product', cat?: string) => void
  onAdd: (p: Product) => void
  onWish: (product: Product) => void
  wished: (id: string) => boolean
  onProduct: (p: Product) => void
}

export default function Landing({ onNavigate, onAdd, onWish, wished, onProduct }: Props) {
  const { t } = useLocale()
  const { products: featured } = useFeaturedProducts()

  const STORY_SECTIONS = [
    { tag: t.landing.story1Tag, heading: t.landing.story1Heading, body: t.landing.story1Body, cat: 'BDSM & Kontrolle' as const, image: '/images/manifesto.jpg' },
    { tag: t.landing.story2Tag, heading: t.landing.story2Heading, body: t.landing.story2Body, cat: 'Latex & Fetischwear' as const, image: '/images/product-hero.jpg' },
    { tag: t.landing.story3Tag, heading: t.landing.story3Heading, body: t.landing.story3Body, cat: 'Vibratoren & Elektro' as const, image: '/images/community.jpg' },
  ]

  return (
    <div>
      {/* Hero */}
      <section style={{
        minHeight: '88vh',
        display: 'flex',
        borderBottom: `1px solid ${C.border}`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Left — text content */}
        <div style={{
          flex: '0 0 52%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 56px 80px 32px',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Background grid lines */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0,
            backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            opacity: 0.4,
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <Tag style={{ marginBottom: '28px' }}>{t.landing.heroTag}</Tag>
            <h1 style={{
              fontSize: 'clamp(42px, 5.5vw, 88px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.0,
              color: C.text,
              marginBottom: '32px',
            }}>
              {t.landing.heroLine1}<br />
              <span style={{ color: C.accent }}>{t.landing.heroLine2}</span><br />
              {t.landing.heroLine3}
            </h1>
            <p style={{
              fontSize: '15px',
              fontWeight: 300,
              color: C.textMid,
              lineHeight: 1.7,
              maxWidth: '420px',
              marginBottom: '40px',
            }}>
              {t.landing.heroBody}
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Btn onClick={() => onNavigate('shop')}>{t.landing.heroCta}</Btn>
              <Btn variant="outline" onClick={() => onNavigate('shop', 'BDSM & Kontrolle')}>{t.landing.heroCtaSecondary}</Btn>
            </div>
          </div>

          {/* Floating accent lines */}
          <div style={{
            position: 'absolute', right: '5%', top: '20%',
            width: '1px', height: '160px', background: `linear-gradient(transparent, ${C.accent}, transparent)`,
          }} />
        </div>

        {/* Right — hero image */}
        <div style={{
          flex: '0 0 48%',
          position: 'relative',
          borderLeft: `1px solid ${C.border}`,
          overflow: 'hidden',
        }}>
          <img
            src="/images/hero-banner.jpg"
            alt="TOYS4JOYS — Premium Kink"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
            }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(90deg, ${C.bg} 0%, transparent 18%)`,
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px',
            background: `linear-gradient(transparent, ${C.bg})`,
            pointerEvents: 'none',
          }} />
        </div>
      </section>

      {/* Story sections */}
      {STORY_SECTIONS.map((s, i) => (
        <section
          key={s.tag}
          style={{
            display: 'flex',
            flexDirection: i % 2 === 0 ? 'row' : 'row-reverse',
            gap: '0',
            borderBottom: `1px solid ${C.border}`,
            minHeight: '380px',
          }}
        >
          <div style={{
            flex: 1,
            padding: '64px 56px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '20px',
          }}>
            <Tag>{s.tag}</Tag>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2, color: C.text }}>
              {s.heading}
            </h2>
            <p style={{ fontSize: '14px', fontWeight: 300, color: C.textMid, lineHeight: 1.75, maxWidth: '440px' }}>
              {s.body}
            </p>
          </div>
          <div style={{
            width: '420px',
            flexShrink: 0,
            background: C.bgCard,
            borderLeft: i % 2 === 0 ? `1px solid ${C.border}` : 'none',
            borderRight: i % 2 !== 0 ? `1px solid ${C.border}` : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
          }}>
            {s.image ? (
              <img
                src={s.image}
                alt={s.heading}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  display: 'block',
                }}
              />
            ) : (
              <PhotoBox cat={s.cat} size={280} style={{ border: 'none', background: 'transparent' }} />
            )}
          </div>
        </section>
      ))}

      {/* Stat strip */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        borderBottom: `1px solid ${C.border}`,
      }}>
        {[
          { n: '5', label: t.landing.stat1Label },
          { n: '100%', label: t.landing.stat2Label },
          { n: 'Berlin', label: t.landing.stat3Label },
        ].map((s, i) => (
          <div key={s.label} style={{
            padding: '48px 32px',
            borderRight: i < 2 ? `1px solid ${C.border}` : 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'center',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, color: C.accent }}>{s.n}</div>
            <div style={{ fontSize: '10px', letterSpacing: '0.14em', color: C.textDim, textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* Featured products */}
      <section style={{ padding: '64px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
          <div>
            <Tag style={{ marginBottom: '12px' }}>{t.landing.sortimentTag}</Tag>
            <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.01em', color: C.text }}>
              {t.landing.featuredTag}
            </h2>
          </div>
          <Btn variant="ghost" onClick={() => onNavigate('shop')} style={{ color: C.accent, fontSize: '11px', letterSpacing: '0.1em' }}>
            {t.landing.allProducts} →
          </Btn>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1px',
          background: C.border,
        }}>
          {featured.map(p => (
            <div key={p.id} style={{ background: C.bg }}>
              <ProductCard
                product={p}
                wished={wished(p.id)}
                onWish={onWish}
                onAdd={onAdd}
                onClick={onProduct}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{
        padding: '80px 32px',
        borderTop: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '24px',
      }}>
        <Tag>{t.landing.shippingTag}</Tag>
        <h2 style={{ fontSize: 'clamp(22px, 3vw, 38px)', fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>
          {t.landing.shippingHeading}
        </h2>
        <p style={{ fontSize: '13px', color: C.textMid, maxWidth: '400px', lineHeight: 1.7 }}>
          {t.landing.shippingBody}
        </p>
        <Btn onClick={() => onNavigate('shop')} style={{ marginTop: '8px' }}>{t.landing.shippingCta}</Btn>
      </section>
    </div>
  )
}
