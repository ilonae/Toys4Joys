import React, { useState, useEffect, useRef } from 'react'
import { C } from '@/tokens'
import { useAuth } from '@/contexts/AuthContext'
import { useAllOrders } from '@/hooks/useOrders'
import { supabase } from '@/lib/supabase'
import { productImageUrl } from '@/lib/queries'
import Tag from '@/components/ui/Tag'
import Btn from '@/components/ui/Btn'
import { trackingUrl, detectCarrier } from '@/lib/tracking'
import type { Page, Product, Category, Level, BadgeType, OrderStatus } from '@/types'

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  'Latex & Fetischwear', 'BDSM & Kontrolle', 'Vibratoren & Elektro', 'Dildos', 'Anal',
]

const LEVELS: Level[] = ['All levels', 'Beginner', 'Intermediate', 'Advanced', 'Expert']

const BADGES: string[] = ['', 'new', 'bestseller', 'sale', 'expert']

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Ausstehend', paid: 'Bezahlt', shipped: 'Versendet',
  delivered: 'Geliefert', cancelled: 'Storniert',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: C.textDim, paid: '#7cc97c', shipped: C.accent,
  delivered: '#7cc97c', cancelled: C.accentDim,
}

// ── Small field ───────────────────────────────────────────────────────────────

function F({
  label, value, onChange, type = 'text', placeholder, full = false,
}: {
  label: string; value: string | number; onChange: (v: string) => void
  type?: string; placeholder?: string; full?: boolean
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', gridColumn: full ? '1 / -1' : undefined }}>
      <span style={{ fontSize: '10px', letterSpacing: '0.08em', color: C.textDim, textTransform: 'uppercase' }}>{label}</span>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          background: C.bgCard, border: `1px solid ${C.border}`, color: C.text,
          padding: '8px 10px', fontSize: '12px', fontFamily: 'inherit', outline: 'none',
          width: '100%', boxSizing: 'border-box',
        }}
        onFocus={e => { e.target.style.borderColor = C.accent }}
        onBlur={e => { e.target.style.borderColor = C.border }}
      />
    </label>
  )
}

