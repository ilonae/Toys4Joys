#!/usr/bin/env node
/**
 * Copy all product images from prod Supabase Storage → dev Supabase Storage.
 *
 * Usage:
 *   PROD_URL=https://xxx.supabase.co  PROD_KEY=eyJ... \
 *   DEV_URL=https://yyy.supabase.co   DEV_KEY=eyJ... \
 *   node scripts/copy-images-prod-to-dev.mjs
 *
 * Both keys should be the service role key of each project.
 */

const PROD_URL = process.env.PROD_URL
const PROD_KEY = process.env.PROD_KEY
const DEV_URL  = process.env.DEV_URL
const DEV_KEY  = process.env.DEV_KEY
const BUCKET   = 'product-images'

if (!PROD_URL || !PROD_KEY || !DEV_URL || !DEV_KEY) {
  console.error(`
❌  Missing credentials. Run with:

    PROD_URL=https://xxx.supabase.co  PROD_KEY=eyJ... \\
    DEV_URL=https://yyy.supabase.co   DEV_KEY=eyJ... \\
    node scripts/copy-images-prod-to-dev.mjs
  `)
  process.exit(1)
}

async function listFiles(supabaseUrl, key) {
  const res = await fetch(
    `${supabaseUrl}/storage/v1/object/list/${BUCKET}`,
    {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefix: '', limit: 1000, offset: 0 }),
    }
  )
  if (!res.ok) throw new Error(`List failed: ${res.status} ${await res.text()}`)
  return res.json() // array of { name, ... }
}

async function downloadFile(supabaseUrl, key, filename) {
  const res = await fetch(
    `${supabaseUrl}/storage/v1/object/${BUCKET}/${filename}`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  )
  if (!res.ok) throw new Error(`Download failed for ${filename}: ${res.status}`)
  return res.arrayBuffer()
}

async function uploadFile(supabaseUrl, key, filename, data, contentType) {
  const res = await fetch(
    `${supabaseUrl}/storage/v1/object/${BUCKET}/${filename}`,
    {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': contentType,
        'x-upsert': 'true', // overwrite if already exists
      },
      body: data,
    }
  )
  if (!res.ok) {
    const text = await res.text()
    // Ignore duplicate errors
    if (text.includes('already exists')) return 'skipped'
    throw new Error(`Upload failed for ${filename}: ${res.status} ${text}`)
  }
  return 'uploaded'
}

function getContentType(filename) {
  const ext = filename.split('.').pop()?.toLowerCase()
  const map = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }
  return map[ext] ?? 'application/octet-stream'
}

async function main() {
  console.log('\n📦  Listing files in prod bucket…')
  const files = await listFiles(PROD_URL, PROD_KEY)
  const images = files.filter(f => f.name && !f.name.endsWith('/'))
  console.log(`    Found ${images.length} images\n`)

  let copied = 0, skipped = 0, failed = 0

  for (const file of images) {
    const name = file.name
    process.stdout.write(`  → ${name} … `)
    try {
      const data        = await downloadFile(PROD_URL, PROD_KEY, name)
      const contentType = getContentType(name)
      const result      = await uploadFile(DEV_URL, DEV_KEY, name, data, contentType)
      if (result === 'skipped') { console.log('already exists'); skipped++ }
      else                      { console.log('✓'); copied++ }
    } catch (err) {
      console.log(`✗ ${err.message}`)
      failed++
    }
  }

  console.log(`
✅  Done!
    Copied:  ${copied}
    Skipped: ${skipped}
    Failed:  ${failed}
  `)
}

main().catch(err => { console.error('\n❌ ', err.message); process.exit(1) })
