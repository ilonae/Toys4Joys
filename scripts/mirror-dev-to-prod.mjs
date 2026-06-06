#!/usr/bin/env node
/**
 * Mirror DEV Supabase → PROD Supabase.
 *
 * Scope:
 *   - products   : overwrite all 41 rows with dev data (translations,
 *                  supplier_sku, names, descriptions, images, etc.)
 *   - reviews    : copy all rows from dev to prod (preserve UUIDs)
 *   - wishlists  : copy dev rows, remapping user_ids by email match
 *   - profiles   : for emails that match an existing prod auth user,
 *                  copy dev's profile data onto the existing prod profile
 *   - auth users : create prod accounts for any dev-only emails, with
 *                  a random password (recipient must use "forgot password"
 *                  on first sign-in). Profile copied + is_admin preserved.
 *
 * Skipped:
 *   - orders, order_items: by user choice
 *   - storage   : both sides have 185 files — assumed already in sync
 *
 * Modes:
 *   --dry-run   show what would happen, don't write
 *   (default)   apply changes
 *
 * Run:
 *   node scripts/mirror-dev-to-prod.mjs --dry-run
 *   node scripts/mirror-dev-to-prod.mjs
 */

// ── Credentials (hard-coded for this one-shot migration) ──────────────────
const DEV_URL  = 'https://cepvqygmliifrqihmplu.supabase.co'
const DEV_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlcHZxeWdtbGlpZnJxaWhtcGx1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDU5OTUxOSwiZXhwIjoyMDk2MTc1NTE5fQ.dAFJ1F_aBN_2PHlTrDEXgdGp6bmT1tvwGAf-23bijiM'
const PROD_URL = 'https://uglhpvdxaxtgnajdjekf.supabase.co'
const PROD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbGhwdmR4YXh0Z25hamRqZWtmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYxNTI2MCwiZXhwIjoyMDk0MTkxMjYwfQ.H1xA9VOvfhHOGZwkyjJaK4wdpAwaOhqdTVDEq8UNaeY'

const DRY = process.argv.includes('--dry-run')

const headers = (key) => ({
  apikey:        key,
  Authorization: `Bearer ${key}`,
  'Content-Type':'application/json',
})

const log    = (...a) => console.log(' ', ...a)
const header = (s)    => console.log(`\n── ${s} ──`)

// ── Helpers ────────────────────────────────────────────────────────────────
async function get(url, key, path) {
  const r = await fetch(`${url}/rest/v1/${path}`, { headers: headers(key) })
  if (!r.ok) throw new Error(`GET ${path}: ${r.status} ${await r.text()}`)
  return r.json()
}

async function upsert(url, key, table, rows, onConflict) {
  if (DRY) { log(`DRY: would upsert ${rows.length} rows into ${table}`); return { ok: true } }
  const params = onConflict ? `?on_conflict=${onConflict}` : ''
  const r = await fetch(`${url}/rest/v1/${table}${params}`, {
    method:  'POST',
    headers: { ...headers(key), Prefer: 'resolution=merge-duplicates,return=minimal' },
    body:    JSON.stringify(rows),
  })
  if (!r.ok) throw new Error(`UPSERT ${table}: ${r.status} ${await r.text()}`)
  return { ok: true }
}

async function listAuthUsers(url, key) {
  const r = await fetch(`${url}/auth/v1/admin/users?per_page=200`, { headers: headers(key) })
  if (!r.ok) throw new Error(`auth/users: ${r.status} ${await r.text()}`)
  const j = await r.json()
  return j.users ?? []
}

async function createAuthUser(url, key, { email, password, user_metadata }) {
  if (DRY) { log(`DRY: would createUser email=${email}`); return { id: '<dry-run-id>' } }
  const r = await fetch(`${url}/auth/v1/admin/users`, {
    method:  'POST',
    headers: headers(key),
    body:    JSON.stringify({ email, password, email_confirm: true, user_metadata }),
  })
  if (!r.ok) throw new Error(`createUser ${email}: ${r.status} ${await r.text()}`)
  return r.json()
}

