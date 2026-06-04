import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const ALLOWED_ORIGIN = process.env.VERCEL_ENV === 'production'
  ? 'https://www.toys4joys.com'
  : 'http://localhost:5173'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { orderId } = req.body as { orderId?: string }

  if (!orderId || typeof orderId !== 'string' || !orderId.startsWith('pi_')) {
    return res.status(400).json({ error: 'Ungültige Bestell-ID. Sie sollte mit „pi_" beginnen.' })
  }

  try {
    const pi = await stripe.paymentIntents.retrieve(orderId)
    return res.json({
      status:   pi.status,
      amount:   pi.amount,       // in cents
      currency: pi.currency,
      created:  pi.created,      // unix timestamp
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unbekannter Fehler'
    // Stripe throws a specific error for not-found payment intents
    if (msg.includes('No such payment_intent')) {
      return res.status(404).json({ error: 'Bestellung nicht gefunden. Bitte Bestell-ID prüfen.' })
    }
    return res.status(500).json({ error: msg })
  }
}
