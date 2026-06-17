import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { emit, subscribe } from '@/lib/cacheBus'
import { useFocusRefetch } from '@/hooks/useFocusRefetch'

// ─────────────────────────────────────────────────────────────────────────────
// Domain types
// ─────────────────────────────────────────────────────────────────────────────

export interface UserAddress {
  street:  string
  zip:     string
  city:    string
  country: string
}

export interface User {
  id:        string
  email:     string
  firstName: string
  lastName:  string
  phone:     string
  address:   UserAddress
  isAdmin:   boolean
}

export type ProfileData = Partial<Omit<User, 'id' | 'email' | 'isAdmin'>>

export function fullName(u: User) {
  return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email
}

// ─────────────────────────────────────────────────────────────────────────────
// Context interface
// ─────────────────────────────────────────────────────────────────────────────

export interface RegisterResult {
  error:              string | null
  needsConfirmation:  boolean   // true when Supabase requires email verification
}

interface AuthContextType {
  user:                User | null
  loading:             boolean
  isPasswordRecovery:  boolean
  login:               (email: string, password: string) => Promise<string | null>
  register:            (firstName: string, lastName: string, email: string, password: string) => Promise<RegisterResult>
  logout:              () => Promise<void>
  updateProfile:       (data: ProfileData) => Promise<void>
  sendPasswordReset:   (email: string) => Promise<string | null>
  setNewPassword:      (password: string) => Promise<string | null>
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_ADDRESS: UserAddress = { street: '', zip: '', city: '', country: 'Deutschland' }

/** Map English Supabase error messages → German */
function deError(msg: string): string {
  if (msg.includes('Invalid login credentials'))    return 'Ungültige E-Mail-Adresse oder Passwort.'
  if (msg.includes('already registered') || msg.includes('already been registered'))
                                                     return 'Diese E-Mail-Adresse ist bereits registriert.'
  if (msg.includes('Email not confirmed'))           return 'Bitte bestätige zuerst deine E-Mail-Adresse.'
  if (msg.includes('Password should be at least'))   return 'Das Passwort muss mindestens 6 Zeichen lang sein.'
  if (msg.includes('rate limit') || msg.includes('too many')) return 'Zu viele Versuche. Bitte warte kurz.'
  if (msg.includes('network') || msg.includes('fetch')) return 'Verbindungsfehler. Bitte versuche es erneut.'
  return msg
}

/** Fetch the profiles row for a given user id */
async function fetchProfile(userId: string): Promise<Partial<UserAddress & { firstName: string; lastName: string; phone: string; isAdmin: boolean }>> {
  const { data } = await supabase
    .from('profiles')
    .select('first_name, last_name, street, zip, city, country, is_admin, phone')
    .eq('id', userId)
    .single()
  if (!data) return {}
  return {
    firstName: data.first_name ?? '',
    lastName:  data.last_name  ?? '',
    phone:     data.phone      ?? '',
    street:    data.street     ?? '',
    zip:       data.zip        ?? '',
    city:      data.city       ?? '',
    country:   data.country    ?? 'Deutschland',
    isAdmin:   data.is_admin   ?? false,
  }
}

/** Assemble our User type from Supabase auth user + profiles row */
async function buildUser(supaUser: SupabaseUser): Promise<User> {
  const profile = await fetchProfile(supaUser.id)
  const meta    = (supaUser.user_metadata ?? {}) as Record<string, string>
  return {
    id:        supaUser.id,
    email:     supaUser.email ?? '',
    firstName: profile.firstName ?? meta.firstName ?? '',
    lastName:  profile.lastName  ?? meta.lastName  ?? '',
    phone:     profile.phone     ?? '',
    isAdmin:   profile.isAdmin   ?? false,
    address: {
      street:  profile.street  ?? '',
      zip:     profile.zip     ?? '',
      city:    profile.city    ?? '',
      country: profile.country ?? 'Deutschland',
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]                     = useState<User | null>(null)
  const [loading, setLoading]               = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)

  // Re-pull the current session's profile from the DB. Used when:
  //   - the page is mounted (initial sync)
  //   - Supabase emits an auth state change (login / logout / token refresh)
  //   - the tab regains focus (another tab may have updated the profile)
  //   - someone explicitly emit('auth') — typically right after updateProfile()
  const refetchUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) setUser(await buildUser(session.user))
    else setUser(null)
  }, [])

  useEffect(() => {
    // Restore existing session on mount
    refetchUser().finally(() => setLoading(false))

    // Keep state in sync with Supabase auth events (login, logout, token
    // refresh — also fires cross-tab via Supabase's storage listener)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true)
        if (session?.user) setUser(await buildUser(session.user))
        else setUser(null)
      }
    )

    // Subscribe to manual 'auth' invalidation signals from anywhere in the app
    const unsub = subscribe('auth', refetchUser)

    return () => { subscription.unsubscribe(); unsub() }
  }, [refetchUser])

  // Cross-tab profile sync: if the user edits their address in tab A, tab B
  // refetches the profile when it regains focus. Only active when signed in.
  useFocusRefetch(refetchUser, !!user)

  // ── Login ──────────────────────────────────────────────────────────────────

  const login = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return deError(error.message)
    return null
    // setUser is handled by onAuthStateChange
  }

  // ── Register ───────────────────────────────────────────────────────────────

  const register = async (
    firstName: string, lastName: string, email: string, password: string
  ): Promise<RegisterResult> => {
    // We use a server-side endpoint so Supabase's default confirmation
    // email is bypassed entirely (admin.createUser with email_confirm:false)
    // and a branded Brevo email is sent instead. See api/register.ts.
    let locale: string | undefined
    try { locale = localStorage.getItem('t4j_locale') ?? undefined } catch { /* */ }

    let resp: Response
    try {
      resp = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password, locale }),
      })
    } catch (e) {
      console.error('[register] network error:', e)
      return { error: deError('network'), needsConfirmation: false }
    }

    let json: { ok?: boolean; error?: string; emailSent?: boolean; warning?: string } | null = null
    try { json = await resp.json() } catch { /* non-JSON response */ }

    if (!resp.ok || !json?.ok) {
      return { error: deError(json?.error ?? 'Registration failed'), needsConfirmation: false }
    }

    // Always treat as needsConfirmation — user must click the link before sign-in.
    return { error: null, needsConfirmation: true }
  }

  // ── Logout ─────────────────────────────────────────────────────────────────

  const logout = async () => {
    await supabase.auth.signOut()
    // setUser(null) handled by onAuthStateChange
  }

  // ── Password reset ─────────────────────────────────────────────────────────

  const sendPasswordReset = async (email: string): Promise<string | null> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) return deError(error.message)
    return null
  }

  const setNewPassword = async (password: string): Promise<string | null> => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return deError(error.message)
    setIsPasswordRecovery(false)
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    return null
  }

  // ── Update profile ─────────────────────────────────────────────────────────

  const updateProfile = async (data: ProfileData): Promise<void> => {
    if (!user) return

    const nextUser: User = {
      ...user,
      firstName: data.firstName ?? user.firstName,
      lastName:  data.lastName  ?? user.lastName,
      phone:     data.phone     ?? user.phone,
      address: { ...user.address, ...(data.address ?? {}) },
    }

    // Update auth metadata (name) so it survives a full session refresh
    if (data.firstName !== undefined || data.lastName !== undefined) {
      await supabase.auth.updateUser({
        data: { firstName: nextUser.firstName, lastName: nextUser.lastName },
      })
    }

    // Upsert profiles table (address + name + phone)
    await supabase.from('profiles').upsert({
      id:         user.id,
      first_name: nextUser.firstName,
      last_name:  nextUser.lastName,
      phone:      nextUser.phone,
      street:     nextUser.address.street,
      zip:        nextUser.address.zip,
      city:       nextUser.address.city,
      country:    nextUser.address.country,
      updated_at: new Date().toISOString(),
    })

    setUser(nextUser)
    // Notify other subscribers (e.g. the admin orders list shows the
    // customer name, so it should refresh after a profile edit).
    emit('auth')
  }

  return (
    <AuthContext.Provider value={{ user, loading, isPasswordRecovery, login, register, logout, updateProfile, sendPasswordReset, setNewPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