function randomPassword() {
  // 24 url-safe characters — strong enough to require a reset rather than be guessed
  return Array.from(crypto.getRandomValues(new Uint8Array(18)))
    .map(b => 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'[b % 54])
    .join('')
}

// ── 1. PRODUCTS ────────────────────────────────────────────────────────────
async function syncProducts() {
  header('PRODUCTS')
  const dev  = await get(DEV_URL,  DEV_KEY,  'products?select=*')
  const prod = await get(PROD_URL, PROD_KEY, 'products?select=id')
  log(`dev: ${dev.length} rows · prod: ${prod.length} rows`)

  // Upsert overwrites by primary key (UUIDs match across both projects)
  await upsert(PROD_URL, PROD_KEY, 'products', dev, 'id')
  log(`✓ upserted ${dev.length} products → prod`)
}

// ── 2. REVIEWS ─────────────────────────────────────────────────────────────
async function syncReviews() {
  header('REVIEWS')
  const dev = await get(DEV_URL, DEV_KEY, 'reviews?select=*')
  log(`dev: ${dev.length} rows`)

  // Reviews reference auth.users(user_id) on delete set null — if the dev
  // user_id doesn't exist on prod auth.users, FK would normally fail. But
  // because the column allows NULL, we just blank it out for rows whose
  // user is dev-only. Author text + rating + body still preserved.
  const prodAuthIds = new Set((await listAuthUsers(PROD_URL, PROD_KEY)).map(u => u.id))
  const sanitised = dev.map(r => ({
    ...r,
    user_id: r.user_id && prodAuthIds.has(r.user_id) ? r.user_id : null,
  }))
  await upsert(PROD_URL, PROD_KEY, 'reviews', sanitised, 'id')
  log(`✓ upserted ${sanitised.length} reviews → prod`)
}

// ── 3. PROFILES + AUTH USERS ───────────────────────────────────────────────
async function syncProfiles() {
  header('AUTH USERS + PROFILES')

  const devAuth   = await listAuthUsers(DEV_URL,  DEV_KEY)
  const prodAuth  = await listAuthUsers(PROD_URL, PROD_KEY)
  const devProf   = await get(DEV_URL,  DEV_KEY,  'profiles?select=*')
  const prodProf  = await get(PROD_URL, PROD_KEY, 'profiles?select=*')
  log(`auth users — dev:${devAuth.length} prod:${prodAuth.length}`)
  log(`profiles   — dev:${devProf.length} prod:${prodProf.length}`)

  // Build: email → prod user_id (case-insensitive)
  const prodByEmail = new Map(prodAuth.map(u => [u.email?.toLowerCase(), u]))
  // dev_uid → dev auth user
  const devUserById = new Map(devAuth.map(u => [u.id, u]))
  // dev_uid → prod_uid (used by wishlists too)
  const idMap = new Map()
  // Profiles to upsert on prod (keyed by their prod user_id)
  const profileUpserts = []
  // Notes for human review
  const created = [], merged = [], skipped = []

  for (const dp of devProf) {
    const du = devUserById.get(dp.id)
    if (!du) { skipped.push(`profile ${dp.id} has no matching dev auth user`); continue }
    const email = du.email?.toLowerCase()
    if (!email) { skipped.push(`dev user ${dp.id} has no email`); continue }

    const prodUser = prodByEmail.get(email)
    let prodUserId
    if (prodUser) {
      prodUserId = prodUser.id
      merged.push(`  • ${email} → prod ${prodUserId.slice(0,8)}.. (profile data merged from dev)`)
    } else {
      // Dev-only user — create on prod with a random password (user must
      // reset on first sign-in via "forgot password")
      const newUser = await createAuthUser(PROD_URL, PROD_KEY, {
        email:    du.email,
        password: randomPassword(),
        user_metadata: du.user_metadata ?? {},
      })
      prodUserId = newUser.id ?? '<dry-run>'
      created.push(`  • ${email} → prod ${prodUserId.slice(0,8)}.. (NEW — must use forgot-password)`)
    }
    idMap.set(dp.id, prodUserId)

    profileUpserts.push({
      ...dp,
      id: prodUserId,           // remap to prod user_id (may differ from dev)
    })
  }

  if (DRY) {
    log('DRY: profile changes preview:')
    for (const m of merged)  log(m)
    for (const c of created) log(c)
    for (const s of skipped) log(`  (skip) ${s}`)
  }
  if (profileUpserts.length > 0) {
    await upsert(PROD_URL, PROD_KEY, 'profiles', profileUpserts, 'id')
    log(`✓ upserted ${profileUpserts.length} profiles → prod`)
  }
  if (!DRY) {
    for (const m of merged)  log(m)
    for (const c of created) log(c)
    for (const s of skipped) log(`  (skip) ${s}`)
  }
  return idMap
}

// ── 4. WISHLISTS ───────────────────────────────────────────────────────────
async function syncWishlists(idMap) {
  header('WISHLISTS')
  const dev = await get(DEV_URL, DEV_KEY, 'wishlists?select=*')
  log(`dev: ${dev.length} rows`)

  // Remap user_ids dev→prod via the map we built during profile sync.
  // Any dev user that didn't get mapped is dropped — its wishlist would
  // be orphaned on prod.
  const remapped = dev
    .map(w => {
      const newUserId = idMap.get(w.user_id)
      if (!newUserId) return null
      return { ...w, user_id: newUserId }
    })
    .filter(Boolean)

  log(`mapped ${remapped.length} of ${dev.length} (others skipped — no prod user)`)
  if (remapped.length > 0) {
    await upsert(PROD_URL, PROD_KEY, 'wishlists', remapped, 'user_id,product_id')
    log(`✓ upserted ${remapped.length} wishlists → prod`)
  }
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${DRY ? '🧪 DRY RUN MODE — no writes' : '🚀 LIVE MODE — writing to prod'}\n`)
  console.log(`dev  : ${DEV_URL}`)
  console.log(`prod : ${PROD_URL}`)

  await syncProducts()
  await syncReviews()
  const idMap = await syncProfiles()
  await syncWishlists(idMap)

  console.log(`\n${DRY ? '🧪 DRY RUN complete — re-run without --dry-run to apply' : '✅ Migration complete.'}`)
}

main().catch(e => { console.error('\n❌', e.message); process.exit(1) })
