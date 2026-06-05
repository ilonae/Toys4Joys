#!/usr/bin/env node
/**
 * Seed product reviews + ratings.
 *
 * Usage:
 *   SUPABASE_URL='https://xxx.supabase.co' \
 *   SUPABASE_SERVICE_KEY='eyJ...' \
 *   node scripts/seed-reviews.mjs
 *
 * What it does:
 *   1. ALL products → rating set to a random value between 3.6 and 5.0
 *   2. Every 4th product (i % 4 === 0, ~25%) → 1–3 written reviews inserted
 *      whose ratings match the product's pre-assigned rating
 *   3. Products with reviews → rating & rev recalculated from actual reviews
 *
 * Prerequisites:
 *   Run supabase/create-reviews-table.sql first.
 *
 * Idempotent: clears all reviews then reseeds from scratch.
 */

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(`
❌  Missing credentials. Run with:

    SUPABASE_URL='https://xxx.supabase.co' \\
    SUPABASE_SERVICE_KEY='eyJ...' \\
    node scripts/seed-reviews.mjs
  `)
  process.exit(1)
}

const H = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Prefer: 'return=minimal',
}

async function rest(method, path, body, extra = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: { ...H, ...extra },
    body: body != null ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`)
  return text ? JSON.parse(text) : null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const FIRST = [
  // German
  'Lena','Sophie','Emma','Anna','Marie','Laura','Julia','Lea','Hannah','Mia',
  'Nina','Katrin','Tanja','Sandra','Vanessa','Nadine','Petra',
  'Max','Tim','Felix','Jonas','Lukas','Paul','Leon','Tobias','Jan','Stefan','Moritz','Florian',
  // Turkish (large community in Germany)
  'Ayşe','Fatma','Zeynep','Elif','Büşra','Selin','Derya',
  'Mehmet','Emre','Burak','Kemal','Serkan','Ozan','Cem',
  // Arabic / MENA
  'Leila','Yasmin','Nadia','Amira','Rania','Sara','Hana',
  'Omar','Karim','Tariq','Youssef','Hassan','Amir',
  // Eastern European (Polish, Czech, Romanian)
  'Katarzyna','Monika','Agnieszka','Natalia','Irina','Olga','Vera',
  'Tomasz','Marek','Jakub','Dmitri','Pavel',
  // Southern European
  'Isabella','Chiara','Sofia','Elena','Lucia','Valentina',
  'Marco','Luca','Matteo','Carlos','Diego',
  // French
  'Camille','Chloé','Manon','Inès','Océane',
  'Antoine','Théo','Hugo',
  // Asian
  'Lin','Mei','Yuki','Aiko','Ji-yeon','Minhee',
  'Kenji','Wei','Jin','Ryo',
  // Gender-neutral / short
  'Alex','Sam','Charlie','Kim','Jamie','Robin','Taylor','Riley',
]
const LAST = [
  'M.','S.','K.','B.','H.','W.','F.','R.','L.','N.',
  'T.','G.','D.','P.','J.','C.','E.','A.','O.','Y.',
  'Z.','V.','I.','X.','Q.',
]

function pick(arr)  { return arr[Math.floor(Math.random() * arr.length)] }
function author()   { return `${pick(FIRST)} ${pick(LAST)}` }

// Rating pool: 5★×9, 4★×7, 3★×4 → avg ≈ 4.25
// Only used for written reviews — base ratings are pre-assigned.
const RATING_POOL = [5,5,5,5,5,5,5,5,5, 4,4,4,4,4,4,4, 3,3,3,3]

// Random date within the last 10 months
function randomDate() {
  return new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 300).toISOString()
}

// Random rating between 3.6 and 5.0, rounded to 1 decimal
function randomBaseRating() {
  return Math.round((3.6 + Math.random() * 1.4) * 10) / 10
}

// Pick a discrete star rating (3–5) that matches a base rating
function starFromBase(base) {
  if (base >= 4.5) return pick([5,5,5,4])
  if (base >= 4.0) return pick([5,4,4,4])
  return pick([4,3,3])
}

// ── Review text generation ────────────────────────────────────────────────────
// Real customers:
//  - rarely name the product
//  - often write just one thing (shipping, texture, size, reaction)
//  - mix of formal and very casual, lowercase, short fragments
//  - sometimes just emojis or two words
//  - 3★ is mild disappointment not a rant

// styles: ultra_short | shipping | texture | fit | reaction | partner | critical
// each review picks ONE style at random

const ULTRA_SHORT = {
  5: ['top!','perfekt ✓','mega gut','wieder kaufen','❤️','sehr zufrieden','empfehlenswert','klasse','passt perfekt','genau richtig','top qualität','sehr gut 👍'],
  4: ['solide','gut, gerne wieder','passt','bin zufrieden','ok+','macht was es soll'],
  3: ['naja','geht so','ist ok','für den preis ok','mittelmäßig','nicht schlecht aber auch nicht gut'],
}

const SHIPPING_ONLY = [
  'kam in 2 tagen an, verpackung war total unauffällig. mehr will ich gar nicht wissen 😄',
  'Lieferung super diskret und schnell. Paket sah aus wie normale Post.',
  'versand war blitzschnell und die verpackung verrät nichts. danke!',
  'In 3 Tagen da, neutrales Paket. Genau das was man sich erhofft.',
  'schnell geliefert und kein Absender drauf — perfekt so.',
  'kam schneller als erwartet. Verpackung einwandfrei neutral.',
  'lieferzeit top, diskret verpackt wie immer. produkt selbst auch gut.',
  '2 Tage, neutrales Paket. Was will man mehr.',
]

const TEXTURE_FEEL = [
  'Material fühlt sich viel hochwertiger an als gedacht.',
  'Textur ist angenehm, kein komischer Geruch.',
  'weich aber trotzdem stabil. genau richtig.',
  'Oberfläche ist sehr glatt, fühlt sich gut an.',
  'riecht nach nichts, material ist super.',
  'Haptik ist wirklich gut für den Preis.',
  'viel weicher als erwartet, angenehm auf der Haut.',
  'Kein Eigengeruch, lässt sich gut reinigen.',
  'fühlt sich hochwertig an, nicht billig.',
  'Material überraschend angenehm.',
]

const FIT_SIZE = {
  5: [
    'Größe stimmt genau, hab nach der Tabelle bestellt.',
    'Sitzt perfekt, hab Größe M genommen.',
    'Passt wie angegeben, bin sehr zufrieden.',
    'Maße sind exakt wie beschrieben.',
  ],
  4: [
    'Passt gut, eine Nummer größer wäre auch ok gewesen.',
    'Größe stimmt, vielleicht minimal kleiner als auf dem Foto.',
    'Sitzt gut, hätte aber auch die nächste Größe nehmen können.',
  ],
  3: [
    'Etwas kleiner als gedacht, beim nächsten Mal eine Größe mehr.',
    'Maße stimmen aber irgendwie fühlt es sich kleiner an.',
    'Größe ok, aber auf dem Foto wirkte es größer.',
  ],
}

const REACTION = {
  5: [
    'Bin verliebt. Beste Bestellung seit langem.',
    'Wow. Einfach wow.',
    'Hab es gleich ausprobiert — nicht enttäuscht worden.',
    'Ich war skeptisch, aber jetzt bin ich überzeugt.',
    'Nicht mein erstes hier, immer wieder gerne.',
    'Macht genau was ich mir erhofft hatte ❤️',
    'Hab es als Überraschung bestellt — Volltreffer.',
  ],
  4: [
    'Bin zufrieden, würde es wieder kaufen.',
    'Gut, kleiner Abzug für die Lieferzeit.',
    'Erfüllt seinen Zweck gut, nichts zu meckern.',
    'Macht Spaß, Preis ist fair.',
  ],
  3: [
    'War etwas enttäuscht, hatte mehr erwartet.',
    'Ist okay aber nicht das was ich mir vorgestellt hab.',
    'Funktioniert, aber für den Preis erwartet man mehr.',
    'Naja. Nicht schlecht, aber auch nicht besonders.',
  ],
}

const PARTNER = [
  'Mein Partner ist begeistert lol',
  'wir sind beide sehr zufrieden 😏',
  'Meine Freundin liebt es.',
  'Hat meinem Mann sehr gefallen.',
  'Zu zweit getestet — Daumen hoch von beiden.',
  'Mein Freund hat sich sehr gefreut ❤️',
  'Wir nutzen es regelmäßig, top.',
]

const COMBO_SHIPPING_PRODUCT = [
  'schnell geliefert und das produkt ist gut. was will man mehr.',
  'Lieferung war diskret, Produkt hält was es verspricht.',
  'Kam schnell an, Qualität stimmt. Gerne wieder.',
  'verpackung super unauffällig, inhalt macht spaß 😄',
  'Diskreter Versand + gute Qualität = happy customer.',
  'Schnell, diskret, gut. Drei Worte die alles sagen.',
]

function generateBody(product, stars) {
  // Style weights per star level
  // ultra_short, shipping, texture, fit, reaction, partner, combo
  const styleWeights = {
    5: ['ultra','ultra','shipping','texture','fit','reaction','reaction','partner','combo','combo'],
    4: ['ultra','shipping','shipping','texture','fit','reaction','combo','combo'],
    3: ['ultra','texture','fit','reaction','reaction'],
  }

  const style = pick(styleWeights[stars] ?? styleWeights[4])

  // ~15% of all reviews: apply casual lowercase transform
  const casual = Math.random() < 0.15

  let body = ''

  switch (style) {
    case 'ultra':
      body = pick(ULTRA_SHORT[stars] ?? ULTRA_SHORT[4])
      break
    case 'shipping':
      body = pick(SHIPPING_ONLY)
      break
    case 'texture':
      body = pick(TEXTURE_FEEL)
      // 40% chance: add a short shipping note
      if (Math.random() < 0.4) body += ' ' + pick(['Lieferung auch top.','Versand schnell und diskret.','Versand war prima.'])
      break
    case 'fit':
      body = pick((FIT_SIZE[stars] ?? FIT_SIZE[4]))
      if (Math.random() < 0.35) body += ' ' + pick(SHIPPING_ONLY).split('.')[0] + '.'
      break
    case 'reaction':
      body = pick(REACTION[stars] ?? REACTION[4])
      if (stars >= 4 && Math.random() < 0.45) body += ' ' + pick(['Versand war auch super diskret.','Lieferung top.','Kam schnell an.'])
      break
    case 'partner':
      body = pick(PARTNER)
      if (Math.random() < 0.5) body += ' ' + pick(['Versand war diskret.','Kam schnell an.','Qualität stimmt.'])
      break
    case 'combo':
    default:
      body = pick(COMBO_SHIPPING_PRODUCT)
      break
  }

  return casual ? body.toLowerCase() : body
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n📦  Fetching products…')
  const products = await rest(
    'GET',
    '/products?select=id,name,cat,mat,lvl&order=created_at.asc&limit=1000',
    null,
    { Prefer: 'return=representation' }
  )
  console.log(`    ${products.length} products\n`)

  const BATCH = 50

  // ── Step 1: Reset ALL products to rating 0 / no reviews ───────────────────
  console.log('🔄  Resetting all product ratings to 0…')
  // Single PATCH with no filter updates every row — safe here
  await rest('PATCH', '/products?id=neq.00000000-0000-0000-0000-000000000000', { rating: 0, rev: 0 })
  console.log(`  ✓ ${products.length} products reset`)

  // ── Step 2: Select 30% of products to receive ratings + reviews ────────────
  // Shuffle and take the first 30%
  const shuffled = [...products].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, Math.ceil(products.length * 0.30))
  console.log(`\n⭐  Assigning ratings to ${selected.length} products (30%)…`)

  const ratingUpdates = selected.map(p => ({
    id:     p.id,
    rating: randomBaseRating(),
    rev:    0,
  }))

  // PATCH each product individually — upsert would try INSERT and fail on NOT NULL columns
  const CONCURRENT = 10
  for (let i = 0; i < ratingUpdates.length; i += CONCURRENT) {
    await Promise.all(
      ratingUpdates.slice(i, i + CONCURRENT).map(u =>
        rest('PATCH', `/products?id=eq.${u.id}`, { rating: u.rating, rev: u.rev })
      )
    )
    process.stdout.write(`  ${Math.min(i + CONCURRENT, ratingUpdates.length)}/${ratingUpdates.length} updated\r`)
  }
  console.log(`\n  ✓ Done — 70% of products have no rating`)

  // ── Step 2: Clear old seeded reviews ─────────────────────────────────────
  console.log('\n🗑   Clearing old reviews…')
  await rest('DELETE', '/reviews?id=neq.00000000-0000-0000-0000-000000000000', null)
  console.log('  ✓ Cleared')

  // ── Step 3: Insert written reviews for the selected 30% ──────────────────
  console.log('\n📝  Generating written reviews for rated products…')
  const toInsert = []

  selected.forEach((product) => {
    const baseRating = ratingUpdates.find(r => r.id === product.id)?.rating ?? 4.0
    const numReviews = 1 + Math.floor(Math.random() * 3) // 1–3

    for (let r = 0; r < numReviews; r++) {
      const stars = starFromBase(baseRating)
      toInsert.push({
        product_id: product.id,
        author:     author(),
        rating:     stars,
        body:       generateBody(product, stars),
        created_at: randomDate(),
      })
    }
  })

  for (let i = 0; i < toInsert.length; i += BATCH) {
    await rest('POST', '/reviews', toInsert.slice(i, i + BATCH), { Prefer: 'return=minimal' })
    process.stdout.write(`  ${Math.min(i + BATCH, toInsert.length)}/${toInsert.length} inserted\r`)
  }
  console.log(`\n  ✓ ${toInsert.length} reviews across ~${Math.ceil(products.length / 4)} products`)

  // ── Step 4: Recalculate rating + rev for products that have reviews ────────
  console.log('\n🔄  Recalculating aggregates for reviewed products…')
  const allReviews = await rest(
    'GET',
    '/reviews?select=product_id,rating&limit=10000',
    null,
    { Prefer: 'return=representation' }
  )

  const byProduct = {}
  for (const r of allReviews) {
    if (!byProduct[r.product_id]) byProduct[r.product_id] = []
    byProduct[r.product_id].push(r.rating)
  }

  let updated = 0
  for (const [productId, ratings] of Object.entries(byProduct)) {
    const avg = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
    await rest('PATCH', `/products?id=eq.${productId}`, { rating: avg, rev: ratings.length })
    updated++
  }
  console.log(`  ✓ ${updated} products recalculated`)

  // ── Summary ────────────────────────────────────────────────────────────────
  const avgBase = (ratingUpdates.reduce((a,b) => a + b.rating, 0) / ratingUpdates.length).toFixed(2)
  const avgReviews = toInsert.length
    ? (toInsert.reduce((s,r) => s + r.rating, 0) / toInsert.length).toFixed(2)
    : '—'

  console.log(`
✅  Done!
    Total products              : ${products.length}
    Products with rating (30%)  : ${selected.length}
    Products without rating     : ${products.length - selected.length}
    Average rating (rated only) : ${avgBase} ★
    Written reviews inserted    : ${toInsert.length}
    Average review rating       : ${avgReviews} ★
  `)
}

main().catch(err => { console.error('\n❌ ', err.message); process.exit(1) })
