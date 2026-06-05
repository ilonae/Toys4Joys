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
  'Lena','Sophie','Emma','Anna','Marie','Laura','Julia','Lea','Hannah','Mia',
  'Nina','Sara','Katrin','Tanja','Sandra','Vanessa','Nadine','Jessica','Petra','Claudia',
  'Max','Tim','Felix','Jonas','Lukas','Paul','Leon','Tobias','Jan','Stefan',
  'Moritz','Markus','Andreas','Nico','Patrick','Philipp','David','Florian','Christian','Thomas',
]
const LAST = ['M.','S.','K.','B.','H.','W.','F.','R.','L.','N.','T.','G.','D.','P.','J.','C.','E.','A.']

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

const OPENERS_5 = [
  n => `${n} — einfach perfekt.`,
  n => `Absolut begeistert von ${n}!`,
  n => `${n} hat meine Erwartungen übertroffen.`,
  n => `Sehr zufrieden mit ${n}.`,
  n => `${n} ist genau das, was ich gesucht habe.`,
  n => `Ich bestelle ${n} nicht zum letzten Mal.`,
  n => `${n} — ein Kauf ohne Reue.`,
  n => `${n} überzeugt auf ganzer Linie.`,
]
const OPENERS_4 = [
  n => `${n} macht insgesamt einen guten Eindruck.`,
  n => `Bin zufrieden mit ${n}.`,
  n => `${n} erfüllt seinen Zweck sehr gut.`,
  n => `Gutes Produkt — ${n} hält was es verspricht.`,
  n => `${n} ist solide verarbeitet und macht Spaß.`,
  n => `Mit ${n} bin ich insgesamt sehr happy.`,
]
const OPENERS_3 = [
  n => `${n} ist okay, aber nichts Weltbewegendes.`,
  n => `Für den Preis ist ${n} in Ordnung.`,
  n => `${n} erfüllt seinen Zweck, mehr aber auch nicht.`,
  n => `Mittelmäßig — ${n} ist solide aber nicht begeisternd.`,
]

const MATERIAL_COMMENTS = {
  'Silikon': [
    'Das Silikon fühlt sich angenehm weich an und ist leicht zu reinigen.',
    'Körpersicheres Silikon, völlig geruchsneutral.',
    'Das Material ist hautfreundlich und sehr pflegeleicht.',
  ],
  'Latex': [
    'Das Latex liegt eng an und fühlt sich hochwertig an.',
    'Qualitativ gutes Latex — kein unangenehmer Geruch nach dem Lüften.',
    'Das Material ist strapazierfähig und sieht toll aus.',
  ],
  'Leder': [
    'Echtes Leder, sauber vernäht und angenehm in der Haptik.',
    'Das Leder ist weich und langlebig.',
    'Verarbeitung ist tadellos — Leder-Qualität stimmt.',
  ],
  'Neopren': [
    'Neopren sitzt komfortabel und ist sehr pflegeleicht.',
    'Das Material ist überraschend weich.',
  ],
  'Stahl': [
    'Hochwertiger Stahl, schwer und wertig in der Hand.',
    'Robuste Verarbeitung, glatte Oberfläche.',
  ],
  'TPE': [
    'TPE-Material ist hautfreundlich und angenehm weich.',
    'Material fühlt sich täuschend echt an.',
  ],
}

const DELIVERY = [
  'Lieferung war diskret und schnell.',
  'Diskret verpackt — perfekt.',
  'Versand hat nur zwei Tage gedauert.',
  'Schnelle Lieferung, neutrale Verpackung wie versprochen.',
  'Kam in einem unscheinbaren Paket an.',
  'Blitzschnelle Lieferung, alles gut verpackt.',
]

const QUALITY_GOOD = [
  'Verarbeitung ist makellos.',
  'Qualität für den Preis ist absolut top.',
  'Alles exakt so wie auf den Fotos.',
  'Keine scharfen Kanten, alles sauber verarbeitet.',
  'Deutlich hochwertiger als erwartet.',
]
const QUALITY_OK = [
  'Qualität ist für den Preis in Ordnung.',
  'Verarbeitung könnte etwas sorgfältiger sein.',
  'Material ist okay, fühlt sich nicht billig an.',
]

