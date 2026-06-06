/**
 * Custom registration endpoint that bypasses Supabase's built-in
 * confirmation email entirely.
 *
 * Flow:
 *   1. Create the user via admin API with `email_confirm: false` so
 *      Supabase does NOT auto-send anything.
 *   2. Generate a signed confirm link via `admin.generateLink('signup')`.
 *   3. Send our locale-aware Brevo email with that link.
 *
 * The user clicks the link → lands on Supabase's verify endpoint → gets
 * redirected to `redirectTo` (set to /?confirmed=true). They can then
 * sign in with the password they chose.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from './_brevo.js'
import { welcomeEmail } from './_email-templates.js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const SITE_URL = process.env.VERCEL_ENV === 'production'
  ? 'https://www.toys4joys.com'
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:5173'

const ALLOWED_ORIGINS = [
  SITE_URL,
  'https://www.toys4joys.com',
  'https://toys4-joys.vercel.app',
  'http://localhost:5173',
]

interface Body {
  firstName?: string
  lastName?:  string
  email?:     string
  password?:  string
  locale?:    string
}

function deError(msg: string): string {
  if (msg.includes('already registered') || msg.includes('already been registered'))
    return 'Diese E-Mail-Adresse ist bereits registriert.'
  if (msg.includes('Password should be at least'))
    return 'Das Passwort muss mindestens 6 Zeichen lang sein.'
  if (msg.includes('rate limit') || msg.includes('too many'))
    return 'Zu viele Versuche. Bitte warte kurz.'
  return msg
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS — allow same-origin + known dev URLs
  const origin = req.headers.origin
  if (origin && ALLOWED_ORIGINS.some(o => origin === o || origin.endsWith('.vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' })

  try {
    if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[register] Supabase env vars missing')
      return res.status(500).json({ error: 'Server misconfigured' })
    }

    const { firstName, lastName, email, password, locale } = (req.body ?? {}) as Body
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing fields' })
    }

    // 1. Create user as UNCONFIRMED (so Supabase doesn't auto-mail anything).
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { firstName, lastName, locale: locale ?? 'de' },
    })
    if (createErr || !created.user) {
      console.error('[register] createUser failed:', createErr?.message)
      return res.status(400).json({ error: deError(createErr?.message ?? 'Registration failed') })
    }

    // 2. Insert a profiles row eagerly (admin client bypasses RLS).
    //    Tolerate "row already exists" if a trigger created one.
    {
      const { error: profileErr } = await supabase.from('profiles').upsert({
        id:         created.user.id,
        first_name: firstName.trim(),
        last_name:  lastName.trim(),
        email,
      })
      if (profileErr) console.error('[register] profile upsert warn:', profileErr.message)
    }

    // 3. Generate a one-shot confirmation link tied to this account.
    //    Supabase signs the link with its JWT secret — we never see the token.
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type:  'signup',
      email,
      password,
      options: { redirectTo: `${SITE_URL}/?confirmed=1` },
    })
    if (linkErr || !linkData.properties?.action_link) {
      console.error('[register] generateLink failed:', linkErr?.message)
      // The user is created but no link — surface a partial-success error
      // so the frontend doesn't show "we sent an email" when nothing went out.
      return res.status(500).json({ error: 'Konto erstellt, aber Bestätigungslink konnte nicht generiert werden. Bitte Support kontaktieren.' })
    }
    const confirmUrl = linkData.properties.action_link

    // 4. Send the welcome / confirm email via Brevo.
    const { subject, html } = welcomeEmail({ confirmUrl, locale })
    const { ok, error: mailErr } = await sendEmail({ to: email, subject, html, replyTo: 'hallo@toys4joys.de' })
    if (!ok) {
      console.error('[register] welcome email failed:', mailErr)
      // Don't fail the registration — the user can re-request the email.
      return res.status(200).json({
        ok: true,
        emailSent: false,
        warning: 'Konto erstellt, aber E-Mail konnte nicht versendet werden. Bitte kontaktiere uns.',
      })
    }

    console.log(`[register] new user ${email} — confirmation email sent`)
    return res.status(201).json({ ok: true, emailSent: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[register] unhandled exception:', e)
    return res.status(500).json({ error: 'Internal error', detail: msg })
  }
}
