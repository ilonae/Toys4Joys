-- ============================================================
-- TOYS4JOYS — Customer Reviews Seed
-- Run in: Supabase Dashboard → SQL Editor → New query
--
-- What this does:
--   1. Creates public.reviews table with RLS
--   2. Seeds realistic German reviews for ~40% of products
--      (1–5 reviews per product, avg rating ~3.9★)
--   3. Updates products.rating + products.rev aggregates
--
-- Safe to re-run: clears seeded reviews first.
-- ============================================================


-- ── 1. Reviews table ──────────────────────────────────────────

create table if not exists public.reviews (
  id          uuid        primary key default gen_random_uuid(),
  product_id  uuid        not null references public.products(id) on delete cascade,
  author      text        not null,
  rating      smallint    not null check (rating between 1 and 5),
  body        text        not null,
  created_at  timestamptz not null default now()
);

alter table public.reviews enable row level security;

drop policy if exists "Anyone can read reviews"     on public.reviews;
drop policy if exists "Service role manages reviews" on public.reviews;
drop policy if exists "Admin can manage reviews"     on public.reviews;

create policy "Anyone can read reviews"
  on public.reviews for select using (true);

create policy "Service role manages reviews"
  on public.reviews for all using (auth.role() = 'service_role');

create policy "Admin can manage reviews"
  on public.reviews for all
  using   (public.is_admin())
  with check (public.is_admin());

create index if not exists reviews_product_id_idx on public.reviews(product_id);
create index if not exists reviews_created_at_idx on public.reviews(created_at desc);


-- ── 2. Seed ───────────────────────────────────────────────────

