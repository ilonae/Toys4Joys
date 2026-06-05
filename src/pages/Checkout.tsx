import React, { useEffect, useState } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { stripePromise, API_BASE } from '@/lib/stripe'
import { C } from '@/tokens'
import { useAuth } from '@/contexts/AuthContext'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import type { CartItem, Page, ShippingAddress } from '@/types'
import Btn from '@/components/ui/Btn'
import Tag from '@/components/ui/Tag'

// ── Shared field component ─────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, required, type = 'text', error,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; required?: boolean; type?: string; error?: string
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontSize: '10px', letterSpacing: '0.1em', color: C.textMid, textTransform: 'uppercase' }}>
        {label}{required && <span style={{ color: C.accent, marginLeft: '2px' }}>*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{
          background: C.bgCard,
          border: `1px solid ${error ? C.accent : C.border}`,
          color: C.text,
          padding: '10px 12px',
          fontSize: '13px',
          fontFamily: 'inherit',
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
        }}
        onFocus={e => { e.target.style.borderColor = C.accent }}
        onBlur={e => { e.target.style.borderColor = error ? C.accent : C.border }}
      />
      {error && <span style={{ fontSize: '10px', color: C.accent }}>{error}</span>}
    </label>
  )
}

// ── Step 1: Address ────────────────────────────────────────────────────────

function AddressStep({
  onConfirm,
  initial,
}: {
  onConfirm: (addr: ShippingAddress) => void
  initial: Partial<ShippingAddress>
}) {
  const [firstName, setFirstName] = useState(initial.firstName ?? '')
  const [lastName,  setLastName]  = useState(initial.lastName  ?? '')
  const [email,     setEmail]     = useState(initial.email     ?? '')
  const [phone,     setPhone]     = useState(initial.phone     ?? '')
  const [street,    setStreet]    = useState(initial.street    ?? '')
  const [zip,       setZip]       = useState(initial.zip       ?? '')
  const [city,      setCity]      = useState(initial.city      ?? '')
  const [country,   setCountry]   = useState(initial.country   ?? 'Deutschland')
  const [errs,      setErrs]      = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const e2: Record<string, string> = {}
    if (!firstName.trim())       e2.firstName = 'Pflichtfeld'
    if (!lastName.trim())        e2.lastName  = 'Pflichtfeld'
    if (!email.includes('@'))    e2.email     = 'Gültige E-Mail erforderlich'
    if (!phone.trim())           e2.phone     = 'Pflichtfeld'
    if (!street.trim())          e2.street    = 'Pflichtfeld'
    if (!zip.trim())             e2.zip       = 'Pflichtfeld'
    if (!city.trim())            e2.city      = 'Pflichtfeld'
    if (!country.trim())         e2.country   = 'Pflichtfeld'
    if (Object.keys(e2).length) { setErrs(e2); return }
    setErrs({})
    onConfirm({ firstName, lastName, email, phone, street, zip, city, country })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Vorname" value={firstName} onChange={setFirstName} placeholder="Anna"   required error={errs.firstName} />
        <Field label="Nachname" value={lastName} onChange={setLastName}  placeholder="Müller" required error={errs.lastName} />
      </div>
      <Field label="E-Mail" value={email} onChange={setEmail} placeholder="anna@example.com" required type="email" error={errs.email} />
      <Field label="Telefon" value={phone} onChange={setPhone} placeholder="+49 30 123456" required type="tel" error={errs.phone} />
      <AddressAutocomplete
        label="Straße & Hausnummer"
        value={street}
        onChange={setStreet}
        onSelect={s => { setStreet(s.street); setZip(s.zip); setCity(s.city); setCountry(s.country) }}
        placeholder="Musterstraße 1"
        required
        error={errs.street}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px' }}>
        <Field label="PLZ"   value={zip}  onChange={setZip}  placeholder="10115"  required error={errs.zip} />
        <Field label="Stadt" value={city} onChange={setCity} placeholder="Berlin" required error={errs.city} />
      </div>
      <Field label="Land" value={country} onChange={setCountry} placeholder="Deutschland" required error={errs.country} />

      {Object.keys(errs).length > 0 && (
        <div style={{ fontSize: '12px', color: C.accent, padding: '10px', border: `1px solid ${C.accentDim}`, background: C.bgCard }}>
          Bitte fülle alle Pflichtfelder aus.
        </div>
      )}

      <Btn type="submit" style={{ width: '100%', padding: '14px', letterSpacing: '0.12em', marginTop: '4px' }}>
        WEITER ZUR ZAHLUNG →
      </Btn>
    </form>
  )
}

// ── Step 2: Payment form ───────────────────────────────────────────────────

function PaymentForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe   = useStripe()
  const elements = useElements()
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message ?? 'Fehler beim Einreichen')
      setLoading(false)
      return
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + '?payment=success' },
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message ?? 'Zahlung fehlgeschlagen')
      setLoading(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PaymentElement
        options={{
          layout: 'tabs',
          paymentMethodOrder: ['card', 'klarna', 'sofort', 'paypal'],
        }}
      />

      {error && (
        <div style={{ fontSize: '12px', color: C.accent, letterSpacing: '0.04em', padding: '10px', border: `1px solid ${C.accentDim}`, background: C.bgCard }}>
          {error}
        </div>
      )}

      <Btn type="submit" disabled={!stripe || loading} style={{ width: '100%', padding: '14px', letterSpacing: '0.12em' }}>
        {loading ? 'VERARBEITUNG...' : 'JETZT BEZAHLEN'}
      </Btn>

      <div style={{ fontSize: '10px', color: C.textDim, textAlign: 'center', lineHeight: 1.6, letterSpacing: '0.04em' }}>
        SSL-gesichert · Powered by Stripe · Diskrete Abrechnung
      </div>
    </form>
  )
}

// ── Step indicator ─────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 'address' | 'payment' }) {
  const steps = [
    { key: 'address', label: 'Lieferadresse' },
    { key: 'payment', label: 'Zahlung' },
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '32px' }}>
      {steps.map((s, i) => {
        const active = s.key === step
        const done   = step === 'payment' && s.key === 'address'
        return (
          <React.Fragment key={s.key}>
            {i > 0 && (
              <div style={{ flex: 1, height: '1px', background: done ? C.accent : C.border, maxWidth: '40px', margin: '0 8px' }} />
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 600,
                background: done ? C.accent : active ? C.accent : 'transparent',
                border: `1px solid ${done || active ? C.accent : C.border}`,
                color: done || active ? '#fff' : C.textDim,
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '11px', letterSpacing: '0.08em', color: active ? C.text : C.textDim, textTransform: 'uppercase' }}>
                {s.label}
              </span>
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ── Outer Checkout page ────────────────────────────────────────────────────

interface Props {
  items: CartItem[]
  total: number
  onNavigate: (page: Page) => void
  onClearCart: () => void
}

export default function Checkout({ items, total, onNavigate, onClearCart }: Props) {
  const { user } = useAuth()

  const shipping   = total >= 50 ? 0 : 4.99
  const grandTotal = total + shipping

  // Determine initial step — skip address if user already has a saved address
  const savedAddr = user?.address
  const hasSavedAddress = !!(savedAddr?.street && savedAddr?.city && savedAddr?.zip && user?.phone)

  const [step,          setStep]          = useState<'address' | 'payment'>(hasSavedAddress ? 'payment' : 'address')
  const [shippingAddr,  setShippingAddr]  = useState<ShippingAddress | null>(
    hasSavedAddress && user
      ? {
          firstName: user.firstName,
          lastName:  user.lastName,
          email:     user.email,
          phone:     user.phone,
          street:    savedAddr!.street,
          zip:       savedAddr!.zip,
          city:      savedAddr!.city,
          country:   savedAddr!.country || 'Deutschland',
        }
      : null
  )
  const [clientSecret, setClientSecret]  = useState<string | null>(null)
  const [fetchError,   setFetchError]    = useState<string | null>(null)
  const [success,      setSuccess]       = useState(false)

  // Create payment intent once address is confirmed
  useEffect(() => {
    if (step !== 'payment' || !shippingAddr) return

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    fetch(`${API_BASE}/api/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: total,
        items: items.map(i => ({
          product_id: i.product.id,
          name:       i.product.name,
          price:      i.product.price,
          qty:        i.qty,
          image_path: i.product.image ?? null,
        })),
        user_id:          user?.id ?? null,
        email:            shippingAddr.email,
        shipping_address: shippingAddr,
      }),
      signal: controller.signal,
    })
      .then(r => r.json())
      .then(data => {
        if (data.clientSecret) setClientSecret(data.clientSecret)
        else setFetchError(data.error ?? 'Unbekannter Fehler')
      })
      .catch(err => {
        const aborted = err?.name === 'AbortError'
        setFetchError(
          aborted
            ? 'API-Server nicht erreichbar. Bitte starte: npm run dev:full'
            : 'Verbindung zum Zahlungsserver fehlgeschlagen'
        )
      })
      .finally(() => clearTimeout(timeout))
  }, [step, shippingAddr?.email])

  const handleAddressConfirm = (addr: ShippingAddress) => {
    setShippingAddr(addr)
    setStep('payment')
  }

  const handleSuccess = () => {
    setSuccess(true)
    onClearCart()
  }

  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', color: C.accent }}>✓</div>
        <div style={{ fontSize: '14px', letterSpacing: '0.1em', color: C.text }}>ZAHLUNG ERFOLGREICH</div>
        <div style={{ fontSize: '12px', color: C.textMid, maxWidth: '320px', lineHeight: 1.8 }}>
          Vielen Dank für deine Bestellung!{shippingAddr?.email ? <><br />Eine Bestätigung wurde an <strong style={{ color: C.text }}>{shippingAddr.email}</strong> gesendet.</> : ' Du erhältst in Kürze eine Bestätigung per E-Mail.'}
        </div>
        <div style={{ fontSize: '11px', color: C.textDim, letterSpacing: '0.06em' }}>VERSAND INNERHALB 24H · DISKRETE VERPACKUNG</div>
        <Btn variant="outline" onClick={() => onNavigate('shop')} style={{ marginTop: '8px' }}>ZURÜCK ZUM SHOP</Btn>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: '0', minHeight: '100vh', borderTop: `1px solid ${C.border}` }}>
      {/* Main form area */}
      <div style={{ flex: 1, padding: '40px 48px', borderRight: `1px solid ${C.border}` }}>
        <Tag style={{ marginBottom: '20px' }}>Kasse</Tag>

        <StepIndicator step={step} />

        {step === 'address' && (
          <>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: C.text, marginBottom: '28px', letterSpacing: '0.04em' }}>
              Lieferadresse
            </h1>
            <AddressStep
              onConfirm={handleAddressConfirm}
              initial={{
                firstName: user?.firstName        ?? '',
                lastName:  user?.lastName         ?? '',
                email:     user?.email            ?? '',
                phone:     user?.phone            ?? '',
                street:    user?.address?.street  ?? '',
                zip:       user?.address?.zip     ?? '',
                city:      user?.address?.city    ?? '',
                country:   user?.address?.country ?? 'Deutschland',
              }}
            />
          </>
        )}

        {step === 'payment' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: C.text, letterSpacing: '0.04em', margin: 0 }}>
                Zahlung
              </h1>
              <button
                onClick={() => setStep('address')}
                style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', fontSize: '11px', letterSpacing: '0.08em' }}
              >
                ← ADRESSE ÄNDERN
              </button>
            </div>

            {fetchError && (
              <div style={{ fontSize: '12px', color: C.accent, padding: '12px', border: `1px solid ${C.accentDim}`, marginBottom: '24px' }}>
                {fetchError}
              </div>
            )}

            {!clientSecret && !fetchError && (
              <div style={{ fontSize: '12px', color: C.textDim, letterSpacing: '0.06em' }}>LADE ZAHLUNGSFORMULAR…</div>
            )}

            {clientSecret && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary:    C.accent,
                      colorBackground: C.bgCard,
                      colorText:       C.text,
                      colorDanger:     '#e50f38',
                      fontFamily:      "'Helvetica Neue', Helvetica, Arial, sans-serif",
                      borderRadius:    '0px',
                    },
                    rules: {
                      '.Input':         { border: `1px solid ${C.border}`,  boxShadow: 'none' },
                      '.Input:focus':   { border: `1px solid ${C.accent}`,  boxShadow: `0 0 0 1px ${C.accent}` },
                      '.Tab':           { border: `1px solid ${C.border}` },
                      '.Tab--selected': { border: `1px solid ${C.accent}`,  boxShadow: 'none' },
                    },
                  },
                }}
              >
                <PaymentForm onSuccess={handleSuccess} />
              </Elements>
            )}
          </>
        )}
      </div>

      {/* Order summary sidebar */}
      <div style={{ width: '320px', flexShrink: 0, padding: '40px 32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '12px', fontWeight: 400, letterSpacing: '0.12em', color: C.textMid, textTransform: 'uppercase', marginBottom: '8px' }}>
          Bestellübersicht
        </h2>

        {items.map(item => (
          <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: C.textMid, gap: '12px' }}>
            <span style={{ color: C.text }}>{item.product.name}</span>
            <span style={{ whiteSpace: 'nowrap' }}>
              {item.qty > 1 && <span style={{ marginRight: '6px', color: C.textDim }}>×{item.qty}</span>}
              €{(item.product.price * item.qty).toFixed(2)}
            </span>
          </div>
        ))}

        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: C.textMid }}>
            <span>Versand</span>
            <span style={{ color: shipping === 0 ? C.accent : C.textMid }}>
              {shipping === 0 ? 'Kostenlos' : `€${shipping.toFixed(2)}`}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: C.text, borderTop: `1px solid ${C.border}`, paddingTop: '12px' }}>
            <span>Gesamt</span>
            <span>€{grandTotal.toFixed(2)}</span>
          </div>
          <div style={{ fontSize: '10px', color: C.textDim, letterSpacing: '0.04em' }}>
            inkl. 19% MwSt. (€{(grandTotal * 19 / 119).toFixed(2)})
          </div>
        </div>

        {/* Show confirmed shipping address */}
        {shippingAddr && step === 'payment' && (
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '14px', marginTop: '4px' }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.1em', color: C.textDim, textTransform: 'uppercase', marginBottom: '8px' }}>
              Lieferung an
            </div>
            <div style={{ fontSize: '12px', color: C.textMid, lineHeight: 1.7 }}>
              {[shippingAddr.firstName, shippingAddr.lastName].filter(Boolean).join(' ')}<br />
              {shippingAddr.street}<br />
              {shippingAddr.zip} {shippingAddr.city}<br />
              {shippingAddr.country}
            </div>
          </div>
        )}

        <button
          onClick={() => onNavigate('cart')}
          style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', fontSize: '11px', letterSpacing: '0.08em', textAlign: 'left', marginTop: '8px' }}
        >
          ← ZURÜCK ZUM WARENKORB
        </button>
      </div>
    </div>
  )
}
