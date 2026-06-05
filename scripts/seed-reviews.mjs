#!/usr/bin/env node
/**
 * Seed realistic product reviews.
 *
 * Usage:
 *   SUPABASE_URL='https://xxx.supabase.co' \
 *   SUPABASE_SERVICE_KEY='eyJ...' \
 *   node scripts/seed-reviews.mjs
 *
 * Logic:
 *   - Every product where (index % 4 === 0) gets reviews  →  ~25% of catalogue
 *   - Each selected product gets 1–3 reviews
 *   - Ratings: 3–5 stars, weighted so the average lands between 3.5 and 5
 *   - Review text is generated from the product's actual name, category,
 *     material, level and description — no generic placeholders
 *   - Spread across the last 10 months
 *   - Idempotent: clears previous seeded reviews before inserting
 */

import { writeFileSync } from 'fs'

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

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
}

async function rest(method, path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${await res.text()}`)
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// ── Name pools ────────────────────────────────────────────────────────────────

const FIRST = [
  'Lena','Sophie','Emma','Anna','Marie','Laura','Julia','Lea','Hannah','Mia',
  'Nina','Sara','Katrin','Tanja','Sandra','Vanessa','Nadine','Jessica','Petra','Claudia',
  'Max','Tim','Felix','Jonas','Lukas','Paul','Leon','Tobias','Jan','Stefan',
  'Moritz','Markus','Andreas','Nico','Patrick','Philipp','David','Florian','Christian','Thomas',
]
const LAST = ['M.','S.','K.','B.','H.','W.','F.','R.','L.','N.','T.','G.','D.','P.','J.','C.','E.','A.']

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function author()  { return `${pick(FIRST)} ${pick(LAST)}` }

// ── Rating distribution ───────────────────────────────────────────────────────
// Pool:  5★×9, 4★×7, 3★×4  →  avg ≈ 4.25  (well above 3.5)
const RATING_POOL = [5,5,5,5,5,5,5,5,5, 4,4,4,4,4,4,4, 3,3,3,3]
function rating()  { return pick(RATING_POOL) }

// ── Date helpers ──────────────────────────────────────────────────────────────
function randomDate() {
  const ms = Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 300 // last 10 months
  return new Date(ms).toISOString()
}

// ── Review generator ──────────────────────────────────────────────────────────

const OPENERS_5 = [
  n => `${n} — einfach perfekt.`,
  n => `Absolut begeistert von ${n}!`,
  n => `${n} hat meine Erwartungen übertroffen.`,
  n => `Sehr zufrieden mit ${n}.`,
  n => `${n} ist genau das, was ich gesucht habe.`,
  n => `Ich bestelle ${n} nicht zum letzten Mal.`,
  n => `${n} — ein Kauf ohne Reue.`,
]
const OPENERS_4 = [
  n => `${n} macht insgesamt einen guten Eindruck.`,
  n => `Bin zufrieden mit ${n}, kleinere Abzüge aber nur wegen Details.`,
  n => `${n} erfüllt seinen Zweck sehr gut.`,
  n => `Gutes Produkt — ${n} hält was es verspricht.`,
  n => `${n} ist solide verarbeitet und macht Spaß.`,
]
const OPENERS_3 = [
  n => `${n} ist okay, aber nichts Besonderes.`,
  n => `Für den Preis ist ${n} in Ordnung.`,
  n => `${n} erfüllt seinen Zweck, mehr aber auch nicht.`,
  n => `Mittelmäßig — ${n} hat mich weder begeistert noch enttäuscht.`,
]

const MATERIAL_COMMENTS = {
  'Silikon': [
    'Das Silikon fühlt sich angenehm weich an und lässt sich leicht reinigen.',
    'Körpersicheres Silikon, geruchsneutral — genau wie angegeben.',
    'Das Material ist hautfreundlich und lässt sich gut desinfizieren.',
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
    'Das Material ist überraschend weich und angenehm.',
  ],
}

const DELIVERY = [
  'Lieferung war diskret und schnell.',
  'Diskret verpackt — Nachbarn werden es nie wissen. 👌',
  'Versand hat nur zwei Tage gedauert, alles gut geschützt.',
  'Schnelle Lieferung, neutrale Verpackung wie versprochen.',
  'Kam in einem unscheinbaren Paket an — perfekt.',
]

const QUALITY_GOOD = [
  'Verarbeitung ist makellos.',
  'Qualität für den Preis ist absolut top.',
  'Alles exakt so wie auf den Fotos.',
  'Keine scharfen Kanten, nichts wackelt — solide Arbeit.',
  'Deutlich hochwertiger als erwartet.',
]

const QUALITY_OK = [
  'Qualität ist okay, für den Preis vertretbar.',
  'Verarbeitung könnte etwas sorgfältiger sein.',
  'Für Einsteiger gut geeignet, Fortgeschrittene wollen vielleicht mehr.',
  'Material ist in Ordnung, fühlt sich nicht billig an.',
]

const CAT_COMMENTS = {
  'Latex & Fetischwear': [
    'Sitzt wie eine zweite Haut.',
    'Das Anziehen braucht etwas Übung — dafür ist das Ergebnis atemberaubend.',
    'Mein Partner war sofort begeistert.',
    'Sieht umwerfend aus und trägt sich erstaunlich komfortabel.',
    'Sehr sexy, Passform stimmt.',
  ],
  'BDSM & Kontrolle': [
    'Keine scharfen Kanten, alles sicher — wichtig bei diesem Produkttyp.',
    'Robust genug für intensive Sessions.',
    'Genau die richtige Balance zwischen Komfort und Funktion.',
    'Stabil verarbeitet, hält was es verspricht.',
    'Mein Partner und ich sind beide sehr zufrieden.',
  ],
  'Vibratoren & Elektro': [
    'Überraschend leise für die Leistung.',
    'Die verschiedenen Intensitätsstufen sind gut abgestuft.',
    'Akku hält länger als angegeben — positiv überrascht.',
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
    'Sicherheitsbase sitzt fest — keine Kompromisse bei der Sicherheit.',
    'Oberfläche ist glatt und angenehm.',
    'Gradueller Aufbau ist perfekt zum Eingewöhnen.',
    'Material ist weich genug, aber mit genug Stabilität.',
  ],
}

const LEVEL_COMMENTS = {
  'Beginner':     ['Perfekt für Einsteiger.', 'Ideal zum Ausprobieren.', 'Einsteigerfreundlich — gute Wahl.'],
  'Intermediate': ['Für Geübte genau richtig.', 'Schön für mittleres Level.'],
  'Advanced':     ['Anspruchsvoll und befriedigend.', 'Etwas für Erfahrene — sehr lohnend.'],
  'Expert':       ['Nichts für Anfänger — aber genau das macht es interessant.', 'Expert-Level, macht seinem Namen Ehre.'],
  'All levels':   [],
}

function generateBody(product, stars) {
  const name   = product.name
  const cat    = product.cat   ?? ''
  const mat    = product.mat   ?? ''
  const lvl    = product.lvl   ?? 'All levels'
  const desc   = (product.description ?? '').slice(0, 120)

  const sentences = []

  // 1. Opener
  const openers = stars === 5 ? OPENERS_5 : stars === 4 ? OPENERS_4 : OPENERS_3
  sentences.push(pick(openers)(name))

  // 2. Material comment (if material matches a known type)
  const matchedMat = Object.keys(MATERIAL_COMMENTS).find(m => mat.toLowerCase().includes(m.toLowerCase()))
  if (matchedMat && Math.random() < 0.55) {
    sentences.push(pick(MATERIAL_COMMENTS[matchedMat]))
  }

  // 3. Category-specific comment
  const catLines = CAT_COMMENTS[cat]
  if (catLines && Math.random() < 0.7) {
    sentences.push(pick(catLines))
  }

  // 4. Level comment (occasionally)
  const lvlLines = LEVEL_COMMENTS[lvl]
  if (lvlLines?.length && Math.random() < 0.35) {
    sentences.push(pick(lvlLines))
  }

  // 5. Quality comment
  if (stars >= 4 && Math.random() < 0.6) {
    sentences.push(pick(QUALITY_GOOD))
  } else if (stars === 3 && Math.random() < 0.5) {
    sentences.push(pick(QUALITY_OK))
  }

  // 6. Delivery mention (60% of reviews)
  if (Math.random() < 0.6) {
    sentences.push(pick(DELIVERY))
  }

  // Cap at 3 sentences so reviews stay natural length
  return sentences.slice(0, 3).join(' ')
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n📦  Fetching products…')
  const products = await rest('GET', '/products?select=id,name,cat,mat,lvl,description&order=created_at.asc&limit=1000')
  console.log(`    ${products.length} products found\n`)

  // Clear previously seeded reviews (identified by the "Vorname I." pattern)
  await rest('DELETE', `/reviews?author=like.*%20?.`, null).catch(() => null)
  // Broader clean: delete all seeded reviews
  await rest('DELETE', `/reviews?created_at=gte.${new Date(Date.now() - 1000*60*60*24*305).toISOString()}`, null).catch(() => null)

  const toInsert = []

  products.forEach((product, i) => {
    if (i % 4 !== 0) return // 25% selection

    const numReviews = 1 + Math.floor(Math.random() * 3) // 1–3

    for (let r = 0; r < numReviews; r++) {
      const stars = rating()
      toInsert.push({
        product_id: product.id,
        author:     author(),
        rating:     stars,
        body:       generateBody(product, stars),
        created_at: randomDate(),
      })
    }
  })

  console.log(`📝  Inserting ${toInsert.length} reviews for ${toInsert.reduce((s) => s + 1, 0)} slots across ${Math.ceil(products.length / 4)} products…\n`)

  // Insert in batches of 50
  const BATCH = 50
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH)
    await rest('POST', '/reviews', batch)
    process.stdout.write(`  ${Math.min(i + BATCH, toInsert.length)}/${toInsert.length} inserted\r`)
  }

  console.log('\n\n🔄  Updating product aggregates…')

  // Fetch all inserted reviews grouped by product
  const reviews = await rest('GET', '/reviews?select=product_id,rating&limit=10000')
  const byProduct = {}
  for (const r of reviews) {
    if (!byProduct[r.product_id]) byProduct[r.product_id] = []
    byProduct[r.product_id].push(r.rating)
  }

  let updated = 0
  for (const [productId, ratings] of Object.entries(byProduct)) {
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length
    await rest('PATCH', `/products?id=eq.${productId}`, {
      rating: Math.round(avg * 10) / 10,
      rev:    ratings.length,
    })
    updated++
  }

  console.log(`  ✓ ${updated} products updated`)

  const avgRating = toInsert.reduce((s, r) => s + r.rating, 0) / toInsert.length
  console.log(`
✅  Done!
    Reviews inserted : ${toInsert.length}
    Products covered : ~${Math.ceil(products.length / 4)} (25%)
    Average rating   : ${avgRating.toFixed(2)} ★
  `)
}

main().catch(err => { console.error('\n❌ ', err.message); process.exit(1) })
