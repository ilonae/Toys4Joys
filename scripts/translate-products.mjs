#!/usr/bin/env node
/**
 * Translate ALL product names and descriptions from German into
 * English and Spanish via DeepL, then write back into the JSONB
 * columns `name_translations` and `desc_translations` on the
 * `products` table.
 *
 * Usage:
 *   SUPABASE_URL='https://xxx.supabase.co' \
 *   SUPABASE_SERVICE_KEY='eyJ...' \
 *   DEEPL_API_KEY='xxxx:fx' \
 *   node scripts/translate-products.mjs
 *
 *   Add --force to re-translate everything (default skips products
 *   that already have non-empty translations for the target locale).
 *   Add --dry-run to print what would happen without writing.
 *
 * Cost / quotas:
 *   - DeepL free tier: 500 000 chars/month → easily covers most stores.
 *   - Script uses DeepL's free-tier endpoint (api-free.deepl.com) if the
 *     API key ends in ":fx", otherwise the paid endpoint.
 *   - DeepL is called with up to 50 texts per request to minimise round-trips.
 */

// Auto-load .env if present (no extra deps — quick parser)
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const __dirname = dirname(fileURLToPath(import.meta.url))
const ENV_FILE = join(__dirname, '..', '.env')
if (existsSync(ENV_FILE)) {
  for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/i)
    if (!m) continue
    const k = m[1]
    let v = m[2]
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (!process.env[k]) process.env[k] = v
  }
}

// --dev forces use of DEV_SUPABASE_URL + DEV_SUPABASE_SERVICE_ROLE_KEY
// so a stray `.env` pointing at prod can't silently win.
const USE_DEV = process.argv.includes('--dev')

const SUPABASE_URL = USE_DEV
  ? process.env.DEV_SUPABASE_URL
  : (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)
const SUPABASE_KEY = USE_DEV
  ? process.env.DEV_SUPABASE_SERVICE_ROLE_KEY
  : (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
const DEEPL_KEY    = process.env.DEEPL_API_KEY

if (!SUPABASE_URL || !SUPABASE_KEY || !DEEPL_KEY) {
  console.error(`
❌  Missing credentials.

Found:
  SUPABASE_URL: ${SUPABASE_URL ? '✓' : '✗ (need ' + (USE_DEV ? 'DEV_SUPABASE_URL' : 'SUPABASE_URL or VITE_SUPABASE_URL') + ')'}
  SUPABASE_KEY: ${SUPABASE_KEY ? '✓' : '✗ (need ' + (USE_DEV ? 'DEV_SUPABASE_SERVICE_ROLE_KEY' : 'SUPABASE_SERVICE_ROLE_KEY') + ')'}
  DEEPL_KEY:    ${DEEPL_KEY    ? '✓' : '✗ (need DEEPL_API_KEY)'}

Run with:
    # DEV (recommended)
    DEV_SUPABASE_URL=https://xxx.supabase.co \\
    DEV_SUPABASE_SERVICE_ROLE_KEY='eyJ...' \\
    DEEPL_API_KEY='xxxx:fx' \\
    npm run translate:products -- --dev

    # PROD (skip --dev)
    SUPABASE_URL=https://xxx.supabase.co \\
    SUPABASE_SERVICE_ROLE_KEY='eyJ...' \\
    DEEPL_API_KEY='xxxx:fx' \\
    npm run translate:products
`)
  process.exit(1)
}

console.log(`🎯  Target: ${USE_DEV ? 'DEV' : 'PROD'} Supabase → ${SUPABASE_URL.replace(/^https:\/\/([^.]{6}).*/, 'https://$1***.supabase.co')}`)

const FORCE   = process.argv.includes('--force')
const DRY_RUN = process.argv.includes('--dry-run')

const SUPA_HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Prefer: 'return=minimal',
}

const DEEPL_BASE = DEEPL_KEY.endsWith(':fx')
  ? 'https://api-free.deepl.com'
  : 'https://api.deepl.com'

// ── DeepL batch translate ─────────────────────────────────────────────────
// Returns an array of translations in the same order as `texts`.
async function deeplBatch(texts, targetLang) {
  if (texts.length === 0) return []
  const body = new URLSearchParams()
  for (const text of texts) body.append('text', text)
  body.append('source_lang', 'DE')
  body.append('target_lang', targetLang)
  body.append('preserve_formatting', '1')

  const res = await fetch(`${DEEPL_BASE}/v2/translate`, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`DeepL ${res.status}: ${errBody}`)
  }
  const data = await res.json()
  return data.translations.map(t => t.text)
}

// Chunk an array into groups of N
function chunk(arr, n) {
  const out = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

// ── Fetch all products ────────────────────────────────────────────────────
async function fetchProducts() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/products?select=id,name,description,name_translations,desc_translations`,
    { headers: SUPA_HEADERS }
  )
  if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status} ${await res.text()}`)
  return res.json()
}

