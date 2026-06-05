import React from 'react'
import { C } from '@/tokens'
import Tag from '@/components/ui/Tag'
import Btn from '@/components/ui/Btn'
import type { Page } from '@/types'

// ── Shared layout ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <h2 style={{ fontSize: '13px', fontWeight: 400, letterSpacing: '0.12em', color: C.textMid, textTransform: 'uppercase', marginBottom: '16px', borderBottom: `1px solid ${C.border}`, paddingBottom: '12px' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '13px', color: C.textMid, lineHeight: 1.85, marginBottom: '12px' }}>
      {children}
    </p>
  )
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ fontSize: '13px', color: C.textMid, lineHeight: 1.85, marginBottom: '6px', paddingLeft: '4px' }}>
      {children}
    </li>
  )
}

// ── Page content ───────────────────────────────────────────────────────────

function ValueCard({ title, body }: { title: string; body: string }) {
  return (
    <div style={{
      flex: '1 1 200px',
      padding: '24px',
      border: `1px solid ${C.border}`,
      background: C.bgCard,
    }}>
      <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', color: C.accent, marginBottom: '10px', textTransform: 'uppercase' }}>
        {title}
      </div>
      <div style={{ fontSize: '12px', color: C.textMid, lineHeight: 1.8 }}>
        {body}
      </div>
    </div>
  )
}

