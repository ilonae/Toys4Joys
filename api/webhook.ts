import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from './_brevo.js'

const stripe   = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export const config = { api: { bodyParser: false } }

function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', chunk => chunks.push(Buffer.from(chunk)))
    req.on('end',  () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

// ── Email templates ───────────────────────────────────────────────────────────

function formatAddress(addr: Record<string, string> | null): string {
  if (!addr) return '—'
  return [
    [addr.firstName, addr.lastName].filter(Boolean).join(' '),
    addr.street,
    [addr.zip, addr.city].filter(Boolean).join(' '),
    addr.country,
  ].filter(Boolean).join('<br>')
}

function buildConfirmationHtml(order: {
  id: string; subtotal: number; shipping_cost: number; total: number
  shipping_address: Record<string, string> | null
  order_items: { name: string; qty: number; price: number }[]
}): string {
  const shortId  = order.id.slice(0, 8).toUpperCase()
  const itemRows = order.order_items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #1a1025;color:#e4d8f0;font-size:13px">${i.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid #1a1025;color:#9880a8;text-align:center;font-size:13px">×${i.qty}</td>
      <td style="padding:10px 0;border-bottom:1px solid #1a1025;color:#e4d8f0;text-align:right;font-size:13px">€${(i.price * i.qty).toFixed(2)}</td>
    </tr>`).join('')

  return `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#070509;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
  <div style="border-bottom:1px solid #1a1025;padding-bottom:28px;margin-bottom:36px">
    <div style="font-size:20px;font-weight:700;letter-spacing:0.18em;color:#e4d8f0">TOYS4JOYS</div>
    <div style="font-size:10px;letter-spacing:0.12em;color:#4a3058;margin-top:4px">BERLIN · KURATIERT &amp; GELEBT</div>
  </div>
  <h1 style="font-size:22px;font-weight:700;color:#e4d8f0;margin:0 0 8px">Bestellbestätigung</h1>
  <p style="font-size:13px;color:#9880a8;margin:0 0 32px;line-height:1.6">
    Danke für deine Bestellung! Wir versenden innerhalb 24h, diskret verpackt.<br>
    <span style="color:#4a3058;font-size:11px;letter-spacing:0.06em">BESTELLUNG #${shortId}</span>
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px"><tbody>${itemRows}</tbody></table>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
    <tr><td style="font-size:12px;color:#9880a8;padding:6px 0">Zwischensumme</td>
        <td style="font-size:12px;color:#9880a8;padding:6px 0;text-align:right">€${order.subtotal.toFixed(2)}</td></tr>
    <tr><td style="font-size:12px;color:#9880a8;padding:6px 0">Versand</td>
        <td style="font-size:12px;color:${order.shipping_cost === 0 ? '#e50f38' : '#9880a8'};padding:6px 0;text-align:right">
          ${order.shipping_cost === 0 ? 'Kostenlos' : `€${order.shipping_cost.toFixed(2)}`}</td></tr>
    <tr><td colspan="2"><div style="border-top:1px solid #1a1025;margin:8px 0"></div></td></tr>
    <tr><td style="font-size:15px;color:#e4d8f0;padding:6px 0;font-weight:600">Gesamt</td>
        <td style="font-size:15px;color:#e4d8f0;padding:6px 0;text-align:right;font-weight:600">€${order.total.toFixed(2)}</td></tr>
  </table>
  ${order.shipping_address ? `
  <div style="background:#0e0b14;border:1px solid #1a1025;padding:20px;margin-bottom:32px">
    <div style="font-size:10px;letter-spacing:0.12em;color:#4a3058;margin-bottom:10px">LIEFERADRESSE</div>
    <div style="font-size:13px;color:#9880a8;line-height:1.7">${formatAddress(order.shipping_address)}</div>
  </div>` : ''}
  <div style="border-top:1px solid #1a1025;padding-top:24px">
    <p style="font-size:11px;color:#4a3058;line-height:1.7;margin:0">
      Versand 24h · Diskrete Verpackung · 30 Tage Rückgabe<br>
      Fragen? <a href="mailto:hallo@toys4joys.de" style="color:#e50f38;text-decoration:none">hallo@toys4joys.de</a>
    </p>
  </div>
</div></body></html>`
}

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
      Versand 24h · Diskrete Verpackung · 30 Tage Rückgabe<br>
      Fragen? <a href="mailto:hallo@toys4joys.de" style="color:#e50f38;text-decoration:none">hallo@toys4joys.de</a>
    </p>
  </div>
</div></body></html>`
}

// ── Email senders ─────────────────────────────────────────────────────────────

async function sendConfirmation(orderId: string) {
  const { data: order, error } = await supabase
    .from('orders').select('*, order_items(*)').eq('id', orderId).single()
  if (error || !order) { console.error('[email] fetch failed:', error?.message); return }

  const toEmail = order.email && order.email !== 'guest' ? order.email : null
  if (!toEmail) return

  const { ok, error: mailErr } = await sendEmail({
    to:      toEmail,
    subject: `Deine Bestellung bei TOYS4JOYS · #${orderId.slice(0, 8).toUpperCase()}`,
    html:    buildConfirmationHtml(order),
  })
  if (!ok) console.error('[email] confirmation failed:', mailErr)
  else     console.log(`[email] confirmation → ${toEmail}`)
}

async function sendShippingNotification(orderId: string) {
  const { data: order, error } = await supabase
    .from('orders').select('*, order_items(*)').eq('id', orderId).single()
  if (error || !order) { console.error('[email] fetch failed:', error?.message); return }

  const toEmail = order.email && order.email !== 'guest' ? order.email : null
  if (!toEmail) return

  const { ok, error: mailErr } = await sendEmail({
    to:      toEmail,
    subject: `Deine Bestellung ist unterwegs · #${orderId.slice(0, 8).toUpperCase()}`,
    html:    buildShippingHtml(order),
  })
  if (!ok) console.error('[email] shipping failed:', mailErr)
  else     console.log(`[email] shipping notification → ${toEmail}`)
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const sig     = req.headers['stripe-signature'] as string
  const rawBody = await getRawBody(req)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[webhook] sig failed:', err)
    return res.status(400).json({ error: 'Invalid signature' })
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi      = event.data.object as Stripe.PaymentIntent
      const orderId = pi.metadata?.order_id
      if (!orderId) break
      const { error } = await supabase.from('orders').update({
        status: 'paid', stripe_payment_intent_id: pi.id, updated_at: new Date().toISOString(),
      }).eq('id', orderId)
      if (error) console.error('[webhook] mark paid failed:', error.message)
      else { console.log(`[webhook] ${orderId} → paid`); await sendConfirmation(orderId) }
      break
    }
    case 'payment_intent.payment_failed': {
      const pi      = event.data.object as Stripe.PaymentIntent
      const orderId = pi.metadata?.order_id
      if (!orderId) break
      await supabase.from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', orderId)
      console.log(`[webhook] ${orderId} → cancelled`)
      break
    }
    default: break
  }

  return res.json({ received: true })
}
