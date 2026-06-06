import React, { useState, useMemo, useEffect } from 'react'
import { C } from '@/tokens'
import { useLocale, useLocalCategory } from '@/contexts/LocaleContext'
import { useProducts, useSubcategories } from '@/hooks/useProducts'
import { useIsMobile } from '@/hooks/useIsMobile'
import { CATEGORIES } from '@/data/navigation'
import ProductCard from '@/components/ProductCard'
import Tag from '@/components/ui/Tag'
import Icon from '@/components/ui/Icon'
import type { Product } from '@/types'

type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'rating'

interface Props {
  initialCat?: string
  initialSub?: string
  onProduct: (p: Product) => void
  onAdd: (p: Product) => void
  onWish: (product: Product) => void
  wished: (id: string) => boolean
}

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'All levels']

export default function Shop({ initialCat, initialSub, onProduct, onAdd, onWish, wished }: Props) {
  const { t } = useLocale()
  const localCategory = useLocalCategory()
  const isMobile = useIsMobile()
  const { products, loading } = useProducts()
  const [activeCat, setActiveCat] = useState<string>(initialCat ?? t.shop.all)
  const [activeSubs, setActiveSubs] = useState<Set<string>>(
    initialSub ? new Set([initialSub]) : new Set()
  )
  const [priceMax, setPriceMax] = useState(500)
  const [activeLevels, setActiveLevels] = useState<Set<string>>(new Set())
  const [sort, setSort] = useState<SortKey>('newest')
  const [page, setPage] = useState(1)
  const [filterOpen, setFilterOpen] = useState(false)
  const PER_PAGE = 12

  useEffect(() => {
    if (initialCat && initialCat !== activeCat) {
      setActiveCat(initialCat)
      setActiveSubs(initialSub ? new Set([initialSub]) : new Set())
      setPage(1)
    } else if (initialSub) {
      setActiveSubs(new Set([initialSub]))
      setPage(1)
    }
  }, [initialCat, initialSub])

  // Lock body scroll when filter drawer is open on mobile
  useEffect(() => {
    document.body.style.overflow = (isMobile && filterOpen) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isMobile, filterOpen])

  const { subs: availableSubs } = useSubcategories(activeCat)

  const toggleSub = (s: string) => {
    setActiveSubs(prev => {
      const n = new Set(prev)
      n.has(s) ? n.delete(s) : n.add(s)
      return n
    })
    setPage(1)
  }

  const toggleLevel = (l: string) => {
    setActiveLevels(prev => {
      const n = new Set(prev)
      n.has(l) ? n.delete(l) : n.add(l)
      return n
    })
    setPage(1)
  }

  const filtered = useMemo(() => {
    let list = [...products]
    if (activeCat !== t.shop.all) list = list.filter(p => p.cat === activeCat)
    if (activeSubs.size > 0) list = list.filter(p => activeSubs.has(p.sub))
    list = list.filter(p => p.price <= priceMax)
    if (activeLevels.size > 0) list = list.filter(p => activeLevels.has(p.lvl))
    switch (sort) {
      case 'price-asc':  list.sort((a, b) => a.price - b.price); break
      case 'price-desc': list.sort((a, b) => b.price - a.price); break
      case 'rating':     list.sort((a, b) => b.rating - a.rating); break
      default:           list.sort((a, b) => a.name.localeCompare(b.name))
    }
    return list
  }, [products, activeCat, activeSubs, priceMax, activeLevels, sort, t.shop.all])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const activeFilterCount = activeSubs.size + activeLevels.size + (priceMax < 500 ? 1 : 0)

  // Shared filter panel content (used in both sidebar and mobile drawer)
  const FilterContent = () => (
    <>
      {/* Categories */}
      <div>
        <div style={{ fontSize: '9px', letterSpacing: '0.14em', color: C.textDim, textTransform: 'uppercase', marginBottom: '12px' }}>
          {t.landing.categoryTitle}
        </div>
        <div
          onClick={() => { setActiveCat(t.shop.all); setActiveSubs(new Set()); setPage(1) }}
          style={{
            fontSize: '12px',
            fontWeight: activeCat === t.shop.all ? 400 : 300,
            color: activeCat === t.shop.all ? C.accent : C.textMid,
            cursor: 'pointer', padding: '6px 0',
            borderLeft: activeCat === t.shop.all ? `2px solid ${C.accent}` : '2px solid transparent',
            paddingLeft: '10px', transition: 'color 0.12s',
          }}
        >
          {t.shop.all}
        </div>
        {CATEGORIES.filter(c => c.name !== 'Alle').map(cat => (
          <div
            key={cat.name}
            onClick={() => { setActiveCat(cat.name); setActiveSubs(new Set()); setPage(1) }}
            style={{
              fontSize: '12px',
              fontWeight: activeCat === cat.name ? 400 : 300,
              color: activeCat === cat.name ? C.accent : C.textMid,
              cursor: 'pointer', padding: '6px 0',
              borderLeft: activeCat === cat.name ? `2px solid ${C.accent}` : '2px solid transparent',
              paddingLeft: '10px', transition: 'color 0.12s',
            }}
          >
            {localCategory(cat.name)}
          </div>
        ))}
      </div>

      {/* Subcategories */}
      {availableSubs.length > 0 && (
        <div>
          <div style={{ fontSize: '9px', letterSpacing: '0.14em', color: C.textDim, textTransform: 'uppercase', marginBottom: '12px' }}>
            {t.shop.subcategories}
          </div>
          {availableSubs.map(s => (
            <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={activeSubs.has(s)}
                onChange={() => toggleSub(s)}
                style={{ accentColor: C.accent }}
              />
              <span style={{ fontSize: '11px', color: activeSubs.has(s) ? C.text : C.textMid }}>{s}</span>
            </label>
          ))}
        </div>
      )}

      {/* Price range */}
      <div>
        <div style={{ fontSize: '9px', letterSpacing: '0.14em', color: C.textDim, textTransform: 'uppercase', marginBottom: '12px' }}>
          {t.shop.priceRange} ≤ €{priceMax}
        </div>
        <input
          type="range" min={10} max={500} step={10}
          value={priceMax}
          onChange={e => { setPriceMax(Number(e.target.value)); setPage(1) }}
          style={{ width: '100%', accentColor: C.accent }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: C.textDim, marginTop: '4px' }}>
          <span>€10</span><span>€500</span>
        </div>
      </div>

      {/* Level */}
      <div>
        <div style={{ fontSize: '9px', letterSpacing: '0.14em', color: C.textDim, textTransform: 'uppercase', marginBottom: '12px' }}>
          {t.shop.levels}
        </div>
        {LEVELS.map(l => (
          <label key={l} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={activeLevels.has(l)}
              onChange={() => toggleLevel(l)}
              style={{ accentColor: C.accent }}
            />
            <span style={{ fontSize: '11px', color: activeLevels.has(l) ? C.text : C.textMid }}>{l}</span>
          </label>
        ))}
      </div>
    </>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside style={{
          width: '220px',
          flexShrink: 0,
          borderRight: `1px solid ${C.border}`,
          padding: '32px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
          position: 'sticky',
          top: '112px',
          height: 'calc(100vh - 112px)',
          overflowY: 'auto',
        }}>
          <FilterContent />
        </aside>
      )}

      {/* Main */}
      <main style={{ flex: 1, padding: isMobile ? '16px' : '32px', minWidth: 0 }}>

        {/* Mobile: horizontal category pills */}
        {isMobile && (
          <div style={{
            display: 'flex', gap: '8px', overflowX: 'auto',
            marginBottom: '16px', marginLeft: '-16px', marginRight: '-16px',
            padding: '0 16px', scrollbarWidth: 'none',
          }}>
            <button
              onClick={() => { setActiveCat(t.shop.all); setActiveSubs(new Set()); setPage(1) }}
              style={{
                flexShrink: 0, padding: '8px 14px',
                background: activeCat === t.shop.all ? C.accent : C.bgCard,
                border: `1px solid ${activeCat === t.shop.all ? C.accent : C.border}`,
                color: activeCat === t.shop.all ? C.white : C.textMid,
                fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}
            >
              {t.shop.all}
            </button>
            {CATEGORIES.filter(c => c.name !== 'Alle').map(cat => (
              <button
                key={cat.name}
                onClick={() => { setActiveCat(cat.name); setActiveSubs(new Set()); setPage(1) }}
                style={{
                  flexShrink: 0, padding: '8px 14px',
                  background: activeCat === cat.name ? C.accent : C.bgCard,
                  border: `1px solid ${activeCat === cat.name ? C.accent : C.border}`,
                  color: activeCat === cat.name ? C.white : C.textMid,
                  fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase',
                  cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                }}
              >
                {localCategory(cat.name)}
              </button>
            ))}
          </div>
        )}

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Mobile: Filter button */}
            {isMobile && (
              <button
                onClick={() => setFilterOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 12px',
                  background: activeFilterCount > 0 ? C.accent : C.bgCard,
                  border: `1px solid ${activeFilterCount > 0 ? C.accent : C.border}`,
                  color: activeFilterCount > 0 ? C.white : C.textMid,
                  fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <Icon name="filter" size={12} color={activeFilterCount > 0 ? C.white : C.textMid} />
                {activeFilterCount > 0 ? `Filter (${activeFilterCount})` : 'Filter'}
              </button>
            )}
            <div>
              {!isMobile && <Tag style={{ marginBottom: '4px' }}>{activeCat === t.shop.all ? t.shop.all : localCategory(activeCat)}</Tag>}
              <div style={{ fontSize: '12px', color: C.textDim }}>{filtered.length}</div>
            </div>
          </div>
          <select
            value={sort}
            onChange={e => { setSort(e.target.value as SortKey); setPage(1) }}
            style={{
              background: C.bgCard, border: `1px solid ${C.border}`,
              color: C.textMid, fontSize: '11px',
              padding: '8px 12px', outline: 'none', letterSpacing: '0.05em',
              flexShrink: 0,
            }}
          >
            <option value="newest">{t.shop.sortNewest}</option>
            <option value="price-asc">{t.shop.sortPriceAsc}</option>
            <option value="price-desc">{t.shop.sortPriceDesc}</option>
            <option value="rating">{t.shop.sortRating}</option>
          </select>
        </div>

        {/* Grid */}
        {loading && (
          <div style={{ fontSize: '11px', color: C.textDim, letterSpacing: '0.1em', padding: '40px 0' }}>
            {t.general.loading.toUpperCase()}
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ fontSize: '13px', color: C.textDim, padding: '40px 0' }}>
            {t.shop.noResults}
          </div>
        )}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: isMobile ? '10px' : '16px',
          marginBottom: '32px',
        }}>
          {pageItems.map(p => (
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                style={{
                  width: '36px', height: '36px',
                  background: page === n ? C.accent : 'transparent',
                  border: `1px solid ${page === n ? C.accent : C.border}`,
                  color: page === n ? C.white : C.textMid,
                  fontSize: '11px', cursor: 'pointer',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Mobile filter drawer */}
      {isMobile && filterOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setFilterOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.75)',
              zIndex: 200,
            }}
          />
          {/* Bottom sheet */}
          <div
            className="slide-up"
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              background: C.bgSurface,
              borderTop: `1px solid ${C.border}`,
              borderRadius: '12px 12px 0 0',
              zIndex: 201,
              maxHeight: '80dvh',
              overflowY: 'auto',
              paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            }}
          >
            {/* Handle + header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
              position: 'sticky', top: 0, background: C.bgSurface, zIndex: 1,
            }}>
              <div style={{ width: '40px', height: '3px', background: C.border, borderRadius: '2px', margin: '0 auto', position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '8px' }} />
              <span style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textMid }}>
                Filter
                {activeFilterCount > 0 && <span style={{ color: C.accent, marginLeft: '6px' }}>({activeFilterCount})</span>}
              </span>
              <button
                onClick={() => setFilterOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}
              >
                <Icon name="x" size={18} color={C.textMid} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <FilterContent />

              {/* Apply button */}
              <button
                onClick={() => setFilterOpen(false)}
                style={{
                  width: '100%', padding: '14px',
                  background: C.accent, border: 'none',
                  color: C.white, fontSize: '12px', letterSpacing: '0.12em',
                  textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {filtered.length} Produkte anzeigen
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