// ── Patch a product's translations ────────────────────────────────────────
async function patchProduct(id, nameTr, descTr) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/products?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: SUPA_HEADERS,
      body: JSON.stringify({
        name_translations: nameTr,
        desc_translations: descTr,
      }),
    }
  )
  if (!res.ok) throw new Error(`Patch ${id} failed: ${res.status} ${await res.text()}`)
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log(`🌐  Endpoint: ${DEEPL_BASE}`)
  console.log(`📦  Fetching products from Supabase…`)
  const products = await fetchProducts()
  console.log(`    ${products.length} products found.\n`)

  // Build the work list — figure out what needs translating
  const work = []
  for (const p of products) {
    const existingName = p.name_translations || {}
    const existingDesc = p.desc_translations || {}
    const needsEnName  = FORCE || !existingName.en
    const needsEsName  = FORCE || !existingName.es
    const needsEnDesc  = FORCE || !existingDesc.en
    const needsEsDesc  = FORCE || !existingDesc.es

    if (!needsEnName && !needsEsName && !needsEnDesc && !needsEsDesc) continue

    work.push({
      id:           p.id,
      name:         (p.name || '').trim(),
      description:  (p.description || '').trim(),
      existingName, existingDesc,
      needsEnName, needsEsName, needsEnDesc, needsEsDesc,
    })
  }

  console.log(`🔍  ${work.length} products need translation${FORCE ? ' (forced)' : ''}.`)
  if (work.length === 0) {
    console.log(`✅  Nothing to do.`)
    return
  }

  // For DeepL we batch: collect all names needing EN, then ES, etc.
  // We tag each text with its source row + field so we can stitch back.
  const enInputs = []
  const esInputs = []
  const tags     = { enName: [], enDesc: [], esName: [], esDesc: [] }

  for (let i = 0; i < work.length; i++) {
    const w = work[i]
    if (w.name) {
      if (w.needsEnName) { enInputs.push(w.name); tags.enName.push(i) }
      if (w.needsEsName) { esInputs.push(w.name); tags.esName.push(i) }
    }
    if (w.description) {
      if (w.needsEnDesc) { enInputs.push(w.description); tags.enDesc.push(i) }
      if (w.needsEsDesc) { esInputs.push(w.description); tags.esDesc.push(i) }
    }
  }

  // We need to keep EN names + descs separate from each other so we can map back.
  // Simpler: do 4 separate runs (en names, en descs, es names, es descs).
  // This is much easier to reason about and well within DeepL's batch size.

  async function translateField(work, field, target) {
    const need = work.filter(w => {
      if (target === 'EN-GB' && field === 'name') return w.needsEnName && w.name
      if (target === 'ES'    && field === 'name') return w.needsEsName && w.name
      if (target === 'EN-GB' && field === 'desc') return w.needsEnDesc && w.description
      if (target === 'ES'    && field === 'desc') return w.needsEsDesc && w.description
      return false
    })
    if (need.length === 0) return new Map()
    const inputs = need.map(w => field === 'name' ? w.name : w.description)
    const out = new Map()
    const batches = chunk(inputs, 50)
    let idx = 0
    for (let b = 0; b < batches.length; b++) {
      process.stdout.write(`    ${target} ${field}: batch ${b+1}/${batches.length} (${batches[b].length} texts)…\r`)
      const translated = await deeplBatch(batches[b], target)
      for (const t of translated) {
        out.set(need[idx].id, t)
        idx++
      }
    }
    process.stdout.write('\n')
    return out
  }

  if (DRY_RUN) {
    const enNameNeeds = work.filter(w => w.needsEnName && w.name).length
    const esNameNeeds = work.filter(w => w.needsEsName && w.name).length
    const enDescNeeds = work.filter(w => w.needsEnDesc && w.description).length
    const esDescNeeds = work.filter(w => w.needsEsDesc && w.description).length
    const charCount =
      work.filter(w => w.needsEnName && w.name).reduce((s, w) => s + w.name.length, 0) +
      work.filter(w => w.needsEsName && w.name).reduce((s, w) => s + w.name.length, 0) +
      work.filter(w => w.needsEnDesc && w.description).reduce((s, w) => s + w.description.length, 0) +
      work.filter(w => w.needsEsDesc && w.description).reduce((s, w) => s + w.description.length, 0)
    console.log(`
DRY RUN — would translate:
  - ${enNameNeeds} EN names
  - ${esNameNeeds} ES names
  - ${enDescNeeds} EN descriptions
  - ${esDescNeeds} ES descriptions
  ≈ ${charCount.toLocaleString()} characters total (DeepL free quota: 500 000 / month)
`)
    return
  }

  console.log(`\n🌍  Translating via DeepL…`)
  const enNames = await translateField(work, 'name', 'EN-GB')
  const esNames = await translateField(work, 'name', 'ES')
  const enDescs = await translateField(work, 'desc', 'EN-GB')
  const esDescs = await translateField(work, 'desc', 'ES')

  console.log(`\n💾  Writing back to Supabase…`)
  let ok = 0
  let fail = 0
  for (const w of work) {
    const nameTr = { ...w.existingName }
    const descTr = { ...w.existingDesc }
    if (enNames.has(w.id)) nameTr.en = enNames.get(w.id)
    if (esNames.has(w.id)) nameTr.es = esNames.get(w.id)
    if (enDescs.has(w.id)) descTr.en = enDescs.get(w.id)
    if (esDescs.has(w.id)) descTr.es = esDescs.get(w.id)
    try {
      await patchProduct(w.id, nameTr, descTr)
      ok++
      process.stdout.write(`    ✓ ${ok}/${work.length}\r`)
    } catch (e) {
      fail++
      console.error(`\n    ✗ ${w.id}: ${e.message}`)
    }
  }

  console.log(`\n\n✅  Done. ${ok} updated${fail > 0 ? `, ${fail} failed` : ''}.`)
}

main().catch(e => { console.error(e); process.exit(1) })
