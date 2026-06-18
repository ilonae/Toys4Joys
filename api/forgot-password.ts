/**
 * Custom password-reset endpoint — bypasses Supabase SMTP entirely.
 *
 * Flow:
 *   1. Generate a signed recovery link via admin.generateLink('recovery').
 *   2. Send our branded Brevo email with that link.
 *
 * Supabase's built-in SMTP path produces persistent 500s ("Error sending
 * recovery email") even with correct Brevo SMTP credentials.  Driving the
 * Brevo HTTP API directly is the same approach we already use for welcome
 * and order emails — and it works.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from './_brevo.js'
import { resetPasswordEmail } from './_email-templates.js'

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin
  if (origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { email, locale } = (req.body ?? {}) as { email?: string; locale?: string }
    if (!email) return res.status(400).json({ error: 'email required' })

    // Generate the signed recovery link — Supabase signs it, we never see the token.
    const { data, error: linkErr } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${SITE_URL}/` },
    })

    if (linkErr || !data?.properties?.action_link) {
      // If the email doesn't exist in Supabase, generateLink still succeeds —
      // returning an error here would reveal whether an account exists.
      // Log server-side only; return a neutral 200 to the client.
      console.error('[forgot-password] generateLink error:', linkErr?.message)
      return res.status(200).json({ ok: true })
    }

    const resetUrl = data.properties.action_link
    const { subject, html } = resetPasswordEmail({ resetUrl, locale })
    const { ok, error: mailErr } = await sendEmail({
      to: email,
      subject,
      html,
      replyTo: 'hallo@toys4joys.de',
    })

    if (!ok) {
      console.error('[forgot-password] email send failed:', mailErr)
      return res.status(500).json({ error: 'E-Mail konnte nicht gesendet werden. Bitte versuche es erneut.' })
    }

    console.log(`[forgot-password] reset email sent to ${email}`)
    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('[forgot-password] unhandled:', e)
    return res.status(500).json({ error: 'Interner Fehler. Bitte versuche es erneut.' })
  }
}
