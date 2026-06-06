import React from 'react'
import { C } from '@/tokens'
import { useLocale } from '@/contexts/LocaleContext'
import { useIsMobile } from '@/hooks/useIsMobile'
import Tag from '@/components/ui/Tag'
import Btn from '@/components/ui/Btn'
import type { Page } from '@/types'

// ── Shared primitives ──────────────────────────────────────────────────────

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '13px', color: C.textMid, lineHeight: 1.9, marginBottom: '14px', margin: '0 0 14px' }}>
      {children}
    </p>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '10px', letterSpacing: '0.16em', color: C.textDim,
      textTransform: 'uppercase', lineHeight: 1.6, marginBottom: '12px',
    }}>
      {children}
    </div>
  )
}

// ── ProseBlock — used by Privacy, Terms, Imprint ───────────────────────────

function ProseBlock({ sections }: { sections: { heading: string; items: React.ReactNode[] }[] }) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <div style={{ borderBottom: `1px solid ${C.border}` }}>
        {sections.map(s => (
          <div key={s.heading} style={{ borderBottom: `1px solid ${C.border}`, padding: '24px 16px' }}>
            <SectionHeading>{s.heading}</SectionHeading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {s.items.map((item, i) => (
                <div key={i} style={{ fontSize: '13px', color: C.textMid, lineHeight: 1.85 }}>{item}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', borderBottom: `1px solid ${C.border}` }}>
      {sections.map(s => (
        <React.Fragment key={s.heading}>
          <div style={{ padding: '40px 40px 40px 48px', borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
            <SectionHeading>{s.heading}</SectionHeading>
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

// ── About ──────────────────────────────────────────────────────────────────

function AboutContent() {
  const isMobile = useIsMobile()

  return (
    <div>
      {/* Hero image */}
      <div style={{
        width: '100%', height: isMobile ? '50vh' : '70vh',
        minHeight: isMobile ? '280px' : '440px', maxHeight: '680px',
        overflow: 'hidden', position: 'relative',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <img
          src="/images/about-mood.jpg"
          alt="TOYS4JOYS — Atmosphäre"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 35%', display: 'block' }}
        />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '220px',
          background: `linear-gradient(transparent, ${C.bg})`,
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'absolute', bottom: isMobile ? '24px' : '48px', left: isMobile ? '20px' : '56px', zIndex: 1, right: isMobile ? '20px' : 'auto' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: C.textDim, marginBottom: '12px' }}>ÜBER UNS</div>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 68px)', fontWeight: 700,
            letterSpacing: '-0.02em', lineHeight: 1.0, color: C.text, margin: 0,
          }}>
            Premium Kink.<br />
            <span style={{ color: C.accent }}>Aus Berlin.</span>
          </h1>
        </div>
      </div>

      {/* Manifesto — single column on mobile */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{
          padding: isMobile ? '32px 20px' : '72px 56px',
          borderRight: isMobile ? 'none' : `1px solid ${C.border}`,
          borderBottom: isMobile ? `1px solid ${C.border}` : 'none',
        }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.16em', color: C.textDim, marginBottom: '20px' }}>
            WARUM WIR DAS TUN
          </div>
          <p style={{ fontSize: 'clamp(18px, 2.2vw, 28px)', fontWeight: 700, color: C.text, lineHeight: 1.3, letterSpacing: '-0.01em', margin: 0 }}>
            Intimprodukte verdienen denselben Anspruch wie Luxus-Mode. Wir haben TOYS4JOYS gegründet, weil niemand sonst es so gemacht hat.
          </p>
        </div>
        <div style={{
          padding: isMobile ? '32px 20px' : '72px 56px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px',
        }}>
          <p style={{ fontSize: '14px', fontWeight: 300, color: C.textMid, lineHeight: 1.85, margin: 0 }}>
            Jedes Produkt in unserem Sortiment wird persönlich ausgewählt — auf Qualität, Material und Design geprüft. Wir arbeiten nur mit Herstellern zusammen, die unsere hohen Standards teilen.
          </p>
          <p style={{ fontSize: '14px', fontWeight: 300, color: C.textMid, lineHeight: 1.85, margin: 0 }}>
            Von der Bestellung bis zur Lieferung steht Diskretion an erster Stelle. Neutrale Verpackung, sichere Zahlung, neutraler Absender — ohne Kompromisse.
          </p>
        </div>
      </div>

      {/* Values — 4-col desktop, 2-col mobile */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        borderBottom: `1px solid ${C.border}`,
        background: C.border, gap: '1px',
      }}>
        {[
          { title: 'Premium Qualität',    body: 'Nur sorgfältig geprüfte Produkte aus hochwertigen Materialien — Edelstahl, medizinisches Silikon, Echtleder.' },
          { title: '100% Diskret',        body: 'Neutrale Verpackung, diskreter Versand und sichere Zahlung. Kein Absender, keine Hinweise.' },
          { title: 'Persönlicher Service',body: 'Unser Support steht dir bei Fragen jederzeit zur Verfügung — kompetent und ohne Moralisierung.' },
          { title: 'Nachhaltigkeit',      body: 'Umweltfreundliche Verpackungen, langlebige Produkte, sorgfältig ausgewählte Hersteller.' },
        ].map(v => (
          <div key={v.title} style={{ background: C.bg, padding: isMobile ? '24px 16px' : '40px 32px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', color: C.accent, marginBottom: '12px', textTransform: 'uppercase' }}>
              {v.title}
            </div>
            <div style={{ fontSize: '13px', color: C.textMid, lineHeight: 1.85 }}>
              {v.body}
            </div>
          </div>
        ))}
      </div>

      {/* Contact — stacked on mobile */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{
          padding: isMobile ? '28px 20px' : '48px 56px',
          borderRight: isMobile ? 'none' : `1px solid ${C.border}`,
          borderBottom: isMobile ? `1px solid ${C.border}` : 'none',
        }}>
          <SectionHeading>ALLGEMEIN</SectionHeading>
          <div style={{ fontSize: '14px', color: C.text }}>hallo@toys4joys.de</div>
        </div>
        <div style={{ padding: isMobile ? '28px 20px' : '48px 56px' }}>
          <SectionHeading>B2B & GROSSBESTELLUNGEN</SectionHeading>
          <div style={{ fontSize: '14px', color: C.text }}>b2b@toys4joys.de</div>
        </div>
      </div>
    </div>
  )
}

// ── Shipping ───────────────────────────────────────────────────────────────

function ShippingContent() {
  const isMobile = useIsMobile()

  return (
    <div>
      {/* Key stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        background: C.border, gap: '1px',
        borderBottom: `1px solid ${C.border}`,
      }}>
        {[
          { n: '24h',     label: 'Versand an Werktagen' },
          { n: '€49',     label: 'Ab hier kostenlos' },
          { n: '30 Tage', label: 'Rückgaberecht' },
        ].map(s => (
          <div key={s.label} style={{ background: C.bg, padding: isMobile ? '24px 16px' : '48px 40px' }}>
            <div style={{ fontSize: 'clamp(24px, 3.5vw, 44px)', fontWeight: 700, color: C.accent, marginBottom: '8px' }}>{s.n}</div>
            <div style={{ fontSize: '10px', letterSpacing: '0.14em', color: C.textDim, textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Detail — stacked on mobile */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{
          padding: isMobile ? '28px 20px' : '56px 48px',
          borderRight: isMobile ? 'none' : `1px solid ${C.border}`,
          borderBottom: isMobile ? `1px solid ${C.border}` : 'none',
        }}>
          <SectionHeading>LIEFERUNG</SectionHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              ['Standardlieferung Deutschland', '€4,99'],
              ['Kostenloser Versand ab', '€50 Bestellwert'],
              ['Lieferzeit Deutschland', '2–4 Werktage'],
              ['Lieferzeit Europa', '4–8 Werktage'],
              ['Versandtag', 'Mo–Fr, Bestellung bis 14 Uhr'],
            ].map(([label, val]) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                borderBottom: `1px solid ${C.border}`, paddingBottom: '10px', gap: '12px',
              }}>
                <span style={{ fontSize: '12px', color: C.textMid }}>{label}</span>
                <span style={{ fontSize: '12px', color: C.text, fontWeight: 400, flexShrink: 0 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: isMobile ? '28px 20px' : '56px 48px' }}>
          <SectionHeading>DISKRETE VERPACKUNG</SectionHeading>
          <P>Alle Bestellungen werden in neutralen Kartons ohne Hinweis auf Inhalt oder Absender verschickt. Der Name auf der Sendungsverfolgung lautet auf eine neutrale Handelsgesellschaft.</P>
          <P>Auf dem Kontoauszug erscheint die Abrechnung ebenfalls neutral.</P>
        </div>
      </div>

      {/* Returns */}
      <div style={{ padding: isMobile ? '28px 20px' : '56px 48px', borderBottom: `1px solid ${C.border}` }}>
        <SectionHeading>RÜCKGABE</SectionHeading>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? '20px' : '48px',
        }}>
          <div>
            <P>Du hast 30 Tage Rückgaberecht ab Erhalt der Ware — ohne Angabe von Gründen, solange die Artikel unbenutzt und originalverpackt sind.</P>
            <p style={{ fontSize: '13px', color: C.accent, margin: 0 }}>returns@toys4joys.de</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              'Rücksendekosten trägt der Käufer (außer bei Defekt)',
              'Erstattung innerhalb von 5 Werktagen',
              'Hygieneartikel ohne Schutzversiegelung ausgeschlossen',
            ].map(txt => (
              <div key={txt} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ color: C.accent, fontSize: '12px', marginTop: '1px', flexShrink: 0 }}>—</span>
                <span style={{ fontSize: '13px', color: C.textMid, lineHeight: 1.7 }}>{txt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Legal prose pages ──────────────────────────────────────────────────────

function PrivacyContent() {
  return (
    <ProseBlock sections={[
      {
        heading: 'Grundsatz',
        items: ['Der Schutz deiner persönlichen Daten ist uns wichtig. Diese Datenschutzerklärung informiert dich über Art, Umfang und Zweck der Verarbeitung personenbezogener Daten gemäß DSGVO.'],
      },
      {
        heading: 'Verantwortlicher',
        items: ['Toys4Joys · Viet Anh Nguyen', 'Karl-Kunger-Straße 14, 12435 Berlin', <span key="email">info@toys4joys.com</span>],
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
          <span key="anfragen">Anfragen: <span style={{ color: C.accent }}>datenschutz@toys4joys.de</span></span>,
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
        items: ['Versand innerhalb von 24h an Werktagen. Kostenlos ab €49. Details: Versand & Rückgabe.'],
      },
      {
        heading: 'Mindestalter',
        items: ['Der Shop richtet sich ausschließlich an Personen ab 18 Jahren. Mit der Bestellung bestätigst du, volljährig zu sein.'],
      },
      {
        heading: 'Gewährleistung',
        items: [
          'Gesetzliche Gewährleistung: 2 Jahre.',
          <span key="service">Mängel innerhalb von 8 Tagen melden: <span style={{ color: C.accent }}>service@toys4joys.de</span></span>,
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
          <span key="email">E-Mail: <span style={{ color: C.accent }}>info@toys4joys.com</span></span>,
        ],
      },
      {
        heading: 'Inhaltlich Verantwortlicher § 18 Abs. 2 MStV',
        items: ['Viet Anh Nguyen', 'Karl-Kunger-Straße 14', '12435 Berlin', 'Deutschland'],
      },
      {
        heading: 'Streitschlichtung',
        items: [
          <span key="os">OS-Plattform: <span style={{ color: C.accent }}>ec.europa.eu/consumers/odr</span></span>,
          'Wir sind nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
        ],
      },
    ]} />
  )
}

// ── Press ──────────────────────────────────────────────────────────────────

function PressContent() {
  const isMobile = useIsMobile()
  const pad = isMobile ? '24px 20px' : '40px 48px'

  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      {[
        {
          heading: 'Pressekontakt',
          body: <><P>Für Medienanfragen, Interviews und Kooperationen:<br /><span style={{ color: C.accent }}>presse@toys4joys.de</span></P><P>Wir antworten in der Regel innerhalb von 48 Stunden.</P></>,
        },
        {
          heading: 'Über TOYS4JOYS',
          body: <><P>TOYS4JOYS ist ein Berliner Online-Shop für Premium Fetisch- und Kinkwear. Das Sortiment umfasst Latex &amp; Fetischwear, BDSM &amp; Kontrolle, Vibratoren &amp; Elektro, Dildos und Anal-Toys.</P><P>Gegründet in Berlin. Versand europaweit. Sprachen: Deutsch, Englisch, Spanisch (in Vorbereitung).</P></>,
        },
        {
          heading: 'Bildmaterial & Logos',
          body: <><P>Druckfähige Logos (SVG, PNG, PDF), Produktbilder und Markenmaterial auf Anfrage.</P><P>Anfrage: <span style={{ color: C.accent }}>presse@toys4joys.de</span> — bitte Publikation und Verwendungszweck angeben.</P></>,
        },
        {
          heading: 'Kooperationen',
          body: <P>Wir sind offen für redaktionelle Kooperationen, Produktplatzierungen und gemeinsame Kampagnen mit passenden Magazinen, Creators und Veranstaltern aus der Kink- und Lifestyle-Szene.</P>,
        },
      ].map(s => (
        <div key={s.heading} style={{ padding: pad, borderBottom: `1px solid ${C.border}` }}>
          <SectionHeading>{s.heading}</SectionHeading>
          {s.body}
        </div>
      ))}
    </div>
  )
}

// ── Widerruf ───────────────────────────────────────────────────────────────

function downloadWithdrawalForm() {
  const text = [
    'MUSTER-WIDERRUFSFORMULAR',
    '',
    'An: Toys4Joys · Viet Anh Nguyen',
    'Karl-Kunger-Straße 14, 12435 Berlin',
    'E-Mail: info@toys4joys.com',
    '',
    'Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag',
    'über den Kauf der folgenden Waren (*):',
    '',
    'Bestellt am (*): ___________________________',
    'Erhalten am (*): ___________________________',
    'Name des/der Verbraucher(s): ___________________________',
    'Anschrift des/der Verbraucher(s): ___________________________',
    '',
    'Unterschrift (nur bei Mitteilung auf Papier): ___________________________',
    '',
    'Datum: ___________________________',
    '',
    '(*) Unzutreffendes streichen.',
  ].join('\n')

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'Widerrufsformular-TOYS4JOYS.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function WithdrawalContent() {
  const isMobile = useIsMobile()

  return (
    <ProseBlock sections={[
      {
        heading: 'Widerrufsrecht',
        items: [
          'Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem du oder ein von dir benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen hast.',
          'Um dein Widerrufsrecht auszuüben, musst du uns (Toys4Joys, Viet Anh Nguyen, info@toys4joys.com) mittels einer eindeutigen Erklärung (z.B. eine E-Mail) über deinen Entschluss, diesen Vertrag zu widerrufen, informieren.',
          'Zur Wahrung der Widerrufsfrist reicht es aus, dass du die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absendest.',
        ],
      },
      {
        heading: 'Folgen des Widerrufs',
        items: [
          'Wenn du diesen Vertrag widerrufst, haben wir dir alle Zahlungen, die wir von dir erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten aus einer anderen Lieferart als der günstigsten Standardlieferung), unverzüglich und spätestens binnen vierzehn Tagen zurückzuzahlen.',
          'Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das du bei der ursprünglichen Transaktion eingesetzt hast; in keinem Fall werden dir Entgelte berechnet.',
          'Wir können die Rückzahlung verweigern, bis wir die Waren zurückerhalten haben oder du den Nachweis der Rücksendung erbracht hast.',
          'Du hast die Waren unverzüglich, spätestens binnen vierzehn Tagen ab Widerruf, zurückzusenden. Du trägst die unmittelbaren Kosten der Rücksendung.',
        ],
      },
      {
        heading: 'Ausschluss des Widerrufsrechts',
        items: [
          'Das Widerrufsrecht besteht nicht bei Waren, die aus Gründen des Gesundheitsschutzes oder der Hygiene nicht zur Rückgabe geeignet sind und deren Versiegelung nach der Lieferung entfernt wurde (§ 312g Abs. 2 Nr. 3 BGB). Dies gilt insbesondere für Artikel, die direkt mit dem Körper in Berührung kommen, sofern die Schutzversiegelung geöffnet wurde.',
        ],
      },
      {
        heading: 'Muster-Widerrufsformular',
        items: [
          'Du kannst das Muster-Widerrufsformular herunterladen, ausfüllen und per E-Mail an info@toys4joys.com senden. Die Nutzung des Formulars ist nicht vorgeschrieben — eine formlose E-Mail genügt.',
          <button
            key="download"
            onClick={downloadWithdrawalForm}
            style={{
              marginTop: '4px',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: isMobile ? '12px 20px' : '10px 20px',
              background: 'none',
              border: `1px solid ${C.border}`,
              color: C.textMid,
              fontSize: '11px', letterSpacing: '0.1em',
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.accent; (e.currentTarget as HTMLButtonElement).style.color = C.text }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border;  (e.currentTarget as HTMLButtonElement).style.color = C.textMid }}
          >
            ↓ WIDERRUFSFORMULAR HERUNTERLADEN (.TXT)
          </button>,
        ],
      },
    ]} />
  )
}

// ── Page config ────────────────────────────────────────────────────────────

const PAGE_CONFIG: Record<string, { tag: string; title: string; Content: React.FC }> = {
  about:      { tag: 'Über Uns',           title: 'Über Uns',           Content: AboutContent },
  shipping:   { tag: 'Versand & Rückgabe', title: 'Versand & Rückgabe', Content: ShippingContent },
  privacy:    { tag: 'Datenschutz',        title: 'Datenschutz',        Content: PrivacyContent },
  terms:      { tag: 'AGB',               title: 'AGB',                Content: TermsContent },
  imprint:    { tag: 'Impressum',         title: 'Impressum',          Content: ImprintContent },
  press:      { tag: 'Presse',            title: 'Presse',             Content: PressContent },
  withdrawal: { tag: 'Widerrufsbelehrung',title: 'Widerrufsbelehrung', Content: WithdrawalContent },
}

// ── Main export ────────────────────────────────────────────────────────────

interface Props {
  page: Page
  onNavigate: (page: Page) => void
}

export default function StaticPage({ page, onNavigate }: Props) {
  const { t, locale } = useLocale()
  const isMobile = useIsMobile()
  const config = PAGE_CONFIG[page]
  if (!config) return null
  const { tag, title, Content } = config

  const localizedTitle = (() => {
    switch (page) {
      case 'about':      return t.static.aboutTitle
      case 'shipping':   return t.static.shippingTitle
      case 'privacy':    return t.static.privacyTitle
      case 'terms':      return t.static.termsTitle
      case 'imprint':    return t.static.imprintTitle
      case 'withdrawal': return t.static.withdrawalTitle
      default:           return title
    }
  })()

  const NoticeBanner = locale !== 'de' ? (
    <div style={{
      padding: isMobile ? '12px 16px' : '14px 56px',
      background: C.bgCard,
      borderBottom: `1px solid ${C.border}`,
      fontSize: '12px', color: C.textDim,
      letterSpacing: '0.04em', lineHeight: 1.6,
      display: 'flex', alignItems: 'center', gap: '10px',
    }}>
      <span style={{ color: C.accent }}>🇩🇪</span>
      <span>{t.static.legalOnly}</span>
    </div>
  ) : null

  const BackBtn = <Btn variant="outline" onClick={() => onNavigate('shop')}>← {t.nav.shop}</Btn>

  if (page === 'about') {
    return (
      <div style={{ borderTop: `1px solid ${C.border}` }}>
        {NoticeBanner}
        <Content />
        <div style={{ padding: isMobile ? '24px 16px' : '40px 56px', borderTop: `1px solid ${C.border}` }}>
          {BackBtn}
        </div>
      </div>
    )
  }

  return (
    <div style={{ borderTop: `1px solid ${C.border}` }}>
      {NoticeBanner}
      <div style={{
        padding: isMobile ? '32px 16px' : '64px 56px',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}>
        <Tag>{tag}</Tag>
        <h1 style={{
          fontSize: 'clamp(24px, 4vw, 52px)', fontWeight: 700,
          letterSpacing: '-0.02em', color: C.text, margin: 0, lineHeight: 1.05,
        }}>
          {localizedTitle}
        </h1>
      </div>

      <Content />

      <div style={{ padding: isMobile ? '24px 16px' : '40px 48px', borderTop: `1px solid ${C.border}` }}>
        {BackBtn}
      </div>
    </div>
  )
}
