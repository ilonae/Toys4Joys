import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

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
  user:          User | null
  loading:       boolean
  login:         (email: string, password: string) => Promise<string | null>
  register:      (firstName: string, lastName: string, email: string, password: string) => Promise<RegisterResult>
  logout:        () => Promise<void>
  updateProfile: (data: ProfileData) => Promise<void>
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
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) setUser(await buildUser(session.user))
      setLoading(false)
    })

    // Keep state in sync with Supabase auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) setUser(await buildUser(session.user))
        else setUser(null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { firstName, lastName } },
    })
    if (error) return { error: deError(error.message), needsConfirmation: false }

    // If Supabase returned a user but no session, email confirmation is required.
    // In that case we must NOT try to upsert profiles — no session means RLS blocks it.
    // The DB trigger (handle_new_user / security definer) already inserts the row.
    const needsConfirmation = !!data.user && !data.session

    if (data.user && data.session) {
      // Auto-confirm is on (dev) — safe to upsert as a trigger safety net
      await supabase.from('profiles').upsert({
        id:         data.user.id,
        first_name: firstName.trim(),
        last_name:  lastName.trim(),
      })
    }

    return { error: null, needsConfirmation }
    // setUser is handled by onAuthStateChange (fires only when session exists)
  }

  // ── Logout ─────────────────────────────────────────────────────────────────

  const logout = async () => {
    await supabase.auth.signOut()
    // setUser(null) handled by onAuthStateChange
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
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
