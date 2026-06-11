#!/usr/bin/env tsx
/**
 * Develop + test the three transactional email templates locally.
 *
 *   - welcomeEmail    (registration confirmation)
 *   - orderEmail      (order confirmation with order number + items)
 *   - shippingEmail   (shipped + tracking number)
 *
 * Imports the live template module from `api/_email-templates.ts`, so any
 * edit there is reflected on the next run. No CI roundtrip needed.
 *
 * What it does:
 *
 *   1) Renders every (template × locale) combo to standalone HTML files
 *      in `.email-previews/` at the repo root. 9 files total (3 × 3).
 *   2) Writes an index.html with thumbnails so you can flip between them.
 *   3) Opens the index in your default browser.
 *   4) Optionally, sends one or more of them to a real inbox via Brevo so
 *      you can verify rendering in Gmail / Apple Mail / Outlook (which all
 *      strip styles differently than a desktop browser would).
 *
 * Usage:
 *
 *   # Render + open in browser (no sending)
 *   npm run preview:emails
 *
 *   # Same + send all 9 variants to an inbox
 *   npm run preview:emails -- --send your@email.com
 *
 *   # Send only a specific template, in a specific locale
 *   npm run preview:emails -- --send your@email.com --only welcome --locale en
 *
 *   # Render only, don't open the browser (CI-friendly)
 *   npm run preview:emails -- --no-open
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname }                                       from 'node:path'
import { fileURLToPath }                                       from 'node:url'
import { spawn }                                               from 'node:child_process'

import { welcomeEmail, orderEmail, shippingEmail, type OrderInfo, type Locale } from '../api/_email-templates.ts'

const __dirname  = dirname(fileURLToPath(import.meta.url))
const repoRoot   = join(__dirname, '..')

// Tiny inline env loader so we don't need a dotenv dependency.
// Reads .env.local first (most specific), then .env, without overwriting
// values already present in the process env.
function loadEnv(path: string) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/i)
    if (!m) continue
    const key = m[1]
    let val   = m[2]
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}
loadEnv(join(repoRoot, '.env.local'))
loadEnv(join(repoRoot, '.env'))

// ─── CLI args ────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
function flag(name: string): string | true | undefined {
  const i = args.indexOf(`--${name}`)
  if (i === -1) return undefined
  const next = args[i + 1]
  if (!next || next.startsWith('--')) return true
  return next
}
const sendTo: string | undefined = typeof flag('send') === 'string' ? (flag('send') as string) : undefined
const only:   string | undefined = typeof flag('only') === 'string' ? (flag('only') as string) : undefined
const locale: string | undefined = typeof flag('locale') === 'string' ? (flag('locale') as string) : undefined
const noOpen = !!flag('no-open')

// ─── Sample data ─────────────────────────────────────────────────────────
const SAMPLE_ORDER: OrderInfo = {
  id:                'abc12345-9999-4f1e-b58e-ee52e8c39f01',
  email:             'kunde@example.com',
  subtotal:          77.97,
  shipping_cost:     0,
  total:             77.97,
  shipping_address: {
    firstName: 'Anna',
    lastName:  'Müller',
    street:    'Friedrichstraße 42',
    zip:       '10117',
    city:      'Berlin',
    country:   'Deutschland',
  },
  order_items: [
    { name: 'Latex-Handschuh — Purpur, Innen geriffelt',         qty: 1, price: 39.99 },
    { name: 'Anal Plug — Aufblasbar Silikon',                    qty: 2, price: 18.99 },
  ],
}

const SAMPLE_CONFIRM_URL = 'https://www.toys4joys.com/?confirmed=1&token=preview-only-not-real'
const SAMPLE_TRACKING    = '00340434567894586865'

// ─── Variant matrix ──────────────────────────────────────────────────────
type Variant = {
  template: 'welcome' | 'order' | 'shipping'
  locale:   Locale
  subject:  string
  html:     string
  filename: string
}

const ALL_LOCALES: Locale[] = ['de', 'en', 'es']

function build(): Variant[] {
  const out: Variant[] = []
  for (const loc of ALL_LOCALES) {
    if (locale && loc !== locale) continue
    if (!only || only === 'welcome') {
      const { subject, html } = welcomeEmail({ confirmUrl: SAMPLE_CONFIRM_URL, locale: loc })
      out.push({ template: 'welcome', locale: loc, subject, html, filename: `welcome.${loc}.html` })
    }
    if (!only || only === 'order') {
      const { subject, html } = orderEmail({ order: SAMPLE_ORDER, locale: loc })
      out.push({ template: 'order', locale: loc, subject, html, filename: `order.${loc}.html` })
    }
    if (!only || only === 'shipping') {
      const { subject, html } = shippingEmail({ orderId: SAMPLE_ORDER.id, trackingNumber: SAMPLE_TRACKING, locale: loc })
      out.push({ template: 'shipping', locale: loc, subject, html, filename: `shipping.${loc}.html` })
    }
  }
  return out
}

// ─── Render to disk ──────────────────────────────────────────────────────
function renderToDisk(variants: Variant[]): string {
  const outDir = join(repoRoot, '.email-previews')
  mkdirSync(outDir, { recursive: true })
  for (const v of variants) {
    writeFileSync(join(outDir, v.filename), v.html, 'utf8')
  }

  // Index with iframes so you see everything side-by-side
  const indexHtml = `<!doctype html><html><head><meta charset="utf-8"><title>TOYS4JOYS — Email Previews</title>
<style>
  body { margin:0; font: 13px/1.4 -apple-system, BlinkMacSystemFont, sans-serif; background:#f5f5f7; color:#111 }
  h1 { font: 600 18px/1 -apple-system; padding: 18px 24px; margin:0; background:#fff; border-bottom:1px solid #ddd; }
  h1 .meta { font-weight:400; color:#888; margin-left:12px }
  .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 24px; padding: 24px; }
  .card { background:#fff; border:1px solid #ddd; border-radius: 6px; overflow:hidden; display:flex; flex-direction:column; min-height: 540px; }
  .card header { padding: 10px 14px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center; gap:8px }
  .card header b { font-weight: 600 }
  .card header em { font-style: normal; color:#888 }
  .card .subject { padding: 6px 14px; font-size: 11px; color:#666; border-bottom:1px solid #eee; background:#fafafa; word-break: break-word }
  .card a.open { padding: 2px 8px; font-size: 11px; color:#06f; text-decoration:none; border:1px solid #06f; border-radius:4px }
  iframe { flex:1; border:0; width:100%; background:#000 }
</style></head>
<body>
<h1>TOYS4JOYS — Email previews <span class="meta">${variants.length} files · generated ${new Date().toISOString()}</span></h1>
<div class="grid">
  ${variants.map(v => `
    <div class="card">
      <header>
        <b>${v.template}</b><em>${v.locale.toUpperCase()}</em>
        <a class="open" href="${v.filename}" target="_blank">open ↗</a>
      </header>
      <div class="subject">${v.subject.replace(/</g, '&lt;')}</div>
      <iframe src="${v.filename}" loading="lazy"></iframe>
    </div>`).join('')}
</div>
</body></html>`
  const indexPath = join(outDir, 'index.html')
  writeFileSync(indexPath, indexHtml, 'utf8')
  return indexPath
}

// ─── Optional: send via Brevo ───────────────────────────────────────────
async function sendViaBrevo(variant: Variant, to: string): Promise<{ ok: boolean; detail?: string }> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) return { ok: false, detail: 'BREVO_API_KEY missing in .env.local / .env' }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
    body: JSON.stringify({
      sender:      { name: 'TOYS4JOYS', email: 'info@toys4joys.com' },
      to:          [{ email: to }],
      subject:     `[PREVIEW · ${variant.template}.${variant.locale}] ${variant.subject}`,
      htmlContent: variant.html,
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '?')
    return { ok: false, detail: `${res.status}: ${text}` }
  }
  return { ok: true }
}

// ─── Open in browser (macOS) ────────────────────────────────────────────
function openInBrowser(path: string): void {
  const cmd = process.platform === 'darwin' ? 'open'
            : process.platform === 'win32'  ? 'start'
            : 'xdg-open'
  spawn(cmd, [path], { detached: true, stdio: 'ignore' }).unref()
}

// ─── Main ───────────────────────────────────────────────────────────────
async function main() {
  const variants = build()
  if (variants.length === 0) {
    console.error('No variants matched the filters. Use --only=welcome|order|shipping --locale=de|en|es')
    process.exit(1)
  }

  console.log(`\n📨 Rendering ${variants.length} email variant${variants.length === 1 ? '' : 's'}…\n`)
  const indexPath = renderToDisk(variants)
  for (const v of variants) {
    console.log(`  ✓ .email-previews/${v.filename.padEnd(20)}  ${v.subject}`)
  }
  console.log(`\nIndex: file://${indexPath}`)

  if (sendTo) {
    console.log(`\n📤 Sending to ${sendTo} via Brevo…`)
    for (const v of variants) {
      const r = await sendViaBrevo(v, sendTo)
      if (r.ok) console.log(`  ✓ sent ${v.template}.${v.locale}`)
      else      console.log(`  ✗ failed ${v.template}.${v.locale}: ${r.detail}`)
    }
  }

  if (!noOpen) openInBrowser(indexPath)
}

main().catch(e => { console.error(e); process.exit(1) })