do $$
declare
  v_id    uuid;
  v_cat   text;
  v_num   integer;
  v_rating smallint;
  v_body  text;
  v_author text;
  v_at    timestamptz;
  v_r     float;
  i       integer;

  -- ── Name pools ──────────────────────────────────────────────
  fnames text[] := array[
    'Lena','Sophie','Emma','Anna','Marie','Laura','Julia','Lea',
    'Hannah','Mia','Nina','Sara','Katrin','Tanja','Sandra','Petra',
    'Max','Tim','Felix','Jonas','Lukas','Paul','Leon','Tobias',
    'Jan','Stefan','Moritz','Markus','Andreas','Nico','Patrick',
    'Philipp','David','Michael','Florian','Christian','Thomas',
    'Jessica','Nadine','Vanessa','Melanie','Sabrina','Claudia'
  ];
  linitials text[] := array[
    'M.','S.','K.','B.','H.','W.','F.','R.','L.','N.',
    'T.','G.','D.','P.','J.','C.','E.','A.','Z.','V.'
  ];

  -- ── Rating pool (weighted) ───────────────────────────────────
  -- 5★ ×7, 4★ ×6, 3★ ×3, 2★ ×2, 1★ ×1  →  avg ≈ 3.9
  rpool smallint[] := array[
    5,5,5,5,5,5,5,
    4,4,4,4,4,4,
    3,3,3,
    2,2,
    1
  ];

  -- ── Review texts ─────────────────────────────────────────────

  -- Generic positive (4–5★)
  pos_gen text[] := array[
    'Bin sehr zufrieden mit dem Kauf! Qualität top, Lieferung diskret wie versprochen.',
    'Absolut empfehlenswert. Verarbeitung makellos, Material hochwertig.',
    'Super Produkt! Genau das, was ich gesucht hatte. Kommt definitiv wieder.',
    'Tolle Qualität für den Preis. Bin begeistert und werde nochmal bestellen.',
    'Mein Partner und ich sind beide begeistert. Top Verarbeitung, schneller Versand.',
    'Genau wie beschrieben. Qualität stimmt, Preis-Leistung passt perfekt.',
    'Sehr solides Produkt. Hält was es verspricht. Uneingeschränkt zu empfehlen.',
    'Lieferung blitzschnell, diskrete Verpackung, Produkt erstklassig. 5 Sterne.',
    'Endlich ein Shop der hält was er verspricht. Qualität und Lieferung top.',
    'Überraschend gute Qualität. Besser als erwartet. Klare Kaufempfehlung!',
    'Alles perfekt. Bin sehr zufrieden und komme definitiv wieder.',
    'Hab schon viele ähnliche Produkte – das hier ist mit Abstand am hochwertigsten.'
  ];

  -- Latex & Fetischwear positives
  pos_latex text[] := array[
    'Material liegt perfekt am Körper, kein Kratzen. Sehr angenehm zu tragen.',
    'Hochwertigstes Latex das ich je hatte. Sitzt wie eine zweite Haut, glänzt wunderschön.',
    'Einfach umwerfend. Passform perfekt, Latex-Qualität erstklassig.',
    'Mein Partner ist absolut begeistert. Sieht toll aus und trägt sich überraschend komfortabel.',
    'Das Anziehen braucht etwas Übung, aber das Ergebnis ist atemberaubend. Sehr zufrieden!'
  ];

  -- BDSM & Kontrolle positives
  pos_bdsm text[] := array[
    'Sehr robuste Verarbeitung, keine scharfen Kanten. Alles sicher und hochwertig.',
    'Top Qualität! Material körperfreundlich und langlebig. Genau das richtige Maß.',
    'Leder fühlt sich premium an, Nähte sind sauber und halten was sie sollen.',
    'Hochwertig verarbeitet, macht genau was es soll. Sehr zufrieden.',
    'Stabiles Material, tolle Haptik. Für den Preis wirklich ausgezeichnete Qualität.'
  ];

  -- Vibratoren & Elektro positives
  pos_vibe text[] := array[
    'Überraschend leise für die Leistung! Genau das wollte ich haben.',
    'Die Vibrationsmodi sind perfekt abgestuft. Akku hält auch deutlich länger als erwartet.',
    'Absolut zufrieden. Leise, kraftvoll und wasserdicht wie beschrieben. Volle Punktzahl.',
    'Besser als mein altes Gerät das doppelt so viel gekostet hat. Klare Empfehlung!',
    'Laden geht schnell, Leistung ist stark, Bedienung intuitiv. Bin begeistert.'
  ];

  -- Dildos positives
  pos_dildo text[] := array[
    'Material 100% körpersicher, völlig geruchsneutral und fühlt sich sehr angenehm an.',
    'Gewicht und Größe perfekt für mich. Genau das Richtige, sehr zufrieden.',
    'Sehr realistisch, Material fühlt sich toll an. Lieferung war diskret und schnell.',
    'Stabiles Material, leicht zu reinigen. Genau wie auf den Fotos.',
    'Weich genug für angenehme Nutzung, aber mit genug Stabilität. Perfekte Balance.'
  ];

  -- Anal positives
  pos_anal text[] := array[
    'Für Einsteiger perfekt. Größe stimmt, Material weich und angenehm.',
    'Top Verarbeitung, kein unangenehmer Geruch. Sicherheitsbase sitzt sehr gut.',
    'Genau die richtige Größe. Material sehr angenehm und pflegeleicht.',
    'Sehr angenehmes Material, stufenweise Progression ideal für Anfänger.',
    'Glatte Oberfläche, keine scharfen Kanten. Qualität die man sieht und fühlt.'
  ];

  -- Neutral (3★)
  neu text[] := array[
    'Ganz okay, aber für den Preis hätte ich etwas mehr erwartet.',
    'Solide Qualität, nichts Besonderes. Erfüllt seinen Zweck.',
    'Hat etwas länger gedauert als erwartet, Produkt selbst ist in Ordnung.',
    'Für den Einstieg gut geeignet, wer mehr Erfahrung hat will vielleicht etwas Hochwertigeres.',
    'Bin neutral. Nicht schlecht, aber auch nicht besonders beeindruckt.',
    'Material okay, Verarbeitung okay. Hätte mich über etwas mehr Qualität gefreut.',
    'Kommt gut verpackt an, Qualität ist mittelmäßig. Für den Preis noch okay.',
    'Zweites Mal bestellt, immer noch solide aber eben nicht außergewöhnlich.'
  ];

  -- Negative (1–2★)
  neg text[] := array[
    'Leider nicht das was ich erwartet hatte. Qualität lässt zu wünschen übrig.',
    'Größenangaben stimmen nicht wirklich. Musste leider zurückschicken.',
    'Material riecht sehr stark, der Geruch geht kaum raus. Ziemlich enttäuschend.',
    'Verarbeitung ist für den Preis nicht in Ordnung. Nähte gingen schnell auf.',
    'Produkt sieht auf den Fotos deutlich besser aus als in der Realität.',
    'Material viel härter als beschrieben. Nicht das was ich mir vorgestellt hatte.',
    'Leider schon nach kurzer Nutzung defekt. Erwarte mehr für diesen Preis.',
    'Lieferung hat sehr lange gedauert und das Produkt hat mich nicht überzeugt.'
  ];