function AboutContent() {
  return (
    <div>
      {/* ── Full-bleed hero image ───────────────────────────────────────────── */}
      <div style={{
        width: '100%', height: '70vh', minHeight: '440px', maxHeight: '680px',
        overflow: 'hidden', position: 'relative',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <img
          src="/images/about-mood.jpg"
          alt="TOYS4JOYS — Atmosphäre"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 35%', display: 'block' }}
        />
        {/* Bottom fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '220px',
          background: `linear-gradient(transparent, ${C.bg})`,
          pointerEvents: 'none',
        }} />
        {/* Overlay headline */}
        <div style={{ position: 'absolute', bottom: '48px', left: '56px', zIndex: 1 }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: C.textDim, marginBottom: '12px' }}>
            ÜBER UNS
          </div>
          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 68px)', fontWeight: 700,
            letterSpacing: '-0.02em', lineHeight: 1.0, color: C.text, margin: 0,
          }}>
            Premium Kink.<br />
            <span style={{ color: C.accent }}>Aus Berlin.</span>
          </h1>
        </div>
      </div>

      {/* ── Manifesto — two-column editorial ───────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ padding: '72px 56px', borderRight: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.16em', color: C.textDim, marginBottom: '20px' }}>
            WARUM WIR DAS TUN
          </div>
          <p style={{ fontSize: 'clamp(20px, 2.2vw, 28px)', fontWeight: 700, color: C.text, lineHeight: 1.3, letterSpacing: '-0.01em', margin: 0 }}>
            Intimprodukte verdienen denselben Anspruch wie Luxus-Mode. Wir haben TOYS4JOYS gegründet, weil niemand sonst es so gemacht hat.
          </p>
        </div>
        <div style={{ padding: '72px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px' }}>
          <p style={{ fontSize: '14px', fontWeight: 300, color: C.textMid, lineHeight: 1.85, margin: 0 }}>
            Jedes Produkt in unserem Sortiment wird persönlich ausgewählt — auf Qualität, Material und Design geprüft. Wir arbeiten nur mit Herstellern zusammen, die unsere hohen Standards teilen.
          </p>
          <p style={{ fontSize: '14px', fontWeight: 300, color: C.textMid, lineHeight: 1.85, margin: 0 }}>
            Von der Bestellung bis zur Lieferung steht Diskretion an erster Stelle. Neutrale Verpackung, sichere Zahlung, neutraler Absender — ohne Kompromisse.
          </p>
        </div>
      </div>

      {/* ── Values — 4-column grid ──────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        borderBottom: `1px solid ${C.border}`,
        background: C.border, gap: '1px',
      }}>
        {[
          { title: 'Premium Qualität',    body: 'Nur sorgfältig geprüfte Produkte aus hochwertigen Materialien — Edelstahl, medizinisches Silikon, Echtleder.' },
          { title: '100% Diskret',        body: 'Neutrale Verpackung, diskreter Versand und sichere Zahlung. Kein Absender, keine Hinweise.' },
          { title: 'Persönlicher Service',body: 'Unser Support steht dir bei Fragen jederzeit zur Verfügung — kompetent und ohne Moralisierung.' },
          { title: 'Nachhaltigkeit',      body: 'Umweltfreundliche Verpackungen, langlebige Produkte, sorgfältig ausgewählte Hersteller.' },
        ].map(v => (
          <div key={v.title} style={{ background: C.bg, padding: '40px 32px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', color: C.accent, marginBottom: '16px', textTransform: 'uppercase' }}>
              {v.title}
            </div>
            <div style={{ fontSize: '13px', color: C.textMid, lineHeight: 1.85 }}>
              {v.body}
            </div>
          </div>
        ))}
      </div>

      {/* ── Contact strip ───────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ padding: '48px 56px', borderRight: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.16em', color: C.textDim, marginBottom: '16px' }}>ALLGEMEIN</div>
          <div style={{ fontSize: '14px', color: C.text }}>hallo@toys4joys.de</div>
        </div>
        <div style={{ padding: '48px 56px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.16em', color: C.textDim, marginBottom: '16px' }}>B2B & GROSSBESTELLUNGEN</div>
          <div style={{ fontSize: '14px', color: C.text }}>b2b@toys4joys.de</div>
        </div>
      </div>
    </div>
  )
}

function ShippingContent() {
  return (
    <div>
      {/* Key facts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: C.border, gap: '1px', borderBottom: `1px solid ${C.border}` }}>
        {[
          { n: '24h',      label: 'Versand an Werktagen' },
          { n: '€50',      label: 'Ab hier kostenlos' },
          { n: '30 Tage',  label: 'Rückgaberecht' },
        ].map((s, i) => (
          <div key={s.label} style={{ background: C.bg, padding: '48px 40px' }}>
            <div style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 700, color: C.accent, marginBottom: '8px' }}>{s.n}</div>
            <div style={{ fontSize: '10px', letterSpacing: '0.14em', color: C.textDim, textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Two-column detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ padding: '56px 48px', borderRight: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.16em', color: C.textDim, marginBottom: '28px' }}>LIEFERUNG</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              ['Standardlieferung Deutschland', '€4,99'],
              ['Kostenloser Versand ab', '€50 Bestellwert'],
              ['Lieferzeit Deutschland', '2–4 Werktage'],
              ['Lieferzeit Europa', '4–8 Werktage'],
              ['Versandtag', 'Mo–Fr, Bestellung bis 14 Uhr'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `1px solid ${C.border}`, paddingBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: C.textMid }}>{label}</span>
                <span style={{ fontSize: '12px', color: C.text, fontWeight: 400 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '56px 48px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.16em', color: C.textDim, marginBottom: '28px' }}>DISKRETE VERPACKUNG</div>
          <p style={{ fontSize: '14px', color: C.textMid, lineHeight: 1.85, marginBottom: '20px' }}>
            Alle Bestellungen werden in neutralen Kartons ohne Hinweis auf Inhalt oder Absender verschickt. Der Name auf der Sendungsverfolgung lautet auf eine neutrale Handelsgesellschaft.
          </p>
          <p style={{ fontSize: '14px', color: C.textMid, lineHeight: 1.85 }}>
            Auf dem Kontoauszug erscheint die Abrechnung ebenfalls neutral.
          </p>
        </div>
      </div>

      {/* Returns */}
      <div style={{ padding: '56px 48px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: '10px', letterSpacing: '0.16em', color: C.textDim, marginBottom: '28px' }}>RÜCKGABE</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
          <div>
            <p style={{ fontSize: '14px', color: C.textMid, lineHeight: 1.85, marginBottom: '20px' }}>
              Du hast 30 Tage Rückgaberecht ab Erhalt der Ware — ohne Angabe von Gründen, solange die Artikel unbenutzt und originalverpackt sind.
            </p>
            <p style={{ fontSize: '13px', color: C.accent }}>returns@toys4joys.de</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              'Rücksendekosten trägt der Käufer (außer bei Defekt)',
              'Erstattung innerhalb von 5 Werktagen',
              'Hygieneartikel ohne Schutzversiegelung ausgeschlossen',
            ].map(t => (
              <div key={t} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ color: C.accent, fontSize: '12px', marginTop: '1px', flexShrink: 0 }}>—</span>
                <span style={{ fontSize: '13px', color: C.textMid, lineHeight: 1.7 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProseBlock({ sections }: { sections: { heading: string; items: React.ReactNode[] }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', borderBottom: `1px solid ${C.border}` }}>
      {sections.map(s => (
        <React.Fragment key={s.heading}>
          <div style={{ padding: '40px 40px 40px 48px', borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.16em', color: C.textDim, textTransform: 'uppercase', lineHeight: 1.6 }}>{s.heading}</div>
          </div>
          <div style={{ padding: '40px 48px', borderBottom: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {s.items.map((item, i) => (
              <div key={i} style={{ fontSize: '13px', color: C.textMid, lineHeight: 1.85 }}>{item}</div>
            ))}
          </div>
        </React.Fragment>
      ))}
    </div>
  )
}

function PrivacyContent() {
  return (
    <ProseBlock sections={[
      {
        heading: 'Grundsatz',
        items: ['Der Schutz deiner persönlichen Daten ist uns wichtig. Diese Datenschutzerklärung informiert dich über Art, Umfang und Zweck der Verarbeitung personenbezogener Daten gemäß DSGVO.'],
      },
      {
        heading: 'Verantwortlicher',
        items: ['Toys4Joys · Viet Anh Nguyen', 'Karl-Kunger-Straße 14, 12435 Berlin', <span>info@toys4joys.com</span>],
      },
      {
        heading: 'Erhobene Daten',
        items: [
          'Bestelldaten (Name, Lieferadresse, E-Mail) — zur Abwicklung deiner Bestellung',
          'Zahlungsdaten — ausschließlich von Stripe verarbeitet, nie bei uns gespeichert',
          'Server-Logs (IP, Zeitstempel) — 7 Tage, technische Sicherheit',
          'Cookies — technisch notwendige Session-Cookies, kein Tracking, kein Marketing',
        ],
      },
      {
        heading: 'Weitergabe',
        items: [
          'Deine Daten werden nicht zu Werbezwecken weitergegeben.',
          'Versanddienstleister erhalten nur Lieferdaten (Name, Adresse).',
          'Zahlungsabwicklung: Stripe Inc. — stripe.com/privacy',
        ],
      },
      {
        heading: 'Deine Rechte',
        items: [
          'Auskunft (Art. 15 DSGVO)',
          'Berichtigung (Art. 16 DSGVO)',
          'Löschung (Art. 17 DSGVO)',
          'Widerspruch (Art. 21 DSGVO)',
          <span>Anfragen: <span style={{ color: C.accent }}>datenschutz@toys4joys.de</span></span>,
        ],
      },
    ]} />
  )
}

function TermsContent() {
  return (
    <ProseBlock sections={[
      {
        heading: 'Geltungsbereich',
        items: ['Diese AGB gelten für alle Käufe im TOYS4JOYS Online-Shop (toys4joys.de). Mit Abschluss einer Bestellung akzeptierst du diese Bedingungen.'],
      },
      {
        heading: 'Vertragsschluss',
        items: [
          'Die Produktpräsentation im Shop ist kein rechtlich bindendes Angebot.',
          'Ein Kaufvertrag kommt erst zustande, wenn wir deine Bestellung per E-Mail bestätigen.',
          'Wir behalten uns vor, Bestellungen ohne Angabe von Gründen abzulehnen.',
        ],
      },
      {
        heading: 'Preise & Zahlung',
        items: [
          'Alle Preise inkl. gesetzlicher MwSt. (19%)',
          'Zahlung per Kreditkarte, PayPal, Klarna oder Sofortüberweisung',
          'Zahlung fällig bei Bestellabschluss',
        ],
      },
      {
        heading: 'Versand',
        items: ['Versand innerhalb von 24h an Werktagen. Kostenlos ab €50. Details: Versand & Rückgabe.'],
      },
      {
        heading: 'Mindestalter',
        items: ['Der Shop richtet sich ausschließlich an Personen ab 18 Jahren. Mit der Bestellung bestätigst du, volljährig zu sein.'],
      },
      {
        heading: 'Gewährleistung',
        items: [
          'Gesetzliche Gewährleistung: 2 Jahre.',
          <span>Mängel innerhalb von 8 Tagen melden: <span style={{ color: C.accent }}>service@toys4joys.de</span></span>,
        ],
      },
    ]} />
  )
}

function ImprintContent() {
  return (
    <ProseBlock sections={[
      {
        heading: 'Angaben gemäß § 5 DDG',
        items: ['Toys4Joys', 'Karl-Kunger-Straße 14', '12435 Berlin', 'Deutschland', 'Einzelunternehmen'],
      },
      {
        heading: 'Kontakt',
        items: [
          <span>E-Mail: <span style={{ color: C.accent }}>info@toys4joys.com</span></span>,
        ],
      },
      {
        heading: 'Inhaltlich Verantwortlicher § 18 Abs. 2 MStV',
        items: ['Viet Anh Nguyen', 'Karl-Kunger-Straße 14', '12435 Berlin', 'Deutschland'],
      },
      {
        heading: 'Streitschlichtung',
        items: [
          <span>OS-Plattform: <span style={{ color: C.accent }}>ec.europa.eu/consumers/odr</span></span>,
          'Wir sind nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
        ],
      },
    ]} />
  )
}

function PressContent() {
  return (
    <>
      <Section title="Pressekontakt">
        <P>
          Für Medienanfragen, Interviews und Kooperationen:<br />
          <span style={{ color: C.accent }}>presse@toys4joys.de</span>
        </P>
        <P>
          Wir antworten in der Regel innerhalb von 48 Stunden.
        </P>
      </Section>
      <Section title="Über TOYS4JOYS">
        <P>
          TOYS4JOYS ist ein Berliner Online-Shop für Premium Fetisch- und Kinkwear. Das Sortiment umfasst Latex & Fetischwear, BDSM & Kontrolle, Vibratoren & Elektro, Dildos und Anal-Toys.
        </P>
        <P>
          Gegründet in Berlin. Versand europaweit. Sprachen: Deutsch, Englisch, Spanisch (in Vorbereitung).
        </P>
      </Section>
      <Section title="Bildmaterial & Logos">
        <P>
          Druckfähige Logos (SVG, PNG, PDF), Produktbilder und Markenmaterial auf Anfrage.
        </P>
        <P>
          Anfrage: <span style={{ color: C.accent }}>presse@toys4joys.de</span> — bitte Publikation und Verwendungszweck angeben.
        </P>
      </Section>
      <Section title="Kooperationen">
        <P>
          Wir sind offen für redaktionelle Kooperationen, Produktplatzierungen und gemeinsame Kampagnen mit passenden Magazinen, Creators und Veranstaltern aus der Kink- und Lifestyle-Szene.
        </P>
      </Section>
    </>
  )
}

// ── Widerrufsbelehrung ─────────────────────────────────────────────────────

function WithdrawalContent() {
  return (
    <>
      <Section title="Widerrufsrecht">
        <P>
          Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.
          Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem du oder ein von dir benannter
          Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen hast bzw. hat.
        </P>
        <P>
          Um dein Widerrufsrecht auszuüben, musst du uns (Toys4Joys, Viet Anh Nguyen, info@toys4joys.com)
          mittels einer eindeutigen Erklärung (z.B. eine E-Mail) über deinen Entschluss, diesen Vertrag
          zu widerrufen, informieren. Du kannst dafür das unten stehende Muster-Widerrufsformular verwenden,
          das jedoch nicht vorgeschrieben ist.
        </P>
        <P>
          Zur Wahrung der Widerrufsfrist reicht es aus, dass du die Mitteilung über die Ausübung des
          Widerrufsrechts vor Ablauf der Widerrufsfrist absendest.
        </P>
      </Section>

      <Section title="Folgen des Widerrufs">
        <P>
          Wenn du diesen Vertrag widerrufst, haben wir dir alle Zahlungen, die wir von dir erhalten haben,
          einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben,
          dass du eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung
          gewählt hast), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen,
          an dem die Mitteilung über deinen Widerruf dieses Vertrags bei uns eingegangen ist.
        </P>
        <P>
          Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das du bei der ursprünglichen
          Transaktion eingesetzt hast, es sei denn, mit dir wurde ausdrücklich etwas anderes vereinbart;
          in keinem Fall werden dir wegen dieser Rückzahlung Entgelte berechnet.
        </P>
        <P>
          Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder
          bis du den Nachweis erbracht hast, dass du die Waren zurückgesandt hast, je nachdem,
          welches der frühere Zeitpunkt ist.
        </P>
        <P>
          Du hast die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag,
          an dem du uns über den Widerruf dieses Vertrags unterrichtest, an uns zurückzusenden oder zu übergeben.
          Die Frist ist gewahrt, wenn du die Waren vor Ablauf der Frist von vierzehn Tagen absendest.
          Du trägst die unmittelbaren Kosten der Rücksendung der Waren.
        </P>
        <P>
          Du musst für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust auf
          einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren nicht
          notwendigen Umgang mit ihnen zurückzuführen ist.
        </P>
      </Section>

      <Section title="Ausschluss des Widerrufsrechts">
        <P>
          Das Widerrufsrecht besteht nicht bei Waren, die aus Gründen des Gesundheitsschutzes oder
          der Hygiene nicht zur Rückgabe geeignet sind und deren Versiegelung nach der Lieferung
          entfernt wurde (§ 312g Abs. 2 Nr. 3 BGB). Dies gilt insbesondere für Artikel, die direkt
          mit dem Körper in Berührung kommen, sofern die Schutzversiegelung geöffnet wurde.
        </P>
      </Section>

      <Section title="Muster-Widerrufsformular">
        <P>
          (Wenn du den Vertrag widerrufen willst, dann fülle dieses Formular aus und sende es zurück.)
        </P>
        <div style={{ background: '#0e0b14', border: `1px solid ${C.border}`, padding: '24px', fontSize: '12px', color: C.textMid, lineHeight: 2 }}>
          <strong style={{ color: C.text }}>An: Toys4Joys · Viet Anh Nguyen</strong><br />
          Karl-Kunger-Straße 14, 12435 Berlin<br />
          E-Mail: info@toys4joys.com<br /><br />
          Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf
          der folgenden Waren (*):<br /><br />
          Bestellt am (*): ___________________<br />
          Erhalten am (*): ___________________<br />
          Name des/der Verbraucher(s): ___________________<br />
          Anschrift des/der Verbraucher(s): ___________________<br /><br />
          Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier): ___________________<br /><br />
          Datum: ___________________<br /><br />
          <span style={{ fontSize: '10px', color: C.textDim }}>(*) Unzutreffendes streichen.</span>
        </div>
      </Section>
    </>
  )
}

// ── Page config ────────────────────────────────────────────────────────────

const PAGE_CONFIG: Record<string, { tag: string; title: string; Content: React.FC }> = {
  about:      { tag: 'Über Uns',            title: 'Über Uns',            Content: AboutContent },
  shipping:   { tag: 'Versand & Rückgabe',  title: 'Versand & Rückgabe',  Content: ShippingContent },
  privacy:    { tag: 'Datenschutz',         title: 'Datenschutz',         Content: PrivacyContent },
  terms:      { tag: 'AGB',                 title: 'AGB',                 Content: TermsContent },
  imprint:    { tag: 'Impressum',           title: 'Impressum',           Content: ImprintContent },
  press:      { tag: 'Presse',              title: 'Presse',              Content: PressContent },
  withdrawal: { tag: 'Widerrufsbelehrung',  title: 'Widerrufsbelehrung',  Content: WithdrawalContent },
}

// ── Main export ────────────────────────────────────────────────────────────

interface Props {
  page: Page
  onNavigate: (page: Page) => void
}

export default function StaticPage({ page, onNavigate }: Props) {
  const config = PAGE_CONFIG[page]
  if (!config) return null
  const { tag, title, Content } = config

  // About has its own full image hero — skip the shared header
  if (page === 'about') {
    return (
      <div style={{ borderTop: `1px solid ${C.border}` }}>
        <Content />
        <div style={{ padding: '40px 56px', borderTop: `1px solid ${C.border}` }}>
          <Btn variant="outline" onClick={() => onNavigate('shop')}>← ZURÜCK ZUM SHOP</Btn>
        </div>
      </div>
    )
  }

  // All other pages: full-width with editorial header + content
  return (
    <div style={{ borderTop: `1px solid ${C.border}` }}>
      {/* Page header */}
      <div style={{
        padding: '64px 56px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}>
        <Tag>{tag}</Tag>
        <h1 style={{
          fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 700,
          letterSpacing: '-0.02em', color: C.text, margin: 0, lineHeight: 1.05,
        }}>
          {title}
        </h1>
      </div>

      <Content />

      <div style={{ padding: '40px 48px', borderTop: `1px solid ${C.border}` }}>
        <Btn variant="outline" onClick={() => onNavigate('shop')}>← ZURÜCK ZUM SHOP</Btn>
      </div>
    </div>
  )
}
