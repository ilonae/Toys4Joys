import React, { useState, useEffect } from 'react'
import { C } from '@/tokens'
import { useAuth } from '@/contexts/AuthContext'
import { useLocale } from '@/contexts/LocaleContext'
import type { Translations } from '@/lib/i18n'
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

type Tab = 'login' | 'register' | 'track' | 'forgot' | 'set-password'

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

function LoginForm({ onSuccess, onForgot, t }: { onSuccess: () => void; onForgot: () => void; t: Translations }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError(t.auth.errAllFields); return }
    setLoading(true); setError(null)
    const err = await login(email, password)
    setLoading(false)
    if (err) setError(err)
    else onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Field label={t.checkout.email}     type="email"    value={email}    onChange={setEmail}    placeholder={t.auth.emailPlaceholder} />
      <Field label={t.auth.signInBtn}     type="password" value={password} onChange={setPassword} placeholder={t.auth.passwordPlaceholder} />
      <Checkbox checked={remember} onChange={setRemember}>{t.auth.rememberMe}</Checkbox>

      {error && (
        <div style={{ fontSize: '11px', color: C.accent, padding: '10px', border: `1px solid ${C.accentDim}`, background: C.bgCard }}>
          {error}
        </div>
      )}

      <SubmitBtn loading={loading}>{t.auth.signInBtn}</SubmitBtn>

      <button
        type="button"
        onClick={onForgot}
        style={{ background: 'none', border: 'none', color: C.textDim, fontSize: '11px', letterSpacing: '0.06em', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: 0 }}
      >
        {t.auth.forgotPassword}
      </button>
    </form>
  )
}

// ── Register form ──────────────────────────────────────────────────────────

function RegisterForm({ onSuccess, t }: { onSuccess: () => void; t: Translations }) {
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
  const [confirmed, setConfirmed] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!firstName.trim()) e.firstName = t.auth.errRequired
    if (!lastName.trim())  e.lastName  = t.auth.errRequired
    if (!email.includes('@')) e.email = t.auth.errInvalidEmail
    if (password.length < 8) e.password = t.auth.errPasswordShort
    if (password !== confirm) e.confirm = t.auth.errPasswordMismatch
    if (!age) e.age = t.auth.errAgeRequired
    if (!agb) e.agb = t.auth.errTermsRequired
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
      setConfirmed(true)
    } else {
      onSuccess()
    }
  }

  if (confirmed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center', padding: '8px 0' }}>
        <div style={{ fontSize: '32px', lineHeight: 1 }}>✉️</div>
        <div>
          <div style={{ fontSize: '13px', color: C.text, fontWeight: 500, letterSpacing: '0.06em', marginBottom: '8px' }}>
            {t.auth.confirmationSent}
          </div>
          <div style={{ fontSize: '12px', color: C.textMid, lineHeight: 1.7 }}>
            {t.auth.confirmationText1}<br />
            <span style={{ color: C.text }}>{email}</span><br />
            {t.auth.confirmationText2}
          </div>
        </div>
        <div style={{ fontSize: '11px', color: C.textDim, lineHeight: 1.6 }}>
          {t.auth.checkSpam}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label={t.checkout.firstName} value={firstName} onChange={setFirstName} placeholder={t.auth.firstNamePlaceholder} error={errors.firstName} />
        <Field label={t.checkout.lastName}  value={lastName}  onChange={setLastName}  placeholder={t.auth.lastNamePlaceholder}  error={errors.lastName} />
      </div>
      <Field label={t.checkout.email}            type="email"    value={email}    onChange={setEmail}    placeholder={t.auth.emailPlaceholder}    error={errors.email} />
      <Field label={t.auth.signInBtn}            type="password" value={password} onChange={setPassword} placeholder={t.auth.passwordMin}         error={errors.password} />
      <Field label={t.auth.confirmPasswordLabel} type="password" value={confirm}  onChange={setConfirm}  placeholder={t.auth.passwordPlaceholder} error={errors.confirm} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px' }}>
        <div>
          <Checkbox checked={age} onChange={setAge}>{t.auth.ageConfirm}</Checkbox>
          {errors.age && <span style={{ fontSize: '10px', color: C.accent, marginLeft: '22px' }}>{errors.age}</span>}
        </div>
        <div>
          <Checkbox checked={agb} onChange={setAgb}>
            {t.auth.termsAcceptPre} <span style={{ color: C.accent, cursor: 'pointer' }}>{t.footer.terms}</span> {t.auth.termsAcceptMid} <span style={{ color: C.accent, cursor: 'pointer' }}>{t.footer.privacy}</span>
          </Checkbox>
          {errors.agb && <span style={{ fontSize: '10px', color: C.accent, marginLeft: '22px' }}>{errors.agb}</span>}
        </div>
      </div>

      {globalError && (
        <div style={{ fontSize: '11px', color: C.accent, padding: '10px', border: `1px solid ${C.accentDim}`, background: C.bgCard }}>
          {globalError}
        </div>
      )}

      <SubmitBtn loading={loading}>{t.auth.createAccountBtn}</SubmitBtn>
    </form>
  )
}

