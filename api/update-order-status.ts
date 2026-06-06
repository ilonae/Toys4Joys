import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { getVerifiedAdmin } from './_auth.js'
import { sendEmail } from './_brevo.js'
import { shippingEmail } from './_email-templates.js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ALLOWED_ORIGIN = process.env.VERCEL_ENV === 'production'
  ? 'https://www.toys4joys.com'
  : 'http://localhost:5173'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  try {
    // Fail fast if the runtime is misconfigured — gives a clearer message than
    // letting the Supabase client throw deep inside the call.
    if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[update-order-status] Supabase env vars missing')
      return res.status(500).json({ error: 'Server misconfigured: Supabase env vars missing' })
    }

    // Verify caller is admin via JWT — no user-supplied IDs trusted
    const admin = await getVerifiedAdmin(req, supabase)
    if (!admin) return res.status(403).json({ error: 'Forbidden (not admin or invalid token)' })

    const { orderId, status, trackingNumber } = (req.body ?? {}) as {
      orderId?: string; status?: string; trackingNumber?: string
    }
    if (!orderId || !status) return res.status(400).json({ error: 'Missing fields: orderId, status' })

    // Update order
    const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
    if (trackingNumber !== undefined) update.tracking_number = trackingNumber || null

    const { error: updateErr } = await supabase
      .from('orders').update(update).eq('id', orderId)
    if (updateErr) {
      console.error('[update-order-status] supabase update failed:', updateErr)
      return res.status(500).json({ error: updateErr.message, hint: updateErr.hint, code: updateErr.code })
    }

    // Send shipping notification when status becomes 'shipped' — email is
    // best-effort; we never block the status update on it.
    if (status === 'shipped') {
      try {
        const { data: order, error: fetchErr } = await supabase
          .from('orders').select('*, order_items(*)').eq('id', orderId).single()

        if (fetchErr) console.error('[update-order-status] fetch for email failed:', fetchErr.message)
        else if (order) {
          const toEmail = order.email && order.email !== 'guest' ? order.email : null
          if (toEmail) {
            const { subject, html } = shippingEmail({
              orderId,
              trackingNumber: trackingNumber ?? order.tracking_number,
              locale:         order.locale,  // optional column; falls back to 'de'
            })
            const { ok, error: mailErr } = await sendEmail({ to: toEmail, subject, html })
            if (!ok) console.error('[update-order-status] email failed:', mailErr)
            else     console.log(`[update-order-status] shipping email → ${toEmail}`)
          }
        }
      } catch (mailErr) {
        // Don't fail the whole request if the email step crashes
        console.error('[update-order-status] email step crashed:', mailErr)
      }
    }

    return res.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[update-order-status] unhandled exception:', e)
    return res.status(500).json({ error: 'Unhandled exception', detail: msg })
  }
}
