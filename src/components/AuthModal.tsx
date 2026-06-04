import React, { useState, useEffect } from 'react'
import { C } from '@/tokens'
import { useAuth } from '@/contexts/AuthContext'
import type { RegisterResult } from '@/contexts/AuthContext'
import { API_BASE } from '@/lib/stripe'

// ── Shared input style ──────────────────────────────────────────────────────

function Field({
  label, type = 'text', value, onChange, placeholder, error,
}: {
  label: string; type?: string; value: string
  onChange: (v: string) => void; placeholder?: string; error?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '10px', letterSpacing: '0.1em', color: C.textDim, textTransform: 'uppercase' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: C.bgSurface,
          border: `1px solid ${error ? C.accent : focused ? C.borderMid : C.border}`,
          color: C.text,
          padding: '10px 12px',
          fontSize: '13px',
          outline: 'none',
          fontFamily: 'inherit',
          transition: 'border-color 0.15s',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
      {error && (
        <span style={{ fontSize: '11px', color: C.accent }}>{error}</span>
      )}
    </div>
  )
}

function SubmitBtn({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        width: '100%', padding: '12px',
        background: loading ? C.accentDim : C.accent,
        border: 'none', color: C.white,
        fontSize: '11px', letterSpacing: '0.12em', fontFamily: 'inherit',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s',
      }}
    >
      {loading ? '…' : children}
    </button>
  )
}

function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '11px', color: C.textMid, lineHeight: 1.6 }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: '14px', height: '14px', flexShrink: 0, marginTop: '1px',
          border: `1px solid ${checked ? C.accent : C.border}`,
          background: checked ? C.accent : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}
      >
        {checked && <span style={{ color: C.white, fontSize: '9px', lineHeight: 1 }}>✓</span>}
      </div>
      <span>{children}</span>
    </label>
  )
}

// ── Tab bar ────────────────────────────────────────────────────────────────

type Tab = 'login' | 'register' | 'track'

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none', padding: '10px 0', cursor: 'pointer',
        fontSize: '11px', letterSpacing: '0.1em', fontFamily: 'inherit',
        color: active ? C.text : C.textDim,
        borderBottom: `1px solid ${active ? C.accent : 'transparent'}`,
        transition: 'color 0.15s, border-color 0.15s',
      }}
    >
      {children}
    </button>
  )
}

// ── Login form ─────────────────────────────────────────────────────────────

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Bitte alle Felder ausfüllen.'); return }
    setLoading(true); setError(null)
    const err = await login(email, password)
    setLoading(false)
    if (err) setError(err)
    else onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Field label="E-Mail" type="email" value={email} onChange={setEmail} placeholder="deine@email.de" />
      <Field label="Passwort" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
      <Checkbox checked={remember} onChange={setRemember}>Angemeldet bleiben</Checkbox>

      {error && (
        <div style={{ fontSize: '11px', color: C.accent, padding: '10px', border: `1px solid ${C.accentDim}`, background: C.bgCard }}>
          {error}
        </div>
      )}

      <SubmitBtn loading={loading}>ANMELDEN</SubmitBtn>

      <button
        type="button"
        style={{ background: 'none', border: 'none', color: C.textDim, fontSize: '11px', letterSpacing: '0.06em', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: 0 }}
      >
        Passwort vergessen?
      </button>
    </form>
  )
}