// ── Forgot password form ───────────────────────────────────────────────────

function ForgotPasswordForm({ onBack, t }: { onBack: () => void; t: Translations }) {
  const { sendPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes('@')) { setError(t.auth.errInvalidEmail); return }
    setLoading(true); setError(null)
    const err = await sendPasswordReset(email)
    setLoading(false)
    if (err) setError(err)
    else setSent(true)
  }

  if (sent) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center', padding: '8px 0' }}>
        <div style={{ fontSize: '32px', lineHeight: 1 }}>✉️</div>
        <div>
          <div style={{ fontSize: '13px', color: C.text, fontWeight: 500, letterSpacing: '0.06em', marginBottom: '8px' }}>
            {t.auth.resetLinkSent}
          </div>
          <div style={{ fontSize: '12px', color: C.textMid, lineHeight: 1.7 }}>
            {t.auth.resetLinkSentText}<br />
            <span style={{ color: C.text }}>{email}</span>
          </div>
        </div>
        <div style={{ fontSize: '11px', color: C.textDim, lineHeight: 1.6 }}>
          {t.auth.checkSpam}
        </div>
        <button
          type="button"
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: C.textDim, fontSize: '11px', letterSpacing: '0.06em', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: 0 }}
        >
          {t.auth.backToLogin}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '12px', color: C.textMid, lineHeight: 1.7 }}>{t.auth.resetLinkHint}</div>
      <Field label={t.checkout.email} type="email" value={email} onChange={setEmail} placeholder={t.auth.emailPlaceholder} />
      {error && (
        <div style={{ fontSize: '11px', color: C.accent, padding: '10px', border: `1px solid ${C.accentDim}`, background: C.bgCard }}>
          {error}
        </div>
      )}
      <SubmitBtn loading={loading}>{t.auth.sendResetBtn}</SubmitBtn>
      <button
        type="button"
        onClick={onBack}
        style={{ background: 'none', border: 'none', color: C.textDim, fontSize: '11px', letterSpacing: '0.06em', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: 0 }}
      >
        {t.auth.backToLogin}
      </button>
    </form>
  )
}

// ── Set new password form ──────────────────────────────────────────────────

function SetPasswordForm({ onSuccess, t }: { onSuccess: () => void; t: Translations }) {
  const { setNewPassword } = useAuth()
  const [pwd, setPwd]         = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [done, setDone]       = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwd.length < 8) { setError(t.auth.errPasswordShort); return }
    if (pwd !== confirmPwd) { setError(t.auth.errPasswordMismatch); return }
    setLoading(true); setError(null)
    const err = await setNewPassword(pwd)
    setLoading(false)
    if (err) { setError(err); return }
    setDone(true)
    setTimeout(onSuccess, 1500)
  }

  if (done) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center', padding: '8px 0' }}>
        <div style={{ fontSize: '32px', lineHeight: 1 }}>✓</div>
        <div>
          <div style={{ fontSize: '13px', color: C.text, fontWeight: 500, letterSpacing: '0.06em', marginBottom: '8px' }}>
            {t.auth.passwordUpdated}
          </div>
          <div style={{ fontSize: '12px', color: C.textMid, lineHeight: 1.7 }}>
            {t.auth.passwordUpdatedText}
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Field label={t.auth.setNewPasswordTitle} type="password" value={pwd}        onChange={setPwd}        placeholder={t.auth.passwordMin} />
      <Field label={t.auth.confirmPasswordLabel} type="password" value={confirmPwd} onChange={setConfirmPwd} placeholder={t.auth.passwordPlaceholder} />
      {error && (
        <div style={{ fontSize: '11px', color: C.accent, padding: '10px', border: `1px solid ${C.accentDim}`, background: C.bgCard }}>
          {error}
        </div>
      )}
      <SubmitBtn loading={loading}>{t.auth.setPasswordBtn}</SubmitBtn>
    </form>
  )
}

