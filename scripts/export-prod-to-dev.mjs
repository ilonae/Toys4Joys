#!/usr/bin/env node
/**
 * Export production product data → ready-to-paste SQL for the dev project.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_KEY=eyJ... \
 *   node scripts/export-prod-to-dev.mjs
 *
 * Output: supabase/seed-products-from-prod.sql
 *
 * What it copies:  products (all rows + images)
 * What it skips:   orders, order_items, profiles, auth.users
 *                  (customer data — never copy to dev)
 */

import { writeFileSync } from 'fs'
import { resolve } from 'path'

const SUPABASE_URL      = process.env.SUPABASE_URL
const SUPABASE_KEY      = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(`
❌  Missing credentials. Run with:

    SUPABASE_URL=https://xxxx.supabase.co \\
    SUPABASE_SERVICE_KEY=eyJ... \\
    node scripts/export-prod-to-dev.mjs
  `)
  process.exit(1)
}

// ── Fetch all rows from a table via Supabase REST API ────────

async function fetchAll(table) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&order=created_at.asc&limit=1000`
  const res = await fetch(url, {
    headers: {
      apikey:        SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept:        'application/json',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to fetch ${table}: ${res.status} ${text}`)
  }
  return res.json()
}

// ── Value → SQL literal ───────────────────────────────────────

function toSql(value) {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'boolean')  return value ? 'TRUE' : 'FALSE'
  if (typeof value === 'number')   return String(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return "ARRAY[]::text[]"
    return `ARRAY[${value.map(v => `'${String(v).replace(/'/g, "''")}'`).join(', ')}]`
  }
  if (typeof value === 'object') {
    // JSONB
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`
  }
  // String — escape single quotes
  return `'${String(value).replace(/'/g, "''")}'`
}

// ── Generate INSERT statements ────────────────────────────────

function toInserts(table, rows) {
  if (!rows.length) return `-- No rows in ${table}\n`

  const cols = Object.keys(rows[0])
  return rows.map(row => {
    const vals = cols.map(c => toSql(row[c]))
    return (
      `INSERT INTO public.${table} (${cols.join(', ')})\n` +
      `  VALUES (${vals.join(', ')})\n` +
      `  ON CONFLICT (id) DO NOTHING;`
    )
  }).join('\n') + '\n'
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  console.log(`\n📦  Connecting to ${SUPABASE_URL}…\n`)

  const products = await fetchAll('products')
  console.log(`  ✓ products      — ${products.length} rows`)

  const now = new Date().toISOString()
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1] ?? 'unknown'

  const sql = [
    `-- ============================================================`,
    `-- TOYS4JOYS — Product data export from production`,
    `-- Source project : ${projectRef}`,
    `-- Exported at    : ${now}`,
    `-- ============================================================`,
    `-- ⚠  Run your schema migrations FIRST (in this order):`,
    `--    1. schema.sql`,
    `--    2. orders.sql`,
    `--    3. add-admin-stock.sql`,
    `--    4. add-product-images.sql`,
    `--    5. add-tracking.sql`,
    `--    6. rls-hardening.sql`,
    `--    THEN paste this file.`,
    `-- ============================================================`,
    ``,
    `-- Products (${products.length} rows)`,
    toInserts('products', products),
    ``,
    `SELECT count(*) AS products_imported FROM public.products;`,
  ].join('\n')

  const outPath = resolve('supabase/seed-products-from-prod.sql')
  writeFileSync(outPath, sql, 'utf8')

  console.log(`\n✅  Done!\n`)
  console.log(`   Output → supabase/seed-products-from-prod.sql`)
  console.log(`\n   Next steps:`)
  console.log(`   1. Create new Supabase project at supabase.com`)
  console.log(`   2. SQL Editor → run schema.sql, orders.sql, add-admin-stock.sql,`)
  console.log(`      add-tracking.sql, rls-hardening.sql (in that order)`)
  console.log(`   3. SQL Editor → paste seed-products-from-prod.sql`)
  console.log(`   4. Copy the new project's URL + keys into .env.development\n`)
}

main().catch(err => {
  console.error('\n❌ ', err.message)
  process.exit(1)
})
