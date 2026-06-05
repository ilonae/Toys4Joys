import { useEffect } from 'react'
import type { Page, Product } from '@/types'

interface PageMetaOptions {
  page: Page
  product?: Product
  cat?: string
}

const META: Record<Page, { title: string; description: string }> = {
  about: {
    title: 'Über Uns — TOYS4JOYS',
    description: 'Wer wir sind, was wir machen und warum wir es machen. TOYS4JOYS — Premium Kink aus Berlin.',
  },
  shipping: {
    title: 'Versand & Rückgabe — TOYS4JOYS',
    description: 'Versand innerhalb von 24h, kostenlos ab €49. Diskrete Verpackung, kein Absender. 30 Tage Rückgabe.',
  },
  privacy: {
    title: 'Datenschutz — TOYS4JOYS',
    description: 'Datenschutzerklärung gemäß DSGVO. Informationen zur Verarbeitung deiner personenbezogenen Daten.',
  },
  terms: {
    title: 'AGB — TOYS4JOYS',
    description: 'Allgemeine Geschäftsbedingungen für den Kauf im TOYS4JOYS Online-Shop.',
  },
  imprint: {
    title: 'Impressum — TOYS4JOYS',
    description: 'Impressum gemäß § 5 TMG. Angaben zum Betreiber des TOYS4JOYS Online-Shops.',
  },
  press: {
    title: 'Presse — TOYS4JOYS',
    description: 'Pressekontakt, Logos, Bildmaterial und Informationen für Medien und Kooperationsanfragen.',
  },
  profile: {
    title: 'Mein Konto — TOYS4JOYS',
    description: 'Dein TOYS4JOYS Kundenkonto: Bestellhistorie, Wunschliste und Kontoeinstellungen.',
  },
  home: {
    title: 'TOYS4JOYS — Premium Kink. Berlin.',
    description:
      'Entdecke Premium Fetisch- und Kinkwear aus Berlin. Latex, BDSM, Vibratoren, Dildos und Anal-Toys — diskret versandt, schnell geliefert.',
  },
  shop: {
    title: 'Shop — TOYS4JOYS',
    description:
      'Das vollständige Sortiment: Latex & Fetischwear, BDSM & Kontrolle, Vibratoren & Elektro, Dildos und Anal-Toys. Filtere nach Kategorie und Unterkategorie.',
  },
  product: {
    title: 'Produkt — TOYS4JOYS',
    description:
      'Produktdetails, Materialangaben, Maße und ähnliche Artikel. In den Warenkorb legen und diskret bestellen.',
  },
  cart: {
    title: 'Warenkorb — TOYS4JOYS',
    description:
      'Deine ausgewählten Artikel im Überblick. Versand innerhalb 24h, kostenlos ab €49. Sicher zur Kasse gehen.',
  },
  checkout: {
    title: 'Kasse — TOYS4JOYS',
    description:
      'Sichere Bezahlung via PayPal, Klarna, Kreditkarte, Sofort Überweisung oder Amazon Pay. SSL-gesichert, diskrete Abrechnung — powered by Stripe.',
  },
  admin: {
    title: 'Admin — TOYS4JOYS',
    description: 'Admin-Bereich: Produkte und Bestellungen verwalten.',
  },
  withdrawal: {
    title: 'Widerrufsbelehrung — TOYS4JOYS',
    description: 'Widerrufsrecht und Widerrufsformular gemäß § 312g BGB für Einkäufe im TOYS4JOYS Online-Shop.',
  },
}

export function usePageMeta({ page, product, cat }: PageMetaOptions) {
  useEffect(() => {
    let title = META[page].title
    let description = META[page].description

    if (page === 'product' && product) {
      title = `${product.name} — TOYS4JOYS`
      description = product.desc
        ? `${product.desc.slice(0, 155)}…`
        : `${product.name} — jetzt bei TOYS4JOYS entdecken und diskret bestellen.`
    }

    if (page === 'shop' && cat && cat !== 'Alle') {
      title = `${cat} — TOYS4JOYS`
      description = `${cat}: Das vollständige Sortiment bei TOYS4JOYS. Filtere nach Unterkategorie und finde das Richtige für dich.`
    }

    document.title = title

    let metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.name = 'description'
      document.head.appendChild(metaDesc)
    }
    metaDesc.content = description
  }, [page, product, cat])
}