// ── Guest order tracking ───────────────────────────────────────────────────

type TrackStatus = 'idle' | 'loading' | 'found' | 'error'

function TrackForm({ t }: { t: Translations }) {
  const STATUS_LABEL: Record<string, string> = {
    succeeded:               t.auth.statusSucceeded,
    processing:              t.auth.statusProcessing,
    requires_payment_method: t.auth.statusPaymentPending,
    requires_confirmation:   t.auth.statusConfirmationPending,
    canceled:                t.auth.statusCancelled,
  }
  const [orderId, setOrderId] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<TrackStatus>('idle')
  const [result, setResult] = useState<{ status: string; amount: number; currency: string } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderId.trim()) { setErrorMsg(t.auth.errOrderIdRequired); return }
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
      setErrorMsg(t.auth.errServerUnreachable)
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
          <div style={{ fontSize: '10px', letterSpacing: '0.1em', color: C.textDim, marginBottom: '8px' }}>{t.auth.orderStatusLabel}</div>
          <div style={{ fontSize: '20px', color: isOk ? C.accent : C.textMid, letterSpacing: '0.05em', marginBottom: '4px' }}>
            {label}
          </div>
          <div style={{ fontSize: '12px', color: C.textMid }}>
            {t.auth.orderAmountLabel}: <span style={{ color: C.text }}>€{amount}</span>
          </div>
          <div style={{ fontSize: '10px', color: C.textDim, marginTop: '12px', letterSpacing: '0.04em' }}>
            {t.auth.orderIdLabel}: {orderId}
          </div>
        </div>
        <button
          onClick={() => { setStatus('idle'); setResult(null); setOrderId(''); setEmail('') }}
          style={{ background: 'none', border: 'none', color: C.textDim, fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.06em', textAlign: 'left', padding: 0 }}
        >
          {t.auth.newSearch}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '12px', color: C.textMid, lineHeight: 1.7 }}>
        {t.auth.trackHint}
      </div>
      <Field
        label={t.auth.trackOrderIdLabel}
        value={orderId}
        onChange={setOrderId}
        placeholder={t.auth.trackOrderIdPlaceholder}
      />
      <Field
        label={t.auth.trackEmailLabel}
        type="email"
        value={email}
        onChange={setEmail}
        placeholder={t.auth.emailPlaceholder}
      />

      {errorMsg && (
        <div style={{ fontSize: '11px', color: C.accent, padding: '10px', border: `1px solid ${C.accentDim}`, background: C.bgCard }}>
          {errorMsg}
        </div>
      )}

      <SubmitBtn loading={status === 'loading'}>{t.auth.trackBtn}</SubmitBtn>
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
  const { t } = useLocale()
  const [tab, setTab] = useState<Tab>(initialTab)

  useEffect(() => { if (open) setTab(initialTab) }, [open, initialTab])

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 0' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.14em', color: C.textDim }}>
            {tab === 'set-password' ? t.auth.setNewPasswordTitle : t.auth.accountHeader}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '2px 4px', fontFamily: 'inherit' }}
          >
            ×
          </button>
        </div>

        {tab !== 'forgot' && tab !== 'set-password' && (
          <div style={{ display: 'flex', gap: '24px', padding: '16px 24px 0', borderBottom: `1px solid ${C.border}` }}>
            <TabBtn active={tab === 'login'}    onClick={() => setTab('login')}>{t.auth.loginTab}</TabBtn>
            <TabBtn active={tab === 'register'} onClick={() => setTab('register')}>{t.auth.registerTab}</TabBtn>
            <TabBtn active={tab === 'track'}    onClick={() => setTab('track')}>{t.auth.trackTab}</TabBtn>
          </div>
        )}

        <div style={{ padding: '24px' }}>
          {tab === 'login'        && <LoginForm          t={t} onSuccess={() => { onSuccess(); onClose() }} onForgot={() => setTab('forgot')} />}
          {tab === 'register'     && <RegisterForm       t={t} onSuccess={() => { onSuccess(); onClose() }} />}
          {tab === 'track'        && <TrackForm          t={t} />}
          {tab === 'forgot'       && <ForgotPasswordForm t={t} onBack={() => setTab('login')} />}
          {tab === 'set-password' && <SetPasswordForm    t={t} onSuccess={() => { onSuccess(); onClose() }} />}
        </div>
      </div>
    </div>
  )
}
