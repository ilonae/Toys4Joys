import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { calcShipping } from './_shipping'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Service role — bypasses RLS, server-side only, never exposed to frontend
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface OrderItem {
  product_id: string
  name:       string
  price:      number
  qty:        number
  image_path: string | null
}

interface RequestBody {
  amount:           number
  items:            OrderItem[]
  user_id?:         string | null
  email?:           string | null
  shipping_address?: Record<string, string> | null
}

const ALLOWED_ORIGIN = process.env.VERCEL_ENV === 'production'
  ? 'https://www.toys4joys.com'
  : 'http://localhost:5173'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { amount, items, user_id, email, shipping_address } = req.body as RequestBody

    if (!amount || amount <= 0)  return res.status(400).json({ error: 'Invalid amount' })
    if (!items?.length)          return res.status(400).json({ error: 'No items provided' })

    const country  = shipping_address?.country
    const shipping = calcShipping(amount, country)
    const total    = amount + shipping

    // ── Create pending order in Supabase ──────────────────────────────────
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id:          user_id  ?? null,
        email:            email    ?? 'guest',
        status:           'pending',
        subtotal:         amount,
        shipping_cost:    shipping,
        total,
        shipping_address: shipping_address ?? null,
      })
      .select('id')
      .single()

    if (orderError) throw new Error(`Order insert failed: ${orderError.message}`)

    // ── Insert order items ────────────────────────────────────────────────
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(
        items.map(i => ({
          order_id:   order.id,
          product_id: i.product_id,
          name:       i.name,
          price:      i.price,
          qty:        i.qty,
          image_path: i.image_path ?? null,
        }))
      )

    if (itemsError) throw new Error(`Order items insert failed: ${itemsError.message}`)

    // ── Create Stripe PaymentIntent — attach order_id in metadata ─────────
    // Idempotency key tied to order ID prevents duplicate charges on retries
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount:   Math.round(total * 100), // EUR cents
        currency: 'eur',
        automatic_payment_methods: { enabled: true },
        metadata: { order_id: order.id },
      },
      { idempotencyKey: `pi-${order.id}` }
    )

    return res.json({
      clientSecret: paymentIntent.client_secret,
      orderId:      order.id,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error'
    console.error('[create-payment-intent]', message)
    return res.status(500).json({ error: message })
  }
}