function Sel({
  label, value, onChange, options, full = false,
}: {
  label: string; value: string; onChange: (v: string) => void
  options: string[]; full?: boolean
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', gridColumn: full ? '1 / -1' : undefined }}>
      <span style={{ fontSize: '10px', letterSpacing: '0.08em', color: C.textDim, textTransform: 'uppercase' }}>{label}</span>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        style={{
          background: C.bgCard, border: `1px solid ${C.border}`, color: C.text,
          padding: '8px 10px', fontSize: '12px', fontFamily: 'inherit', outline: 'none',
          width: '100%', cursor: 'pointer',
        }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  )
}

// ── Product form ──────────────────────────────────────────────────────────────

interface ProductFormData {
  name: string; brand: string; cat: Category; sub: string
  price: string; old_price: string; badge: BadgeType | ''
  rating: string; rev: string; mat: string; lvl: Level
  description: string; stock: string; featured: boolean
  supplier_sku: string
}

const EMPTY_FORM: ProductFormData = {
  name: '', brand: '', cat: 'Dildos', sub: '',
  price: '', old_price: '', badge: '',
  rating: '0', rev: '0', mat: '', lvl: 'All levels',
  description: '', stock: '0', featured: false,
  supplier_sku: '',
}

function ProductFormModal({
  product,
  onSave,
  onClose,
}: {
  product: (Product & { image_path?: string; featured?: boolean }) | null
  onSave: () => void
  onClose: () => void
}) {
  const [form, setForm] = useState<ProductFormData>(
    product
      ? {
          name:        product.name,
          brand:       product.brand,
          cat:         product.cat,
          sub:         product.sub,
          price:       String(product.price),
          old_price:   product.old != null ? String(product.old) : '',
          badge:       product.badge ?? '',
          rating:      String(product.rating),
          rev:         String(product.rev),
          mat:         product.mat,
          lvl:         product.lvl,
          description:  product.desc,
          stock:        String(product.stock),
          featured:     (product as any).featured ?? false,
          supplier_sku: (product as any).supplier_sku ?? '',
        }
      : EMPTY_FORM
  )
  const [uploading,  setUploading]  = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(product?.image)
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (k: keyof ProductFormData) => (v: string) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    const ext  = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: upErr } = await supabase.storage.from('product-images').upload(path, file)
    if (upErr) { setError('Bild-Upload fehlgeschlagen: ' + upErr.message); setUploading(false); return }
    const url = productImageUrl(path)
    setPreviewUrl(url)
    // Store path in form as a temporary field
    setForm(f => ({ ...f, _imagePath: path } as any))
    setUploading(false)
  }

  const handleSave = async () => {
    if (!form.name || !form.price) { setError('Name und Preis sind Pflichtfelder.'); return }
    setSaving(true)
    setError(null)

    const payload: Record<string, unknown> = {
      name:        form.name.trim(),
      brand:       form.brand.trim(),
      cat:         form.cat,
      sub:         form.sub.trim(),
      price:       parseFloat(form.price),
      old_price:   form.old_price ? parseFloat(form.old_price) : null,
      badge:       form.badge || null,
      rating:      parseFloat(form.rating) || 0,
      rev:         parseInt(form.rev)      || 0,
      mat:         form.mat.trim(),
      lvl:         form.lvl,
      description: form.description.trim(),
      stock:        parseInt(form.stock)    || 0,
      featured:     form.featured,
      supplier_sku: form.supplier_sku.trim() || null,
      updated_at:   new Date().toISOString(),
    }

    const newPath = (form as any)._imagePath
    if (newPath) {
      payload.image_path  = newPath
      payload.image_paths = [newPath]
    }

    let dbErr
    if (product) {
      const { error: e } = await supabase.from('products').update(payload).eq('id', product.id)
      dbErr = e
    } else {
      if (!newPath) { setError('Bitte lade ein Produktbild hoch.'); setSaving(false); return }
      const { error: e } = await supabase.from('products').insert({ ...payload, created_at: new Date().toISOString() })
      dbErr = e
    }

    setSaving(false)
    if (dbErr) { setError('Speichern fehlgeschlagen: ' + dbErr.message); return }
    onSave()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(7,5,9,0.85)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '40px 16px', overflowY: 'auto',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: C.bg, border: `1px solid ${C.border}`,
        width: '100%', maxWidth: '640px', padding: '32px',
        display: 'flex', flexDirection: 'column', gap: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: 0 }}>
            {product ? 'Produkt bearbeiten' : 'Neues Produkt'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
        </div>

        {/* Image upload */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          {previewUrl && (
            <img src={previewUrl} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', border: `1px solid ${C.border}`, flexShrink: 0 }} />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.08em', color: C.textDim, textTransform: 'uppercase', marginBottom: '8px' }}>Produktbild</div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }}
            />
            <Btn variant="outline" small onClick={() => fileRef.current?.click()} style={{ fontSize: '11px' }}>
              {uploading ? 'LADE HOCH…' : previewUrl ? 'BILD ÄNDERN' : 'BILD HOCHLADEN'}
            </Btn>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <F label="Name *" value={form.name} onChange={set('name')} placeholder="Produktname" full />
          <F label="Marke" value={form.brand} onChange={set('brand')} placeholder="Brand" />
          <Sel label="Kategorie" value={form.cat} onChange={set('cat')} options={CATEGORIES} />
          <F label="Unterkategorie" value={form.sub} onChange={set('sub')} placeholder="z.B. Korsetts" full />
          <F label="Preis (€) *" value={form.price} onChange={set('price')} type="number" placeholder="29.99" />
          <F label="Alter Preis (€)" value={form.old_price} onChange={set('old_price')} type="number" placeholder="39.99" />
          <Sel label="Badge" value={form.badge ?? ''} onChange={set('badge')} options={BADGES} />
          <F label="Lagerbestand" value={form.stock} onChange={set('stock')} type="number" placeholder="0" />
          <F label="Lieferanten-SKU" value={form.supplier_sku} onChange={set('supplier_sku')} placeholder="z.B. XD-19022" />
          <F label="Material" value={form.mat} onChange={set('mat')} placeholder="Silikon, Latex…" />
          <Sel label="Level" value={form.lvl} onChange={set('lvl')} options={LEVELS} />
          <F label="Bewertung (0–5)" value={form.rating} onChange={set('rating')} type="number" placeholder="4.5" />
          <F label="Anzahl Reviews" value={form.rev} onChange={set('rev')} type="number" placeholder="0" />
          <label style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
              style={{ width: '16px', height: '16px', accentColor: C.accent }} />
            <span style={{ fontSize: '12px', color: C.textMid }}>Auf der Startseite featured anzeigen</span>
          </label>
          <label style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span style={{ fontSize: '10px', letterSpacing: '0.08em', color: C.textDim, textTransform: 'uppercase' }}>Beschreibung</span>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4}
              style={{
                background: C.bgCard, border: `1px solid ${C.border}`, color: C.text,
                padding: '8px 10px', fontSize: '12px', fontFamily: 'inherit', outline: 'none',
                width: '100%', boxSizing: 'border-box', resize: 'vertical',
              }}
              onFocus={e => { e.target.style.borderColor = C.accent }}
              onBlur={e => { e.target.style.borderColor = C.border }}
            />
          </label>
        </div>

        {error && (
          <div style={{ fontSize: '12px', color: C.accent, padding: '10px', border: `1px solid ${C.accentDim}`, background: C.bgCard }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Btn variant="outline" onClick={onClose}>ABBRECHEN</Btn>
          <Btn onClick={handleSave} disabled={saving || uploading}>
            {saving ? 'SPEICHERN…' : 'SPEICHERN'}
          </Btn>
        </div>
      </div>
    </div>
  )
}

// ── Products tab ──────────────────────────────────────────────────────────────

function ProductsTab() {
  const [products,  setProducts]  = useState<Product[]>([])
  const [loading,   setLoading]   = useState(true)
  const [editProd,  setEditProd]  = useState<Product | null | 'new'>('new' as any)
  const [modalOpen, setModalOpen] = useState(false)
  const [search,    setSearch]    = useState('')
  const [deleting,  setDeleting]  = useState<string | null>(null)

  useEffect(() => { loadProducts() }, [])

  const loadProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('id, name, brand, cat, sub, price, old_price, badge, rating, rev, mat, lvl, description, image_path, image_paths, featured, stock')
      .order('created_at', { ascending: false })
    if (!error && data) {
      setProducts(data.map((row: any) => ({
        id: row.id, name: row.name, brand: row.brand ?? '', cat: row.cat, sub: row.sub ?? '',
        price: Number(row.price), old: row.old_price != null ? Number(row.old_price) : null,
        badge: row.badge ?? null, rating: Number(row.rating ?? 0), rev: Number(row.rev ?? 0),
        mat: row.mat ?? '', lvl: row.lvl ?? 'All levels', desc: row.description ?? '',
        stock: Number(row.stock ?? 0),
        image: productImageUrl(row.image_path),
        images: [],
        // carry raw fields for form
        image_path: row.image_path,
        featured: row.featured ?? false,
      } as any)))
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Produkt wirklich löschen?')) return
    setDeleting(id)
    await supabase.from('products').delete().eq('id', id)
    await loadProducts()
    setDeleting(null)
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 40px', borderBottom: `1px solid ${C.border}` }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Produkte suchen…"
          style={{
            background: C.bgCard, border: `1px solid ${C.border}`, color: C.text,
            padding: '9px 14px', fontSize: '12px', fontFamily: 'inherit', outline: 'none',
            width: '260px',
          }}
          onFocus={e => { e.target.style.borderColor = C.accent }}
          onBlur={e => { e.target.style.borderColor = C.border }}
        />
        <Btn onClick={() => { setEditProd(null); setModalOpen(true) }}>+ NEUES PRODUKT</Btn>
      </div>

      {loading ? (
        <div style={{ padding: '48px 40px', fontSize: '11px', color: C.textDim, letterSpacing: '0.08em' }}>LADE PRODUKTE…</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Bild', 'Name', 'Marke', 'Lief.-SKU', 'Preis', 'Bestand', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: '10px', letterSpacing: '0.08em', color: C.textDim, textAlign: 'left', fontWeight: 400, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.bgCard)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '10px 16px', width: '48px' }}>
                    {p.image
                      ? <img src={p.image} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', border: `1px solid ${C.border}` }} />
                      : <div style={{ width: '40px', height: '40px', background: C.bgCard, border: `1px solid ${C.border}` }} />
                    }
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '12px', color: C.text, maxWidth: '200px' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '11px', color: C.textMid }}>{p.brand}</td>
                  <td style={{ padding: '10px 16px', fontSize: '11px', color: C.textDim, fontFamily: 'monospace' }}>
                    {(p as any).supplier_sku ?? '—'}
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '12px', color: C.text, whiteSpace: 'nowrap' }}>€{p.price.toFixed(2)}</td>
                  <td style={{ padding: '10px 16px', fontSize: '12px', color: p.stock === 0 ? C.accent : C.textMid }}>
                    {p.stock === 0 ? 'Ausverkauft' : p.stock}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    {p.badge && (
                      <span style={{ fontSize: '10px', letterSpacing: '0.06em', padding: '3px 8px', border: `1px solid ${C.border}`, color: C.textDim }}>
                        {p.badge}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => { setEditProd(p); setModalOpen(true) }}
                        style={{ background: 'none', border: `1px solid ${C.border}`, color: C.textMid, cursor: 'pointer', fontSize: '11px', letterSpacing: '0.06em', padding: '5px 12px', fontFamily: 'inherit' }}
                      >BEARBEITEN</button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                        style={{ background: 'none', border: `1px solid ${C.accentDim}`, color: C.accent, cursor: 'pointer', fontSize: '11px', letterSpacing: '0.06em', padding: '5px 12px', fontFamily: 'inherit' }}
                      >{deleting === p.id ? '…' : 'LÖSCHEN'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: '40px', fontSize: '12px', color: C.textDim, textAlign: 'center' }}>Keine Produkte gefunden.</div>
          )}
        </div>
      )}

      {modalOpen && (
        <ProductFormModal
          product={editProd as Product | null}
          onSave={() => { setModalOpen(false); loadProducts() }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}

// ── Orders tab ────────────────────────────────────────────────────────────────

function OrdersTab() {
  const { orders, loading, error, updateStatus, refetch } = useAllOrders()
  const [search,      setSearch]      = useState('')
  const [filter,      setFilter]      = useState<OrderStatus | 'all'>('all')
  const [expanded,    setExpanded]    = useState<string | null>(null)
  const [updating,    setUpdating]    = useState<string | null>(null)
  const [updateErr,   setUpdateErr]   = useState<string | null>(null)
  const [refunding,   setRefunding]   = useState<string | null>(null)
  const [refundErr,   setRefundErr]   = useState<string | null>(null)
  // orderId → tracking number being entered before confirming 'shipped'
  const [shipModal,   setShipModal]   = useState<Record<string, string>>({})

  const handleStatusChange = async (orderId: string, status: string, trackingNumber?: string) => {
    setUpdating(orderId)
    setUpdateErr(null)
    const err = await updateStatus(orderId, status, trackingNumber)
    if (err) setUpdateErr(err)
    setUpdating(null)
  }

  const handleSelectChange = (orderId: string, newStatus: string) => {
    if (newStatus === 'shipped') {
      // Open tracking input instead of immediately updating
      setShipModal(prev => ({ ...prev, [orderId]: '' }))
    } else {
      handleStatusChange(orderId, newStatus)
    }
  }

  const confirmShip = async (orderId: string) => {
    const tracking = shipModal[orderId] ?? ''
    setShipModal(prev => { const n = { ...prev }; delete n[orderId]; return n })
    await handleStatusChange(orderId, 'shipped', tracking || undefined)
  }

  const handleRefund = async (orderId: string) => {
    if (!confirm('Bestellung wirklich vollständig zurückerstatten?')) return
    setRefunding(orderId)
    setRefundErr(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) { setRefundErr('Nicht angemeldet'); setRefunding(null); return }
      const res  = await fetch('/api/refund-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ orderId }),
      })
      const json = await res.json()
      if (!res.ok) setRefundErr(json.error ?? 'Fehler')
      else refetch()
    } catch {
      setRefundErr('Netzwerkfehler')
    }
    setRefunding(null)
  }

  const filtered = orders.filter(o => {
    const matchStatus = filter === 'all' || o.status === filter
    const matchSearch = !search || o.id.includes(search) || (o.email ?? '').toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '28px 40px', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Bestell-ID oder E-Mail…"
          style={{
            background: C.bgCard, border: `1px solid ${C.border}`, color: C.text,
            padding: '9px 14px', fontSize: '12px', fontFamily: 'inherit', outline: 'none',
            width: '240px',
          }}
          onFocus={e => { e.target.style.borderColor = C.accent }}
          onBlur={e => { e.target.style.borderColor = C.border }}
        />
        <select
          value={filter} onChange={e => setFilter(e.target.value as any)}
          style={{
            background: C.bgCard, border: `1px solid ${C.border}`, color: C.text,
            padding: '9px 14px', fontSize: '12px', fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="all">Alle Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <button
          onClick={refetch}
          style={{ background: 'none', border: `1px solid ${C.border}`, color: C.textMid, cursor: 'pointer', fontSize: '11px', letterSpacing: '0.06em', padding: '9px 14px', fontFamily: 'inherit' }}
        >↺ AKTUALISIEREN</button>
        <div style={{ marginLeft: 'auto', fontSize: '12px', color: C.textDim }}>{filtered.length} Bestellungen</div>
      </div>

      {loading    && <div style={{ padding: '48px 40px', fontSize: '11px', color: C.textDim, letterSpacing: '0.08em' }}>LADE BESTELLUNGEN…</div>}
      {error      && <div style={{ padding: '24px 40px', fontSize: '12px', color: C.accent }}>{error}</div>}
      {updateErr  && <div style={{ padding: '12px 40px', fontSize: '11px', color: C.accent }}>Fehler: {updateErr}</div>}
      {refundErr  && <div style={{ padding: '12px 40px', fontSize: '11px', color: C.accent }}>Rückerstattungsfehler: {refundErr}</div>}

      {!loading && filtered.length === 0 && (
        <div style={{ padding: '48px 40px', fontSize: '12px', color: C.textDim, textAlign: 'center' }}>Keine Bestellungen gefunden.</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: C.border }}>
        {filtered.map(order => (
          <div key={order.id} style={{ background: C.bg }}>
            {/* Order row */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 40px', cursor: 'pointer', flexWrap: 'wrap' }}
              onClick={() => setExpanded(expanded === order.id ? null : order.id)}
            >
              <div style={{ flex: 1, minWidth: '180px' }}>
                <div style={{ fontSize: '12px', color: C.text, fontWeight: 600 }}>#{order.id.slice(0, 8).toUpperCase()}</div>
                <div style={{ fontSize: '11px', color: C.textDim, marginTop: '2px' }}>
                  {new Date(order.created_at).toLocaleDateString('de-DE')} · {order.email}
                </div>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: C.text, whiteSpace: 'nowrap' }}>
                €{order.total.toFixed(2)}
              </div>
              <div
                style={{
                  fontSize: '10px', letterSpacing: '0.08em', padding: '4px 10px',
                  border: `1px solid ${STATUS_COLORS[order.status]}`,
                  color: STATUS_COLORS[order.status], whiteSpace: 'nowrap',
                }}
              >
                {STATUS_LABELS[order.status]}
              </div>
              <select
                value={order.id in shipModal ? 'shipped' : order.status}
                onChange={e => { e.stopPropagation(); handleSelectChange(order.id, e.target.value) }}
                disabled={updating === order.id}
                onClick={e => e.stopPropagation()}
                style={{
                  background: C.bgCard, border: `1px solid ${C.border}`, color: C.text,
                  padding: '5px 8px', fontSize: '11px', fontFamily: 'inherit', outline: 'none',
                  cursor: 'pointer', opacity: updating === order.id ? 0.5 : 1,
                }}
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
              <div style={{ fontSize: '10px', color: C.textDim, userSelect: 'none' }}>
                {expanded === order.id ? '▲' : '▼'}
              </div>
            </div>

            {/* Tracking input modal (inline, shown when 'shipped' is selected) */}
            {order.id in shipModal && (
              <div
                style={{ padding: '0 40px 20px', display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: '220px' }}>
                  <span style={{ fontSize: '10px', letterSpacing: '0.08em', color: C.textDim, textTransform: 'uppercase' }}>
                    Sendungsnummer (optional)
                  </span>
                  <input
                    autoFocus
                    value={shipModal[order.id]}
                    onChange={e => setShipModal(prev => ({ ...prev, [order.id]: e.target.value }))}
                    placeholder="z.B. 00340434567894586865"
                    onKeyDown={e => { if (e.key === 'Enter') confirmShip(order.id) }}
                    style={{
                      background: C.bgCard, border: `1px solid ${C.accent}`, color: C.text,
                      padding: '8px 10px', fontSize: '12px', fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => confirmShip(order.id)}
                    disabled={updating === order.id}
                    style={{
                      background: C.accent, border: 'none', color: C.white,
                      padding: '8px 20px', fontSize: '11px', letterSpacing: '0.08em', fontFamily: 'inherit',
                      cursor: 'pointer', opacity: updating === order.id ? 0.6 : 1,
                    }}
                  >{updating === order.id ? 'VERARBEITE…' : 'VERSENDEN + E-MAIL'}</button>
                  <button
                    onClick={() => setShipModal(prev => { const n = { ...prev }; delete n[order.id]; return n })}
                    style={{
                      background: 'none', border: `1px solid ${C.border}`, color: C.textDim,
                      padding: '8px 14px', fontSize: '11px', letterSpacing: '0.06em', fontFamily: 'inherit', cursor: 'pointer',
                    }}
                  >ABBRECHEN</button>
                </div>
              </div>
            )}

            {/* Expanded details */}
            {expanded === order.id && (
              <div style={{ padding: '0 40px 20px', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                {/* Items */}
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ fontSize: '10px', letterSpacing: '0.08em', color: C.textDim, textTransform: 'uppercase', marginBottom: '12px' }}>Artikel</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {order.order_items.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: C.textMid }}>
                        <span style={{ color: C.text }}>
                          {item.qty > 1 && <span style={{ color: C.textDim, marginRight: '6px' }}>×{item.qty}</span>}
                          {item.name}
                        </span>
                        <span>€{(item.price * item.qty).toFixed(2)}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: C.textDim }}>
                      <span>Versand</span>
                      <span>{order.shipping_cost === 0 ? 'Kostenlos' : `€${order.shipping_cost.toFixed(2)}`}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: C.text, fontWeight: 600 }}>
                      <span>Gesamt</span>
                      <span>€{order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping address */}
                {order.shipping_address && (
                  <div>
                    <div style={{ fontSize: '10px', letterSpacing: '0.08em', color: C.textDim, textTransform: 'uppercase', marginBottom: '12px' }}>Lieferadresse</div>
                    <div style={{ fontSize: '12px', color: C.textMid, lineHeight: 1.8 }}>
                      {[order.shipping_address.firstName, order.shipping_address.lastName].filter(Boolean).join(' ')}<br />
                      {order.shipping_address.street}<br />
                      {order.shipping_address.zip} {order.shipping_address.city}<br />
                      {order.shipping_address.country}
                    </div>
                  </div>
                )}

                {/* Tracking number */}
                {order.tracking_number && (() => {
                  const url     = trackingUrl(order.tracking_number)
                  const carrier = detectCarrier(order.tracking_number)
                  return (
                    <div>
                      <div style={{ fontSize: '10px', letterSpacing: '0.08em', color: C.textDim, textTransform: 'uppercase', marginBottom: '8px' }}>
                        Sendungsnummer{carrier ? ` · ${carrier}` : ''}
                      </div>
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: '13px', color: C.accent, fontFamily: 'monospace', letterSpacing: '0.06em', textDecoration: 'none' }}>
                          {order.tracking_number} →
                        </a>
                      ) : (
                        <div style={{ fontSize: '13px', color: C.text, fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                          {order.tracking_number}
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Stripe PI + refund */}
                {order.stripe_payment_intent_id && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '10px', letterSpacing: '0.08em', color: C.textDim, textTransform: 'uppercase', marginBottom: '8px' }}>Stripe</div>
                      <div style={{ fontSize: '11px', color: C.textDim, fontFamily: 'monospace' }}>{order.stripe_payment_intent_id}</div>
                    </div>
                    {order.status !== 'cancelled' && (
                      <button
                        onClick={e => { e.stopPropagation(); handleRefund(order.id) }}
                        disabled={refunding === order.id}
                        style={{
                          background: 'none',
                          border: `1px solid ${C.accentDim}`,
                          color: C.accent,
                          padding: '7px 16px',
                          fontSize: '11px', letterSpacing: '0.08em', fontFamily: 'inherit',
                          cursor: refunding === order.id ? 'not-allowed' : 'pointer',
                          opacity: refunding === order.id ? 0.6 : 1,
                          alignSelf: 'flex-start',
                        }}
                      >
                        {refunding === order.id ? 'RÜCKERSTATTEN…' : '↩ VOLLSTÄNDIG RÜCKERSTATTEN'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Dashboard tab ─────────────────────────────────────────────────────────────

interface DashStats {
  revenueToday:   number
  revenueWeek:    number
  revenueMonth:   number
  revenueTotal:   number
  ordersTotal:    number
  ordersPending:  number
  ordersShipped:  number
  lowStock:       { id: string; name: string; stock: number }[]
  topProducts:    { name: string; units: number; revenue: number }[]
}

function StatCard({ label, value, sub, accent = false }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div style={{
      background: C.bgCard, border: `1px solid ${C.border}`,
      padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '6px',
    }}>
      <div style={{ fontSize: '10px', letterSpacing: '0.12em', color: C.textDim, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: accent ? C.accent : C.text, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: C.textDim }}>{sub}</div>}
    </div>
  )
}

function DashboardTab() {
  const [stats,   setStats]   = useState<DashStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)

      const now   = new Date()
      const sod   = new Date(now); sod.setHours(0,0,0,0)   // start of today
      const sow   = new Date(now); sow.setDate(now.getDate() - now.getDay()); sow.setHours(0,0,0,0)
      const som   = new Date(now.getFullYear(), now.getMonth(), 1)

      // All paid/shipped/delivered orders
      const { data: orders, error: oErr } = await supabase
        .from('orders')
        .select('id, status, total, created_at')
        .in('status', ['paid', 'shipped', 'delivered'])
        .order('created_at', { ascending: false })

      // All order_items for top products
      const { data: items, error: iErr } = await supabase
        .from('order_items')
        .select('name, qty, price')

      // Low stock products
      const { data: lowStockRows, error: lErr } = await supabase
        .from('products')
        .select('id, name, stock')
        .lte('stock', 5)
        .order('stock', { ascending: true })
        .limit(8)

      if (oErr || iErr || lErr || !orders || !items) {
        if (!cancelled) setError(oErr?.message ?? iErr?.message ?? lErr?.message ?? 'Fehler')
        if (!cancelled) setLoading(false)
        return
      }

      const sum = (rows: typeof orders, from: Date) =>
        rows.filter(o => new Date(o.created_at) >= from).reduce((a, o) => a + Number(o.total), 0)

      // Top products
      const agg: Record<string, { units: number; revenue: number }> = {}
      for (const item of items as { name: string; qty: number; price: number }[]) {
        if (!agg[item.name]) agg[item.name] = { units: 0, revenue: 0 }
        agg[item.name].units   += item.qty
        agg[item.name].revenue += item.qty * item.price
      }
      const topProducts = Object.entries(agg)
        .sort((a, b) => b[1].units - a[1].units)
        .slice(0, 5)
        .map(([name, v]) => ({ name, ...v }))

      if (!cancelled) {
        setStats({
          revenueToday:  sum(orders, sod),
          revenueWeek:   sum(orders, sow),
          revenueMonth:  sum(orders, som),
          revenueTotal:  orders.reduce((a, o) => a + Number(o.total), 0),
          ordersTotal:   orders.length,
          ordersPending: orders.filter(o => o.status === 'paid').length,
          ordersShipped: orders.filter(o => o.status === 'shipped').length,
          lowStock:      (lowStockRows ?? []) as { id: string; name: string; stock: number }[],
          topProducts,
        })
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) return (
    <div style={{ padding: '64px 40px', fontSize: '11px', color: C.textDim, letterSpacing: '0.08em' }}>LADE DASHBOARD…</div>
  )
  if (error || !stats) return (
    <div style={{ padding: '40px', fontSize: '12px', color: C.accent }}>{error ?? 'Fehler'}</div>
  )

  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '40px' }}>

      {/* ── Revenue ── */}
      <section>
        <div style={{ fontSize: '10px', letterSpacing: '0.14em', color: C.textDim, marginBottom: '16px', textTransform: 'uppercase' }}>Umsatz</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1px', background: C.border }}>
          <StatCard label="Heute"        value={`€${stats.revenueToday.toFixed(2)}`}  />
          <StatCard label="Diese Woche"  value={`€${stats.revenueWeek.toFixed(2)}`}   />
          <StatCard label="Dieser Monat" value={`€${stats.revenueMonth.toFixed(2)}`}  />
          <StatCard label="Gesamt"       value={`€${stats.revenueTotal.toFixed(2)}`} accent />
        </div>
      </section>

      {/* ── Orders ── */}
      <section>
        <div style={{ fontSize: '10px', letterSpacing: '0.14em', color: C.textDim, marginBottom: '16px', textTransform: 'uppercase' }}>Bestellungen</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1px', background: C.border }}>
          <StatCard label="Gesamt (bezahlt)"  value={String(stats.ordersTotal)}   />
          <StatCard label="Offen (zu versenden)" value={String(stats.ordersPending)} accent={stats.ordersPending > 0} />
          <StatCard label="Versendet"         value={String(stats.ordersShipped)} />
        </div>
      </section>

      {/* ── Top products + Low stock (side by side) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>

        {/* Top products */}
        <section>
          <div style={{ fontSize: '10px', letterSpacing: '0.14em', color: C.textDim, marginBottom: '16px', textTransform: 'uppercase' }}>Top-Produkte (nach Verkäufen)</div>
          {stats.topProducts.length === 0 ? (
            <div style={{ fontSize: '12px', color: C.textDim }}>Noch keine Verkäufe.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: C.border }}>
              {stats.topProducts.map((p, i) => (
                <div key={p.name} style={{ background: C.bgCard, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <span style={{ fontSize: '11px', color: C.textDim, width: '16px', flexShrink: 0 }}>#{i + 1}</span>
                    <span style={{ fontSize: '12px', color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', color: C.textDim }}>{p.units}×</span>
                    <span style={{ fontSize: '12px', color: C.text, fontWeight: 600 }}>€{p.revenue.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Low stock */}
        <section>
          <div style={{ fontSize: '10px', letterSpacing: '0.14em', color: C.textDim, marginBottom: '16px', textTransform: 'uppercase' }}>Niedriger Bestand (≤ 5)</div>
          {stats.lowStock.length === 0 ? (
            <div style={{ fontSize: '12px', color: C.textDim }}>Alle Produkte gut bevorratet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: C.border }}>
              {stats.lowStock.map(p => (
                <div key={p.id} style={{ background: C.bgCard, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em',
                    color: p.stock === 0 ? C.accent : '#c97c30',
                    flexShrink: 0,
                  }}>
                    {p.stock === 0 ? 'AUSVERKAUFT' : `${p.stock} übrig`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

    </div>
  )
}

// ── Main Admin page ───────────────────────────────────────────────────────────

type AdminSection = 'dashboard' | 'products' | 'orders'

interface Props {
  onNavigate: (page: Page) => void
}

export default function Admin({ onNavigate }: Props) {
  const { user } = useAuth()
  const [section, setSection] = useState<AdminSection>('dashboard')

  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: '20px', borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontSize: '12px', color: C.textDim, letterSpacing: '0.1em' }}>NICHT ANGEMELDET</div>
        <Btn variant="outline" onClick={() => onNavigate('home')}>ZUR STARTSEITE</Btn>
      </div>
    )
  }

  if (!user.isAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: '20px', borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontSize: '12px', color: C.accent, letterSpacing: '0.1em' }}>ZUGRIFF VERWEIGERT</div>
        <div style={{ fontSize: '12px', color: C.textDim }}>Du hast keine Adminrechte.</div>
        <Btn variant="outline" onClick={() => onNavigate('home')}>ZUR STARTSEITE</Btn>
      </div>
    )
  }

  return (
    <div style={{ borderTop: `1px solid ${C.border}`, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ padding: '32px 40px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Tag>Admin</Tag>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: C.text, margin: 0 }}>CMS &amp; Bestellungen</h1>
        </div>
        <button
          onClick={() => onNavigate('home')}
          style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', fontSize: '11px', letterSpacing: '0.08em', fontFamily: 'inherit' }}
        >← ZURÜCK ZUR SEITE</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, padding: '0 40px' }}>
        {(['dashboard', 'products', 'orders'] as AdminSection[]).map(s => (
          <button
            key={s}
            onClick={() => setSection(s)}
            style={{
              background: 'none', border: 'none',
              borderBottom: `2px solid ${section === s ? C.accent : 'transparent'}`,
              padding: '14px 24px', fontSize: '11px', letterSpacing: '0.1em', fontFamily: 'inherit',
              color: section === s ? C.text : C.textDim, cursor: 'pointer',
              textTransform: 'uppercase', position: 'relative', top: '1px',
            }}
          >
            {s === 'dashboard' ? 'DASHBOARD' : s === 'products' ? 'PRODUKTE' : 'BESTELLUNGEN'}
          </button>
        ))}
      </div>

      {section === 'dashboard' && <DashboardTab />}
      {section === 'products'  && <ProductsTab />}
      {section === 'orders'    && <OrdersTab />}
    </div>
  )
}
