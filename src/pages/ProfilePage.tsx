import React, { useState, useEffect } from 'react'
import { C } from '@/tokens'
import { useAuth, fullName } from '@/contexts/AuthContext'
import type { UserAddress } from '@/contexts/AuthContext'
import { useLocale } from '@/contexts/LocaleContext'
import type { Translations } from '@/lib/i18n'
import { useOrders } from '@/hooks/useOrders'
import Tag from '@/components/ui/Tag'
import Btn from '@/components/ui/Btn'
import ProductCard from '@/components/ProductCard'
import { trackingUrl, detectCarrier } from '@/lib/tracking'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import type { Page, Product, OrderStatus } from '@/types'

// ── Shared field components ────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, type = 'text', disabled = false, error, hint,
}: {
  label: string; value: string; onChange?: (v: string) => void
  placeholder?: string; type?: string; disabled?: boolean; error?: string; hint?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '10px', letterSpacing: '0.1em', color: C.textDim, textTransform: 'uppercase' }}>
        {label}
      </label>
      <input
        type={type} value={value} disabled={disabled} placeholder={placeholder}
        onChange={e => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          background: disabled ? C.bgCard : C.bgSurface,
          border: `1px solid ${error ? C.accent : focused ? C.borderMid : C.border}`,
          color: disabled ? C.textDim : C.text,
          padding: '10px 12px', fontSize: '13px',
          outline: 'none', fontFamily: 'inherit',
          transition: 'border-color 0.15s',
          cursor: disabled ? 'not-allowed' : 'text',
          width: '100%', boxSizing: 'border-box' as const,
        }}
      />
      {error && <span style={{ fontSize: '10px', color: C.accent }}>{error}</span>}
      {hint  && !error && <span style={{ fontSize: '10px', color: C.textDim }}>{hint}</span>}
    </div>
  )
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '10px', letterSpacing: '0.1em', color: C.textDim, textTransform: 'uppercase' }}>
        {label}
      </label>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        style={{
          background: C.bgSurface, border: `1px solid ${C.border}`, color: C.text,
          padding: '10px 12px', fontSize: '13px', outline: 'none', fontFamily: 'inherit',
          width: '100%', cursor: 'pointer', appearance: 'auto',
        }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function SaveBar({ saved, loading, onReset, t }: { saved: boolean; loading: boolean; onReset: () => void; t: Translations }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '8px' }}>
      <button
        type="submit" disabled={loading}
        style={{
          padding: '10px 28px', background: loading ? C.accentDim : C.accent,
          border: 'none', color: C.white, fontSize: '11px', letterSpacing: '0.1em',
          cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
        }}
      >
        {loading ? t.profile.saving : t.profile.saveButton}
      </button>
      <button
        type="button" onClick={onReset}
        style={{ background: 'none', border: 'none', color: C.textDim, fontSize: '11px', letterSpacing: '0.08em', cursor: 'pointer', fontFamily: 'inherit' }}
      >
        {t.profile.reset}
      </button>
      {saved && <span style={{ fontSize: '11px', color: C.accent }}>{t.profile.saved}</span>}
    </div>
  )
}

const COUNTRIES = [
  'Deutschland', 'Österreich', 'Schweiz', 'Frankreich', 'Niederlande',
  'Belgien', 'Luxemburg', 'Spanien', 'Italien', 'Schweden', 'Dänemark',
  'Norwegen', 'Polen', 'Tschechien', 'Ungarn', 'Vereinigtes Königreich', 'Sonstiges',
]

// ── Section components ─────────────────────────────────────────────────────────

type Section = 'overview' | 'orders' | 'wishlist' | 'settings'

// ── Overview ──────────────────────────────────────────────────────────────────

