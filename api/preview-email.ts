/**
 * Admin-only email preview endpoint.
 *
 * Renders any of the three transactional templates with either sample
 * data or REAL data from the DB. Use this on the deployed site to verify
 * what the email actually looks like in production conditions (e.g. with
 * a real order's items, real product names, real shipping address).
 *
 * Usage:
 *   GET /api/preview-email?template=welcome&locale=de
 *   GET /api/preview-email?template=order&locale=en
 *   GET /api/preview-email?template=order&order_id=<uuid>     ← real order
 *   GET /api/preview-email?template=shipping&order_id=<uuid>&tracking=00340…
 *
 *   Add &send=me@example.com to ALSO send via Brevo (otherwise just renders
 *   HTML in the browser).
 *
 * Requires: caller must be logged in AND have is_admin = true.
 * Returns:  HTML if no &send, JSON {ok:true} if &send.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { getVerifiedAdmin } from './_auth.js'
import { sendEmail } from './_brevo.js'
import { welcomeEmail, orderEmail, shippingEmail, type OrderInfo, type Locale } from './_email-templates.js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ORIGIN_ALLOWLIST = [
  'https://www.toys4joys.com',
  'https://toys4joys.com',
  'https://toys4-joys.vercel.app',
  'http://localhost:5173',
]

function pickLocale(s: unknown): Locale {
  return s === 'en' || s === 'es' ? (s as Locale) : 'de'
}

// Sample data used when no real order_id is passed
const SAMPLE_ORDER: OrderInfo = {
  id:                'abc12345-9999-4f1e-b58e-ee52e8c39f01',
  email:             'kunde@example.com',
  subtotal:          77.97,
  shipping_cost:     0,
  total:             77.97,
  shipping_address: {
    firstName: 'Anna', lastName: 'Müller',
    street:    'Friedrichstraße 42',
    zip:       '10117', city: 'Berlin', country: 'Deutschland',
  },
  order_items: [
    { name: 'Latex-Handschuh — Purpur, Innen geriffelt', qty: 1, price: 39.99 },
    { name: 'Anal Plug — Aufblasbar Silikon',            qty: 2, price: 18.99 },
  ],
}
const SAMPLE_CONFIRM_URL = 'https://www.toys4joys.com/?confirmed=1&token=preview'
const SAMPLE_TRACKING    = '00340434567894586865'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS (same-origin in production, but useful for local dev)
  const origin = req.headers.origin
  if (origin && ORIGIN_ALLOWLIST.some(o => origin === o || origin.endsWith('.vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET')     return res.status(405).json({ error: 'Method not allowed' })

  try {
    if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Server misconfigured' })
    }

    // Admin check
    const admin = await getVerifiedAdmin(req, supabase)
    if (!admin) return res.status(403).json({ error: 'Forbidden — must be logged in as an admin' })

    const template = (req.query.template as string) ?? 'welcome'
    const locale   = pickLocale(req.query.locale)
    const orderId  = req.query.order_id as string | undefined
    const sendTo   = req.query.send     as string | undefined
    const tracking = req.query.tracking as string | undefined

    let subject: string
    let html:    string

    switch (template) {
      case 'welcome': {
        const url = (req.query.confirm_url as string) ?? SAMPLE_CONFIRM_URL
        ;({ subject, html } = welcomeEmail({ confirmUrl: url, locale }))
        break
      }
      case 'order': {
        let order: OrderInfo
        if (orderId) {
          const { data, error } = await supabase
            .from('orders').select('*, order_items(*)').eq('id', orderId).single()
          if (error || !data) return res.status(404).json({ error: `order ${orderId} not found: ${error?.message ?? ''}` })
          order = data as OrderInfo
        } else {
          order = SAMPLE_ORDER
        }
        ;({ subject, html } = orderEmail({ order, locale }))
        break
      }
      case 'shipping': {
        const oid = orderId ?? SAMPLE_ORDER.id
        ;({ subject, html } = shippingEmail({ orderId: oid, trackingNumber: tracking ?? SAMPLE_TRACKING, locale }))
        break
      }
      default:
        return res.status(400).json({ error: `Unknown template '${template}'. Use welcome | order | shipping` })
    }

    // Optional: also fire off via Brevo to a real inbox
    if (sendTo) {
      const result = await sendEmail({
        to:      sendTo,
        subject: `[PREVIEW · ${template}.${locale}] ${subject}`,
        html,
      })
      if (!result.ok) return res.status(502).json({ error: 'Brevo send failed', detail: result.error })
      return res.json({ ok: true, sentTo: sendTo, subject })
    }

    // Otherwise return the rendered HTML for inline browser preview
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('X-Robots-Tag', 'noindex, nofollow') // don't get crawled
    res.setHeader('Cache-Control', 'no-store, max-age=0')
    return res.status(200).send(html)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[preview-email] unhandled exception:', e)
    return res.status(500).json({ error: 'Internal error', detail: msg })
  }
}
