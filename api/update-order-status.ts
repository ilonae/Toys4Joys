import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { getVerifiedAdmin } from './_auth.js'
import { sendEmail } from './_brevo.js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ALLOWED_ORIGIN = process.env.VERCEL_ENV === 'production'
  ? 'https://www.toys4joys.com'
  : 'http://localhost:5173'

function buildShippingHtml(order: {
  id: string; tracking_number: string | null
  order_items: { name: string; qty: number; price: number }[]
}): string {
  const shortId  = order.id.slice(0, 8).toUpperCase()
  const tracking = order.tracking_number
  return `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#070509;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
  <div style="border-bottom:1px solid #1a1025;padding-bottom:28px;margin-bottom:36px">
    <div style="font-size:20px;font-weight:700;letter-spacing:0.18em;color:#e4d8f0">TOYS4JOYS</div>
    <div style="font-size:10px;letter-spacing:0.12em;color:#4a3058;margin-top:4px">BERLIN · KURATIERT &amp; GELEBT</div>
  </div>
  <h1 style="font-size:22px;font-weight:700;color:#e4d8f0;margin:0 0 8px">Deine Bestellung ist unterwegs!</h1>
  <p style="font-size:13px;color:#9880a8;margin:0 0 32px;line-height:1.6">
    Wir haben deine Bestellung versendet — diskret verpackt, kein Absender.<br>
    <span style="color:#4a3058;font-size:11px;letter-spacing:0.06em">BESTELLUNG #${shortId}</span>
  </p>
  ${tracking ? `
  <div style="background:#0e0b14;border:1px solid #1a1025;padding:20px;margin-bottom:32px">
    <div style="font-size:10px;letter-spacing:0.12em;color:#4a3058;margin-bottom:10px">SENDUNGSNUMMER</div>
    <div style="font-size:16px;color:#e4d8f0;font-weight:600;letter-spacing:0.08em">${tracking}</div>
    <div style="font-size:11px;color:#9880a8;margin-top:8px">Tracke dein Paket beim entsprechenden Versanddienstleister.</div>
  </div>` : ''}
  <div style="border-top:1px solid #1a1025;padding-top:24px">
    <p style="font-size:11px;color:#4a3058;line-height:1.7;margin:0">
      Diskrete Verpackung · 30 Tage Rückgabe<br>
      Fragen? <a href="mailto:hallo@toys4joys.de" style="color:#e50f38;text-decoration:none">hallo@toys4joys.de</a>
    </p>
  </div>
</div></body></html>`
}

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
            const orderWithTracking = { ...order, tracking_number: trackingNumber ?? order.tracking_number }
            const { ok, error: mailErr } = await sendEmail({
              to:      toEmail,
              subject: `Deine Bestellung ist unterwegs · #${orderId.slice(0, 8).toUpperCase()}`,
              html:    buildShippingHtml(orderWithTracking),
            })
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
