import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from './_brevo.js'
import { sendTelegram } from './_telegram.js'
import { orderEmail, internalOrderEmail, type OrderInfo } from './_email-templates.js'

const INTERNAL_EMAIL = 'info@toys4joys.com'

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

// ── Email sender ──────────────────────────────────────────────────────────────

async function sendOrderConfirmation(orderId: string, locale?: string) {
  const { data: order, error } = await supabase
    .from('orders').select('*, order_items(*)').eq('id', orderId).single()
  if (error || !order) { console.error('[email] fetch failed:', error?.message); return }

  // 1. Customer confirmation
  const toEmail = order.email && order.email !== 'guest' ? order.email : null
  if (toEmail) {
    const { subject, html } = orderEmail({ order: order as OrderInfo, locale })
    const { ok, error: mailErr } = await sendEmail({ to: toEmail, subject, html })
    if (!ok) console.error('[email] order confirmation failed:', mailErr)
    else     console.log(`[email] order confirmation → ${toEmail}`)
  }

  // 2. Internal notification
  const { subject: iSubject, html: iHtml } = internalOrderEmail({ order: order as OrderInfo })
  const { ok: iOk, error: iErr } = await sendEmail({ to: INTERNAL_EMAIL, subject: iSubject, html: iHtml })
  if (!iOk) console.error('[email] internal notification failed:', iErr)
  else      console.log(`[email] internal notification → ${INTERNAL_EMAIL}`)

  // 3. Telegram push to owner
  const sid      = order.id.slice(-8).toUpperCase()
  const addr     = order.shipping_address as { firstName?: string; lastName?: string } | null
  const customer = addr
    ? [addr.firstName, addr.lastName].filter((s): s is string => !!s).join(' ')
    : (order.email ?? '—')
  const itemCount = (order.order_items as { qty: number }[]).reduce((n, i) => n + i.qty, 0)
  await sendTelegram(
    `🛒 <b>Neue Bestellung</b> #${sid}\n` +
    `💶 €${(order.total as number).toFixed(2)}\n` +
    `👤 ${customer}\n` +
    `📦 ${itemCount} Artikel\n` +
    `✅ Bezahlt`
  )
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
      if (error) {
        console.error('[webhook] mark paid failed:', error.message)
      } else {
        console.log(`[webhook] ${orderId} → paid`)
        // Customer-facing order confirmation, in the locale that was active
        // at checkout (passed through Stripe metadata).
        await sendOrderConfirmation(orderId, pi.metadata?.locale)
      }
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