const CAT_COMMENTS = {
  'Latex & Fetischwear': [
    'Sitzt wie eine zweite Haut.',
    'Das Anziehen braucht Übung — das Ergebnis ist es wert.',
    'Mein Partner war sofort begeistert.',
    'Sieht umwerfend aus und trägt sich erstaunlich komfortabel.',
    'Sehr sexy, Passform stimmt.',
  ],
  'BDSM & Kontrolle': [
    'Keine scharfen Kanten, alles sicher — wichtig bei diesem Produkt.',
    'Robust genug für intensive Sessions.',
    'Genau die richtige Balance zwischen Komfort und Funktion.',
    'Stabil verarbeitet, hält was es verspricht.',
    'Mein Partner und ich sind beide sehr zufrieden.',
  ],
  'Vibratoren & Elektro': [
    'Überraschend leise für die Leistung.',
    'Die verschiedenen Intensitätsstufen sind gut abgestuft.',
    'Akku hält länger als angegeben.',
    'Wasserdicht wie beschrieben, funktioniert einwandfrei.',
    'Die Vibration ist kräftig ohne aufdringlich zu sein.',
  ],
  'Dildos': [
    'Größe und Gewicht sind genau richtig.',
    'Material ist körpersicher und komplett geruchsneutral.',
    'Sehr realistisch, Qualität stimmt.',
    'Sauger hält perfekt — praktisches Feature.',
    'Genau so wie auf den Bildern.',
  ],
  'Anal': [
    'Größe ist ideal für den Einstieg.',
    'Sicherheitsbase sitzt fest.',
    'Oberfläche ist glatt und angenehm.',
    'Gradueller Aufbau ist perfekt zum Eingewöhnen.',
    'Material ist weich genug mit ausreichend Stabilität.',
  ],
}

const LEVEL_COMMENTS = {
  'Beginner':     ['Perfekt für Einsteiger.', 'Ideal zum Ausprobieren.', 'Einsteigerfreundlich — gute Wahl.'],
  'Intermediate': ['Für Geübte genau richtig.'],
  'Advanced':     ['Anspruchsvoll und befriedigend.', 'Für Erfahrene — sehr lohnend.'],
  'Expert':       ['Nichts für Anfänger, aber genau das macht es interessant.'],
  'All levels':   [],
}

function generateBody(product, stars) {
  const name = product.name
  const cat  = product.cat  ?? ''
  const mat  = product.mat  ?? ''
  const lvl  = product.lvl  ?? 'All levels'

  const sentences = []

  const openers = stars === 5 ? OPENERS_5 : stars === 4 ? OPENERS_4 : OPENERS_3
  sentences.push(pick(openers)(name))

  // Material comment
  const matchedMat = Object.keys(MATERIAL_COMMENTS).find(
    m => mat.toLowerCase().includes(m.toLowerCase())
  )
  if (matchedMat && Math.random() < 0.55) {
    sentences.push(pick(MATERIAL_COMMENTS[matchedMat]))
  }

  // Category comment
  const catLines = CAT_COMMENTS[cat]
  if (catLines && Math.random() < 0.65) {
    sentences.push(pick(catLines))
  }

  // Level comment
  const lvlLines = LEVEL_COMMENTS[lvl]
  if (lvlLines?.length && Math.random() < 0.3) {
    sentences.push(pick(lvlLines))
  }

  // Quality comment
  if (stars >= 4 && Math.random() < 0.55) {
    sentences.push(pick(QUALITY_GOOD))
  } else if (stars === 3 && Math.random() < 0.45) {
    sentences.push(pick(QUALITY_OK))
  }

  // Delivery (60% of reviews)
  if (Math.random() < 0.6) sentences.push(pick(DELIVERY))

  return sentences.slice(0, 3).join(' ')
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
  for (let i = 0; i < products.length; i += BATCH) {
    const ids = products.slice(i, i + BATCH).map(p => `id.eq.${p.id}`).join(',')
    await rest('PATCH', `/products?or=(${ids})`, { rating: 0, rev: 0 })
  }
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

  for (let i = 0; i < ratingUpdates.length; i += BATCH) {
    const batch = ratingUpdates.slice(i, i + BATCH)
    await rest('POST', '/products?on_conflict=id', batch, {
      Prefer: 'resolution=merge-duplicates,return=minimal',
    })
    process.stdout.write(`  ${Math.min(i + BATCH, ratingUpdates.length)}/${ratingUpdates.length} updated\r`)
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
