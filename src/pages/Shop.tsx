import React, { useState, useMemo, useEffect } from 'react'
import { C } from '@/tokens'
import { useProducts, useSubcategories } from '@/hooks/useProducts'
import { CATEGORIES } from '@/data/navigation'
import ProductCard from '@/components/ProductCard'
import Tag from '@/components/ui/Tag'
import type { Product, Category } from '@/types'

type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'rating'

interface Props {
  initialCat?: string
  onProduct: (p: Product) => void
  onAdd: (p: Product) => void
  onWish: (product: Product) => void
  wished: (id: string) => boolean
}

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'All levels']

export default function Shop({ initialCat, onProduct, onAdd, onWish, wished }: Props) {
  const { products, loading } = useProducts()
  const [activeCat, setActiveCat] = useState<string>(initialCat ?? 'Alle')
  const [activeSubs, setActiveSubs] = useState<Set<string>>(new Set())
  const [priceMax, setPriceMax] = useState(500)
  const [activeLevels, setActiveLevels] = useState<Set<string>>(new Set())
  const [sort, setSort] = useState<SortKey>('newest')
  const [page, setPage] = useState(1)
  const PER_PAGE = 12

  // Sync when the user navigates to a different category from the navbar
  useEffect(() => {
    if (initialCat && initialCat !== activeCat) {
      setActiveCat(initialCat)
      setActiveSubs(new Set())
      setPage(1)
    }
  }, [initialCat])

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
    if (activeCat !== 'Alle') list = list.filter(p => p.cat === activeCat || p.cat === activeCat)
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
  }, [products, activeCat, activeSubs, priceMax, activeLevels, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '220px',
        flexShrink: 0,
        borderRight: `1px solid ${C.border}`,
        padding: '32px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        position: 'sticky',
        top: '56px',
        height: 'calc(100vh - 56px)',
        overflowY: 'auto',
      }}>
        {/* Categories */}
        <div>
          <div style={{ fontSize: '9px', letterSpacing: '0.14em', color: C.textDim, textTransform: 'uppercase', marginBottom: '12px' }}>
            Kategorien
          </div>
          {CATEGORIES.map(cat => (
            <div
              key={cat.name}
              onClick={() => { setActiveCat(cat.name); setActiveSubs(new Set()); setPage(1) }}
              style={{
                fontSize: '12px',
                fontWeight: activeCat === cat.name ? 400 : 300,
                color: activeCat === cat.name ? C.accent : C.textMid,
                cursor: 'pointer',
                padding: '6px 0',
                borderLeft: activeCat === cat.name ? `2px solid ${C.accent}` : '2px solid transparent',
                paddingLeft: '10px',
                transition: 'color 0.12s',
              }}
            >
              {cat.name}
            </div>
          ))}
        </div>

        {/* Subcategories — live from Sanity */}
        {availableSubs.length > 0 && (
          <div>
            <div style={{ fontSize: '9px', letterSpacing: '0.14em', color: C.textDim, textTransform: 'uppercase', marginBottom: '12px' }}>
              Unterkategorien
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
            Preis bis €{priceMax}
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
            Erfahrung
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
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
          <div>
            <Tag style={{ marginBottom: '8px' }}>{activeCat}</Tag>
            <div style={{ fontSize: '12px', color: C.textDim }}>{filtered.length} Produkte</div>
          </div>
          <select
            value={sort}
            onChange={e => { setSort(e.target.value as SortKey); setPage(1) }}
            style={{
              background: C.bgCard,
              border: `1px solid ${C.border}`,
              color: C.textMid,
              fontSize: '11px',
              padding: '8px 12px',
              outline: 'none',
              letterSpacing: '0.05em',
            }}
          >
            <option value="newest">Neueste</option>
            <option value="price-asc">Preis aufsteigend</option>
            <option value="price-desc">Preis absteigend</option>
            <option value="rating">Bewertung</option>
          </select>
        </div>

        {/* Grid */}
        {loading && (
          <div style={{ fontSize: '11px', color: C.textDim, letterSpacing: '0.1em', padding: '40px 0' }}>
            PRODUKTE WERDEN GELADEN…
          </div>
        )}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1px',
          background: filtered.length > 0 ? C.border : 'transparent',
          marginBottom: '32px',
        }}>
          {pageItems.map(p => (
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                style={{
                  width: '32px', height: '32px',
                  background: page === n ? C.accent : 'transparent',
                  border: `1px solid ${page === n ? C.accent : C.border}`,
                  color: page === n ? C.white : C.textMid,
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