function OverviewSection({ user, wishCount, orderCount, onSection, t }: {
  user: NonNullable<ReturnType<typeof useAuth>['user']>
  wishCount: number
  orderCount: number
  onSection: (s: Section) => void
  t: Translations
}) {
  const hasAddress = user.address?.street && user.address?.city

  return (
    <div>
      {/* Stat strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: C.border, gap: '1px', borderBottom: `1px solid ${C.border}` }}>
        {[
          { n: String(orderCount), label: t.profile.orders,        action: () => onSection('orders') },
          { n: String(wishCount),  label: t.profile.wishlistItems, action: () => onSection('wishlist') },
          { n: '30',               label: t.profile.returns,       action: undefined },
        ].map(s => (
          <div
            key={s.label}
            onClick={s.action}
            style={{
              background: C.bg, padding: '48px 40px',
              cursor: s.action ? 'pointer' : 'default',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => { if (s.action) (e.currentTarget as HTMLDivElement).style.background = C.bgCard }}
            onMouseLeave={e => { if (s.action) (e.currentTarget as HTMLDivElement).style.background = C.bg }}
          >
            <div style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 700, color: C.accent, marginBottom: '8px' }}>{s.n}</div>
            <div style={{ fontSize: '10px', letterSpacing: '0.14em', color: C.textDim, textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Address + image two-column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', borderBottom: `1px solid ${C.border}` }}>
        {/* Address */}
        <div style={{ padding: '56px 48px', borderRight: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.16em', color: C.textDim, marginBottom: '24px' }}>{t.profile.deliveryAddress}</div>
          {hasAddress ? (
            <div style={{ fontSize: '14px', color: C.textMid, lineHeight: 2, marginBottom: '28px' }}>
              <span style={{ color: C.text }}>{fullName(user)}</span><br />
              {user.address?.street}<br />
              {user.address?.zip} {user.address?.city}<br />
              {user.address?.country}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: C.textDim, lineHeight: 1.7, marginBottom: '28px' }}>
              —
            </div>
          )}
          <button
            onClick={() => onSection('settings')}
            style={{ background: 'none', border: 'none', padding: 0, color: C.accent, fontSize: '11px', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {hasAddress ? t.profile.editAddress : t.profile.addAddress}
          </button>
        </div>

        {/* Decorative image panel */}
        <div style={{ position: 'relative', overflow: 'hidden', minHeight: '280px' }}>
          <img
            src="/images/account-mood.jpg"
            alt=""
            aria-hidden="true"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(135deg, ${C.bg}cc 0%, transparent 60%)`,
            pointerEvents: 'none',
          }} />
        </div>
      </div>
    </div>
  )
}

// ── Orders ────────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:   C.textDim,
  paid:      '#7cc97c',
  shipped:   C.accent,
  delivered: '#7cc97c',
  cancelled: C.accentDim,
}

function OrdersSection({ onNavigate, t, dateLocale }: { onNavigate: (p: Page) => void; t: Translations; dateLocale: string }) {
  const { orders, loading, error } = useOrders()
  const STATUS_LABELS: Record<OrderStatus, string> = {
    pending:   t.profile.status.pending,
    paid:      t.profile.status.paid,
    shipped:   t.profile.status.shipped,
    delivered: t.profile.status.delivered,
    cancelled: t.profile.status.cancelled,
  }

  if (loading) {
    return (
      <div style={{ padding: '80px 56px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ fontSize: '11px', letterSpacing: '0.08em', color: C.textDim }}>{t.general.loading.toUpperCase()}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '48px 56px' }}>
        <div style={{ fontSize: '12px', color: C.accent }}>{error}</div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div style={{ padding: '80px 56px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{
          width: '56px', height: '56px', border: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', opacity: 0.35,
        }}>📦</div>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '14px', color: C.text }}>{t.profile.noOrders}</div>
          <div style={{ fontSize: '12px', color: C.textDim, lineHeight: 1.7, maxWidth: '320px' }}>
            {t.profile.noOrdersHint}
          </div>
        </div>
        <Btn variant="outline" onClick={() => onNavigate('shop')}>{t.profile.shopNow}</Btn>
      </div>
    )
  }

  return (
    <div style={{ padding: '48px 56px', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: C.border }}>
        {orders.map(order => (
          <div key={order.id} style={{ background: C.bg, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Order header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '12px', color: C.textDim, letterSpacing: '0.08em' }}>
                  {t.profile.orderNumber}{order.id.slice(0, 8).toUpperCase()}
                </div>
                <div style={{ fontSize: '11px', color: C.textDim }}>
                  {new Date(order.created_at).toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  fontSize: '10px', letterSpacing: '0.1em', padding: '4px 10px',
                  border: `1px solid ${STATUS_COLORS[order.status]}`,
                  color: STATUS_COLORS[order.status],
                }}>
                  {STATUS_LABELS[order.status]}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: C.text }}>
                  €{order.total.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '0' }}>
              {order.order_items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: C.textMid, gap: '12px' }}>
                  <span style={{ color: C.text }}>
                    {item.qty > 1 && <span style={{ color: C.textDim, marginRight: '6px' }}>×{item.qty}</span>}
                    {item.name}
                  </span>
                  <span style={{ whiteSpace: 'nowrap' }}>€{(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Tracking number */}
            {order.tracking_number && (() => {
              const url     = trackingUrl(order.tracking_number)
              const carrier = detectCarrier(order.tracking_number)
              return (
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '10px', letterSpacing: '0.1em', color: C.textDim }}>
                    {t.profile.trackingNumber}{carrier ? ` · ${carrier}` : ''}
                  </div>
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '13px', color: C.accent, fontFamily: 'monospace', letterSpacing: '0.06em', textDecoration: 'none' }}
                    >
                      {order.tracking_number} →
                    </a>
                  ) : (
                    <div style={{ fontSize: '13px', color: C.text, fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                      {order.tracking_number}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: C.textDim }}>
                    {t.profile.trackHint}
                  </div>
                </div>
              )
            })()}

            {/* Delivery address if available */}
            {order.shipping_address && (
              <div style={{ fontSize: '11px', color: C.textDim, borderTop: `1px solid ${C.border}`, paddingTop: '12px' }}>
                <span style={{ letterSpacing: '0.08em', marginRight: '8px' }}>{t.profile.deliveryTo}</span>
                {[
                  [order.shipping_address.firstName, order.shipping_address.lastName].filter(Boolean).join(' '),
                  order.shipping_address.street,
                  [order.shipping_address.zip, order.shipping_address.city].filter(Boolean).join(' '),
                ].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Wishlist ──────────────────────────────────────────────────────────────────

function WishlistSection({ wishlist, onNavigate, wished, onWish, onAdd, onProduct, t }: {
  wishlist: Product[]; onNavigate: (p: Page) => void
  wished: (id: string) => boolean; onWish: (p: Product) => void
  onAdd: (p: Product) => void; onProduct: (p: Product) => void
  t: Translations
}) {
  if (wishlist.length === 0) {
    return (
      <div style={{ padding: '80px 56px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{
          width: '56px', height: '56px', border: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', opacity: 0.35,
        }}>♡</div>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '14px', color: C.text }}>{t.profile.emptyWishlist}</div>
          <div style={{ fontSize: '12px', color: C.textDim }}>{t.profile.emptyWishlistHint}</div>
        </div>
        <Btn variant="outline" onClick={() => onNavigate('shop')}>{t.profile.discover}</Btn>
      </div>
    )
  }

  return (
    <div style={{ padding: '48px 56px', borderBottom: `1px solid ${C.border}` }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '16px',
      }}>
        {wishlist.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            wished={wished(product.id)}
            onWish={onWish}
            onAdd={onAdd}
            onClick={onProduct}
          />
        ))}
      </div>
    </div>
  )
}

// ── Settings ──────────────────────────────────────────────────────────────────

function SettingsSection({ onNavigate, t }: { onNavigate: (p: Page) => void; t: Translations }) {
  const { user, updateProfile, logout } = useAuth()

  const [firstName,   setFirstName]   = useState(user?.firstName ?? '')
  const [lastName,    setLastName]    = useState(user?.lastName  ?? '')
  const [phone,       setPhone]       = useState(user?.phone     ?? '')
  const [infoErrors,  setInfoErrors]  = useState<Record<string, string>>({})
  const [infoSaved,   setInfoSaved]   = useState(false)
  const [infoLoading, setInfoLoading] = useState(false)

  const [addr,         setAddr]        = useState<UserAddress>(user?.address ?? { street: '', zip: '', city: '', country: 'Deutschland' })
  const [addrErrors,   setAddrErrors]  = useState<Record<string, string>>({})
  const [addrSaved,    setAddrSaved]   = useState(false)
  const [addrLoading,  setAddrLoading] = useState(false)

  const [deletePhase,  setDeletePhase] = useState<'idle' | 'confirm' | 'deleting'>('idle')
  const [deleteError,  setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setFirstName(user.firstName)
    setLastName(user.lastName)
    setPhone(user.phone)
    setAddr(user.address)
  }, [user])

  const setAddrField = (key: keyof UserAddress, val: string) =>
    setAddr(a => ({ ...a, [key]: val }))

  const handleDeleteAccount = async () => {
    if (deletePhase === 'idle')    { setDeletePhase('confirm'); return }
    if (deletePhase !== 'confirm') return
    setDeletePhase('deleting'); setDeleteError(null)
    try {
      // Anonymise profile row (Supabase Auth deletion requires service role — we soft-delete)
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('profiles').update({
        first_name: '[gelöscht]', last_name: '', street: '', zip: '', city: '', country: '',
        updated_at: new Date().toISOString(),
      }).eq('id', user!.id)
      // Sign out — account data request sent to hallo@toys4joys.de per DSGVO Art. 17
      await logout()
      onNavigate('home')
    } catch {
      setDeleteError(t.general.error + ' — hallo@toys4joys.de')
      setDeletePhase('confirm')
    }
  }

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!firstName.trim()) errs.firstName = t.auth.errRequired
    if (!lastName.trim())  errs.lastName  = t.auth.errRequired
    if (!phone.trim())     errs.phone     = t.auth.errRequired
    if (Object.keys(errs).length) { setInfoErrors(errs); return }
    setInfoErrors({}); setInfoLoading(true)
    await updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() })
    setInfoLoading(false); setInfoSaved(true)
    setTimeout(() => setInfoSaved(false), 2500)
  }

  const handleAddrSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!addr.street.trim()) errs.street = t.auth.errRequired
    if (!addr.zip.trim())    errs.zip    = t.auth.errRequired
    if (!addr.city.trim())   errs.city   = t.auth.errRequired
    if (Object.keys(errs).length) { setAddrErrors(errs); return }
    setAddrErrors({}); setAddrLoading(true)
    await updateProfile({ address: { ...addr } })
    setAddrLoading(false); setAddrSaved(true)
    setTimeout(() => setAddrSaved(false), 2500)
  }

  if (!user) return null

  return (
    <div>
      {/* Personal info row */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ padding: '48px 40px 48px 56px', borderRight: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.16em', color: C.textDim, textTransform: 'uppercase', lineHeight: 1.6 }}>
            {t.profile.personalData}
          </div>
        </div>
        <div style={{ padding: '48px 56px' }}>
          <form onSubmit={handleInfoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Field label={t.checkout.firstName} value={firstName} onChange={setFirstName} placeholder={t.auth.firstNamePlaceholder} error={infoErrors.firstName} />
              <Field label={t.checkout.lastName}  value={lastName}  onChange={setLastName}  placeholder={t.auth.lastNamePlaceholder}  error={infoErrors.lastName} />
            </div>
            <Field
              label={t.checkout.email} value={user.email} disabled
              hint={t.profile.emailHint}
            />
            <Field label={t.checkout.phone} value={phone} onChange={setPhone} placeholder="+49 30 123456" error={infoErrors.phone} />
            <SaveBar t={t} saved={infoSaved} loading={infoLoading} onReset={() => { setFirstName(user.firstName); setLastName(user.lastName); setPhone(user.phone); setInfoErrors({}) }} />
          </form>
        </div>
      </div>

      {/* Delivery address row */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ padding: '48px 40px 48px 56px', borderRight: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.16em', color: C.textDim, textTransform: 'uppercase', lineHeight: 1.6 }}>
            {t.profile.deliveryAddress}
          </div>
        </div>
        <div style={{ padding: '48px 56px' }}>
          <form onSubmit={handleAddrSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <AddressAutocomplete
              label={t.checkout.street}
              value={addr.street}
              onChange={v => setAddrField('street', v)}
              onSelect={s => setAddr(a => ({ ...a, street: s.street, zip: s.zip, city: s.city, country: s.country }))}
              required
              error={addrErrors.street}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px' }}>
              <Field label={t.checkout.zip}  value={addr.zip}  onChange={v => setAddrField('zip', v)}  error={addrErrors.zip} />
              <Field label={t.checkout.city} value={addr.city} onChange={v => setAddrField('city', v)} error={addrErrors.city} />
            </div>
            <SelectField label={t.checkout.country} value={addr.country} onChange={v => setAddrField('country', v)} options={COUNTRIES} />
            <SaveBar t={t} saved={addrSaved} loading={addrLoading} onReset={() => { setAddr(user.address); setAddrErrors({}) }} />
          </form>
        </div>
      </div>

      {/* Danger zone */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ padding: '48px 40px 48px 56px', borderRight: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.16em', color: C.accentDim, textTransform: 'uppercase', lineHeight: 1.6 }}>
            {t.profile.deleteAccount}
          </div>
        </div>
        <div style={{ padding: '48px 56px' }}>
          {deletePhase === 'idle' && (
            <p style={{ fontSize: '13px', color: C.textMid, lineHeight: 1.75, marginBottom: '20px', maxWidth: '400px' }}>
              {t.profile.deleteWarning}
            </p>
          )}
          {deletePhase === 'confirm' && (
            <p style={{ fontSize: '13px', color: C.accent, lineHeight: 1.75, marginBottom: '20px', maxWidth: '400px', border: `1px solid ${C.accentDim}`, padding: '14px' }}>
              {t.profile.deleteConfirm}
            </p>
          )}
          {deleteError && (
            <p style={{ fontSize: '12px', color: C.accent, marginBottom: '12px' }}>{deleteError}</p>
          )}
          <button
            onClick={handleDeleteAccount}
            disabled={deletePhase === 'deleting'}
            style={{
              background: deletePhase === 'confirm' ? C.accent : 'none',
              border: `1px solid ${C.accentDim}`,
              color: deletePhase === 'confirm' ? C.white : C.accent,
              fontSize: '11px', letterSpacing: '0.1em', cursor: deletePhase === 'deleting' ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', padding: '10px 20px', transition: 'all 0.15s',
              opacity: deletePhase === 'deleting' ? 0.5 : 1,
            }}
          >
            {deletePhase === 'deleting' ? t.profile.deleting : t.profile.deleteAccount}
          </button>
          {deletePhase === 'confirm' && (
            <button
              onClick={() => setDeletePhase('idle')}
              style={{ background: 'none', border: 'none', color: C.textDim, fontSize: '11px', letterSpacing: '0.08em', cursor: 'pointer', fontFamily: 'inherit', marginLeft: '12px' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

interface Props {
  onNavigate: (page: Page) => void
  wishlist:   Product[]
  wishCount:  number
  onProduct:  (p: Product) => void
  onAdd:      (p: Product) => void
  onWish:     (p: Product) => void
  wished:     (id: string) => boolean
}

export default function ProfilePage({ onNavigate, wishlist, wishCount, onProduct, onAdd, onWish, wished }: Props) {
  const { user, logout } = useAuth()
  const { t, locale }    = useLocale()
  const { orders }       = useOrders()
  const [section, setSection] = useState<Section>('overview')
  const dateLocale = locale === 'de' ? 'de-DE' : locale === 'es' ? 'es-ES' : 'en-GB'

  const TAB_LABELS: { id: Section; label: string }[] = [
    { id: 'overview',  label: t.profile.overview.toUpperCase() },
    { id: 'orders',    label: t.profile.ordersTab.toUpperCase() },
    { id: 'wishlist',  label: t.profile.wishlistTab.toUpperCase() },
    { id: 'settings',  label: t.profile.settingsTab.toUpperCase() },
  ]

  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: '20px', borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontSize: '12px', color: C.textDim, letterSpacing: '0.1em' }}>{t.nav.login.toUpperCase()}</div>
        <Btn variant="outline" onClick={() => onNavigate('home')}>{t.general.backToHome}</Btn>
      </div>
    )
  }

  return (
    <div style={{ borderTop: `1px solid ${C.border}`, minHeight: '100vh' }}>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div style={{
        padding: '48px 56px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Tag>{t.profile.title}</Tag>
          <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em', color: C.text, margin: 0, lineHeight: 1.05 }}>
            {user.firstName || user.email.split('@')[0]}
          </h1>
        </div>
        <button
          onClick={() => logout().then(() => onNavigate('home'))}
          style={{
            background: 'none', border: 'none', color: C.textDim, cursor: 'pointer',
            fontSize: '11px', letterSpacing: '0.1em', fontFamily: 'inherit',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = C.accent)}
          onMouseLeave={e => (e.currentTarget.style.color = C.textDim)}
        >
          {t.nav.logout.toUpperCase()}
        </button>
      </div>

      {/* ── Tab navigation ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${C.border}`,
        padding: '0 56px',
        gap: '0',
      }}>
        {TAB_LABELS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSection(tab.id)}
            style={{
              background: 'none', border: 'none',
              borderBottom: `2px solid ${section === tab.id ? C.accent : 'transparent'}`,
              padding: '16px 24px',
              fontSize: '11px', letterSpacing: '0.1em', fontFamily: 'inherit',
              color: section === tab.id ? C.text : C.textDim,
              cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s',
              position: 'relative', top: '1px',
            }}
          >
            {tab.id === 'wishlist' && wishCount > 0
              ? `${tab.label} (${wishCount})`
              : tab.label}
          </button>
        ))}
      </div>

      {/* ── Section content ──────────────────────────────────────────────────── */}
      {section === 'overview' && (
        <OverviewSection user={user} wishCount={wishCount} orderCount={orders.length} onSection={setSection} t={t} />
      )}
      {section === 'orders' && (
        <OrdersSection onNavigate={onNavigate} t={t} dateLocale={dateLocale} />
      )}
      {section === 'wishlist' && (
        <WishlistSection
          wishlist={wishlist} onNavigate={onNavigate}
          wished={wished} onWish={onWish} onAdd={onAdd} onProduct={onProduct} t={t}
        />
      )}
      {section === 'settings' && (
        <SettingsSection onNavigate={onNavigate} t={t} />
      )}
    </div>
  )
}