// ── Register form ──────────────────────────────────────────────────────────

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const { register } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [age, setAge] = useState(false)
  const [agb, setAgb] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false) // email confirmation pending

  const validate = () => {
    const e: Record<string, string> = {}
    if (!firstName.trim()) e.firstName = 'Pflichtfeld'
    if (!lastName.trim())  e.lastName  = 'Pflichtfeld'
    if (!email.includes('@')) e.email = 'Ungültige E-Mail'
    if (password.length < 8) e.password = 'Mindestens 8 Zeichen'
    if (password !== confirm) e.confirm = 'Passwörter stimmen nicht überein'
    if (!age) e.age = 'Du musst 18+ sein'
    if (!agb) e.agb = 'Bitte AGB akzeptieren'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true); setErrors({}); setGlobalError(null)
    const result: RegisterResult = await register(firstName, lastName, email, password)
    setLoading(false)
    if (result.error) {
      setGlobalError(result.error)
    } else if (result.needsConfirmation) {
      // Email confirmation required — show success screen instead of closing
      setConfirmed(true)
    } else {
      // Auto-confirm (dev) — sign-in happened immediately
      onSuccess()
    }
  }

  // ── Confirmation-sent screen ───────────────────────────────────────────────
  if (confirmed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center', padding: '8px 0' }}>
        <div style={{ fontSize: '32px', lineHeight: 1 }}>✉️</div>
        <div>
          <div style={{ fontSize: '13px', color: C.text, fontWeight: 500, letterSpacing: '0.06em', marginBottom: '8px' }}>
            BESTÄTIGUNGSMAIL GESENDET
          </div>
          <div style={{ fontSize: '12px', color: C.textMid, lineHeight: 1.7 }}>
            Wir haben eine Bestätigungs-E-Mail an<br />
            <span style={{ color: C.text }}>{email}</span><br />
            gesendet. Bitte klick auf den Link darin, um dein Konto zu aktivieren.
          </div>
        </div>
        <div style={{ fontSize: '11px', color: C.textDim, lineHeight: 1.6 }}>
          Keine E-Mail erhalten? Schau in deinen Spam-Ordner oder wende dich an unseren Support.
        </div>
      </div>
    )
  }

  // ── Registration form ──────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Vorname" value={firstName} onChange={setFirstName} placeholder="Max"       error={errors.firstName} />
        <Field label="Nachname" value={lastName}  onChange={setLastName}  placeholder="Mustermann" error={errors.lastName} />
      </div>
      <Field label="E-Mail" type="email" value={email} onChange={setEmail} placeholder="deine@email.de" error={errors.email} />
      <Field label="Passwort" type="password" value={password} onChange={setPassword} placeholder="Mindestens 8 Zeichen" error={errors.password} />
      <Field label="Passwort wiederholen" type="password" value={confirm} onChange={setConfirm} placeholder="••••••••" error={errors.confirm} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px' }}>
        <div>
          <Checkbox checked={age} onChange={setAge}>Ich bin 18 Jahre oder älter</Checkbox>
          {errors.age && <span style={{ fontSize: '10px', color: C.accent, marginLeft: '22px' }}>{errors.age}</span>}
        </div>
        <div>
          <Checkbox checked={agb} onChange={setAgb}>
            Ich akzeptiere die <span style={{ color: C.accent, cursor: 'pointer' }}>AGB</span> und <span style={{ color: C.accent, cursor: 'pointer' }}>Datenschutzerklärung</span>
          </Checkbox>
          {errors.agb && <span style={{ fontSize: '10px', color: C.accent, marginLeft: '22px' }}>{errors.agb}</span>}
        </div>
      </div>

      {globalError && (
        <div style={{ fontSize: '11px', color: C.accent, padding: '10px', border: `1px solid ${C.accentDim}`, background: C.bgCard }}>
          {globalError}
        </div>
      )}

      <SubmitBtn loading={loading}>KONTO ERSTELLEN</SubmitBtn>
    </form>
  )
}

// ── Guest order tracking ───────────────────────────────────────────────────

type TrackStatus = 'idle' | 'loading' | 'found' | 'error'

const STATUS_LABEL: Record<string, string> = {
  succeeded:              'Bezahlt ✓',
  processing:             'In Bearbeitung',
  requires_payment_method: 'Zahlung ausstehend',
  requires_confirmation:  'Bestätigung ausstehend',
  canceled:               'Storniert',
}

