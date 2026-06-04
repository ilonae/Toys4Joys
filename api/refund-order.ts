import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getVerifiedAdmin } from './_auth'

const stripe   = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const ALLOWED_ORIGIN = process.env.VERCEL_ENV === 'production'
  ? 'https://www.toys4joys.com'
  : 'http://localhost:5173'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' })

  // Verify caller is admin via JWT — no user-supplied IDs trusted
  const admin = await getVerifiedAdmin(req, supabase)
  if (!admin) return res.status(403).json({ error: 'Forbidden' })

  const { orderId } = req.body as { orderId: string }
  if (!orderId) return res.status(400).json({ error: 'Missing orderId' })

  // Fetch order
  const { data: order, error: fetchErr } = await supabase
    .from('orders').select('id, status, total, stripe_payment_intent_id').eq('id', orderId).single()
  if (fetchErr || !order) return res.status(404).json({ error: 'Order not found' })

  if (!order.stripe_payment_intent_id)
    return res.status(400).json({ error: 'No Stripe PaymentIntent on this order' })

  if (order.status === 'cancelled')
    return res.status(400).json({ error: 'Order is already cancelled' })

  // Issue refund via Stripe
  let refund: Stripe.Refund
  try {
    refund = await stripe.refunds.create(
      { payment_intent: order.stripe_payment_intent_id },
      { idempotencyKey: `refund-${orderId}` },
    )
  } catch (err: any) {
    console.error('[refund-order] stripe error:', err?.message)
    return res.status(502).json({ error: err?.message ?? 'Stripe refund failed' })
  }

  if (refund.status === 'failed') {
    return res.status(502).json({ error: 'Stripe refund failed' })
  }

  // Mark order as cancelled
  const { error: updateErr } = await supabase
    .from('orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', orderId)
  if (updateErr) console.error('[refund-order] db update failed:', updateErr.message)

  console.log(`[refund-order] ${orderId} refunded by ${admin.email} · stripe refund ${refund.id}`)
  return res.json({ ok: true, refundId: refund.id })
}