begin
  -- Clear previous seed to make re-run safe
  delete from public.reviews
  where author ~ '^[A-ZÄÖÜa-zäöüß]+ [A-Z]\.$';

  -- Seed reviews for ~40% of products
  for v_id, v_cat in
    select id, cat from public.products order by id
  loop
    if random() < 0.40 then
      -- 1–5 reviews per product
      v_num := floor(random() * 5 + 1)::integer;

      for i in 1..v_num loop

        -- Author: "Vorname I."
        v_author :=
          fnames   [floor(random() * array_length(fnames,    1) + 1)::integer] || ' ' ||
          linitials[floor(random() * array_length(linitials, 1) + 1)::integer];

        -- Rating (weighted)
        v_rating := rpool[floor(random() * array_length(rpool, 1) + 1)::integer];

        -- Review body
        if v_rating >= 4 then
          -- 50% generic, 50% category-specific
          if random() < 0.50 then
            v_body := pos_gen[floor(random() * array_length(pos_gen, 1) + 1)::integer];
          else
            case v_cat
              when 'Latex & Fetischwear'  then v_body := pos_latex[floor(random() * array_length(pos_latex, 1) + 1)::integer];
              when 'BDSM & Kontrolle'     then v_body := pos_bdsm [floor(random() * array_length(pos_bdsm,  1) + 1)::integer];
              when 'Vibratoren & Elektro' then v_body := pos_vibe [floor(random() * array_length(pos_vibe,  1) + 1)::integer];
              when 'Dildos'               then v_body := pos_dildo[floor(random() * array_length(pos_dildo, 1) + 1)::integer];
              when 'Anal'                 then v_body := pos_anal [floor(random() * array_length(pos_anal,  1) + 1)::integer];
              else                             v_body := pos_gen  [floor(random() * array_length(pos_gen,   1) + 1)::integer];
            end case;
          end if;
        elsif v_rating = 3 then
          v_body := neu[floor(random() * array_length(neu, 1) + 1)::integer];
        else
          v_body := neg[floor(random() * array_length(neg, 1) + 1)::integer];
        end if;

        -- Random timestamp within the last 10 months
        v_at := now() - (random() * interval '300 days');

        insert into public.reviews (product_id, author, rating, body, created_at)
        values (v_id, v_author, v_rating, v_body, v_at);

      end loop;
    end if;
  end loop;

  -- ── 3. Update products.rating + products.rev aggregates ──────
  update public.products p
  set
    rating = sub.avg_r,
    rev    = sub.cnt
  from (
    select
      product_id,
      round(avg(rating)::numeric, 1) as avg_r,
      count(*)::integer               as cnt
    from public.reviews
    group by product_id
  ) sub
  where p.id = sub.product_id;

  raise notice 'Done. Check results with: SELECT count(*) FROM reviews; SELECT avg(rating) FROM reviews;';
end $$;