function TrackForm() {
  const [orderId, setOrderId] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<TrackStatus>('idle')
  const [result, setResult] = useState<{ status: string; amount: number; currency: string } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderId.trim()) { setErrorMsg('Bitte Bestellnummer eingeben.'); return }
    setStatus('loading'); setErrorMsg('')
    try {
      const res = await fetch(`${API_BASE}/api/track-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderId.trim() }),
      })
      const data = await res.json()
      if (data.error) { setErrorMsg(data.error); setStatus('error') }
      else { setResult(data); setStatus('found') }
    } catch {
      setErrorMsg('Server nicht erreichbar. Bitte später erneut versuchen.')
      setStatus('error')
    }
  }

  if (status === 'found' && result) {
    const label = STATUS_LABEL[result.status] ?? result.status
    const amount = (result.amount / 100).toFixed(2)
    const isOk = result.status === 'succeeded'
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ padding: '20px', border: `1px solid ${isOk ? C.accentDim : C.border}`, background: C.bgCard }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.1em', color: C.textDim, marginBottom: '8px' }}>BESTELLSTATUS</div>
          <div style={{ fontSize: '20px', color: isOk ? C.accent : C.textMid, letterSpacing: '0.05em', marginBottom: '4px' }}>
            {label}
          </div>
          <div style={{ fontSize: '12px', color: C.textMid }}>
            Betrag: <span style={{ color: C.text }}>€{amount}</span>
          </div>
          <div style={{ fontSize: '10px', color: C.textDim, marginTop: '12px', letterSpacing: '0.04em' }}>
            Bestell-ID: {orderId}
          </div>
        </div>
        <button
          onClick={() => { setStatus('idle'); setResult(null); setOrderId(''); setEmail('') }}
          style={{ background: 'none', border: 'none', color: C.textDim, fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.06em', textAlign: 'left', padding: 0 }}
        >
          ← Neue Suche
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '12px', color: C.textMid, lineHeight: 1.7 }}>
        Gib deine Bestell-ID ein (beginnt mit <span style={{ color: C.text, fontFamily: 'monospace' }}>pi_</span>) — sie steht in deiner Bestätigungs-E-Mail.
      </div>
      <Field
        label="Bestell-ID"
        value={orderId}
        onChange={setOrderId}
        placeholder="pi_3Nxxx..."
      />
      <Field
        label="E-Mail (optional)"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="deine@email.de"
      />

      {errorMsg && (
        <div style={{ fontSize: '11px', color: C.accent, padding: '10px', border: `1px solid ${C.accentDim}`, background: C.bgCard }}>
          {errorMsg}
        </div>
      )}

      <SubmitBtn loading={status === 'loading'}>BESTELLUNG VERFOLGEN</SubmitBtn>
    </form>
  )
}

// ── Main modal ─────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  initialTab?: Tab
  onClose: () => void
  onSuccess: () => void
}

export default function AuthModal({ open, initialTab = 'login', onClose, onSuccess }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab)

  useEffect(() => { if (open) setTab(initialTab) }, [open, initialTab])

  // close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(7,5,9,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.bg, border: `1px solid ${C.borderMid}`,
          width: '100%', maxWidth: '420px',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 0' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.14em', color: C.textDim }}>KONTO</div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '2px 4px', fontFamily: 'inherit' }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '24px', padding: '16px 24px 0', borderBottom: `1px solid ${C.border}` }}>
          <TabBtn active={tab === 'login'}    onClick={() => setTab('login')}>ANMELDEN</TabBtn>
          <TabBtn active={tab === 'register'} onClick={() => setTab('register')}>REGISTRIEREN</TabBtn>
          <TabBtn active={tab === 'track'}    onClick={() => setTab('track')}>BESTELLUNG</TabBtn>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {tab === 'login'    && <LoginForm    onSuccess={() => { onSuccess(); onClose() }} />}
          {tab === 'register' && <RegisterForm onSuccess={() => { onSuccess(); onClose() }} />}
          {tab === 'track'    && <TrackForm />}
        </div>
      </div>
    </div>
  )
}
