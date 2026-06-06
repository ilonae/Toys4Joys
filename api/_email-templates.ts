/**
 * Email template builder — locale-aware HTML for transactional emails.
 *
 * Three templates:
 *   - welcomeEmail()  — sign-up confirmation, with a verification link
 *   - orderEmail()    — order placed + paid, itemized
 *   - shippingEmail() — order shipped, with tracking number
 *
 * All templates share a single dark-brand wrapper so they look consistent
 * in the inbox preview. Inline styles only — most email clients strip <style>.
 * Logo loads from the live site so it works in every inbox without attachments.
 */

export type Locale = 'de' | 'en' | 'es'

// ── Brand colours (must match src/tokens.ts) ───────────────────────────
const C = {
  bg:        '#070509',
  bgCard:    '#0e0b14',
  border:    '#1a1025',
  borderMid: '#241530',
  accent:    '#e50f38',
  text:      '#e4d8f0',
  textMid:   '#9880a8',
  textDim:   '#4a3058',
  white:     '#ffffff',
}

// PNG, not SVG — most email clients (Gmail, Outlook, iCloud) refuse SVG for
// security reasons. PNG works everywhere. Hosted on the production storefront
// so we don't need attachments.
const LOGO_URL = 'https://www.toys4joys.com/images/logo.png'
const SUPPORT  = 'info@toys4joys.com'

// ── Localised strings ───────────────────────────────────────────────────
const STRINGS = {
  de: {
    brandLine:   'BERLIN · KURATIERT & GELEBT',
    discreet:    'Diskrete Verpackung · 30 Tage Rückgabe',
    questions:   'Fragen?',
    legalFooter: 'Du erhältst diese E-Mail, weil du bei TOYS4JOYS ein Konto erstellt oder eine Bestellung aufgegeben hast.',
    // welcome
    welcomeSubject: 'Willkommen bei TOYS4JOYS – bitte bestätige deine E-Mail',
    welcomeHeading: 'Schön, dass du da bist.',
    welcomeBody1:   'Klicke auf den Button unten, um dein Konto zu aktivieren. Der Link ist 24 Stunden gültig.',
    welcomeCta:     'E-MAIL BESTÄTIGEN',
    welcomeBody2:   'Wenn du dich nicht bei TOYS4JOYS registriert hast, kannst du diese E-Mail einfach ignorieren.',
    // order
    orderSubject:   (sid: string) => `Bestellung bestätigt · #${sid}`,
    orderHeading:   'Vielen Dank für deine Bestellung.',
    orderIntro:     'Wir haben deine Zahlung erhalten und die Bestellung an unser Lager weitergegeben. Sobald sie versandt ist, bekommst du eine separate E-Mail mit der Sendungsnummer.',
    orderNumberLbl: 'BESTELLNUMMER',
    summaryLbl:     'BESTELLÜBERSICHT',
    subtotalLbl:    'Zwischensumme',
    shippingLbl:    'Versand',
    freeLbl:        'Kostenlos',
    totalLbl:       'Gesamt',
    taxNote:        (vat: string) => `inkl. 19% MwSt. (${vat})`,
    shipToLbl:      'LIEFERADRESSE',
    // shipping
    shippedSubject: (sid: string) => `Deine Bestellung ist unterwegs · #${sid}`,
    shippedHeading: 'Deine Bestellung ist unterwegs!',
    shippedIntro:   'Wir haben deine Bestellung versendet — diskret verpackt, kein Absender.',
    trackingLbl:    'SENDUNGSNUMMER',
    trackingHint:   'Tracke dein Paket beim entsprechenden Versanddienstleister.',
  },
  en: {
    brandLine:   'BERLIN · CURATED & LIVED',
    discreet:    'Discreet packaging · 30-day returns',
    questions:   'Questions?',
    legalFooter: 'You\'re receiving this because you created an account or placed an order at TOYS4JOYS.',
    welcomeSubject: 'Welcome to TOYS4JOYS – please confirm your email',
    welcomeHeading: 'Welcome aboard.',
    welcomeBody1:   'Click the button below to activate your account. The link is valid for 24 hours.',
    welcomeCta:     'CONFIRM EMAIL',
    welcomeBody2:   'If you didn\'t sign up to TOYS4JOYS, you can safely ignore this email.',
    orderSubject:   (sid: string) => `Order confirmed · #${sid}`,
    orderHeading:   'Thanks for your order.',
    orderIntro:     'We\'ve received your payment and passed the order to our warehouse. You\'ll get a separate email with the tracking number when it ships.',
    orderNumberLbl: 'ORDER NUMBER',
    summaryLbl:     'ORDER SUMMARY',
    subtotalLbl:    'Subtotal',
    shippingLbl:    'Shipping',
    freeLbl:        'Free',
    totalLbl:       'Total',
    taxNote:        (vat: string) => `incl. 19% VAT (${vat})`,
    shipToLbl:      'SHIPPING TO',
    shippedSubject: (sid: string) => `Your order is on its way · #${sid}`,
    shippedHeading: 'Your order is on its way!',
    shippedIntro:   'We\'ve shipped your order — discreetly packaged, no sender visible.',
    trackingLbl:    'TRACKING NUMBER',
    trackingHint:   'Track your package via your local carrier.',
  },
  es: {
    brandLine:   'BERLÍN · CURADO Y VIVIDO',
    discreet:    'Embalaje discreto · 30 días de devolución',
    questions:   '¿Preguntas?',
    legalFooter: 'Recibes este correo porque creaste una cuenta o realizaste un pedido en TOYS4JOYS.',
    welcomeSubject: 'Bienvenido a TOYS4JOYS – por favor confirma tu email',
    welcomeHeading: 'Qué bueno tenerte aquí.',
    welcomeBody1:   'Haz clic en el botón a continuación para activar tu cuenta. El enlace es válido durante 24 horas.',
    welcomeCta:     'CONFIRMAR EMAIL',
    welcomeBody2:   'Si no te registraste en TOYS4JOYS, puedes ignorar este correo.',
    orderSubject:   (sid: string) => `Pedido confirmado · #${sid}`,
    orderHeading:   'Gracias por tu pedido.',
    orderIntro:     'Hemos recibido tu pago y pasado el pedido a nuestro almacén. Recibirás un email separado con el número de seguimiento cuando se envíe.',
    orderNumberLbl: 'NÚMERO DE PEDIDO',
    summaryLbl:     'RESUMEN DEL PEDIDO',
    subtotalLbl:    'Subtotal',
    shippingLbl:    'Envío',
    freeLbl:        'Gratis',
    totalLbl:       'Total',
    taxNote:        (vat: string) => `incl. 19% IVA (${vat})`,
    shipToLbl:      'ENVIAR A',
    shippedSubject: (sid: string) => `Tu pedido está en camino · #${sid}`,
    shippedHeading: '¡Tu pedido está en camino!',
    shippedIntro:   'Hemos enviado tu pedido — embalaje discreto, sin remitente visible.',
    trackingLbl:    'NÚMERO DE SEGUIMIENTO',
    trackingHint:   'Rastrea tu paquete con la empresa de transporte correspondiente.',
  },
} as const

function pickLocale(l?: string): Locale {
  if (l === 'en' || l === 'es') return l
  return 'de'
}

// ── Shared HTML scaffolding ────────────────────────────────────────────
function wrap(body: string, locale: Locale): string {
  const s = STRINGS[locale]
  const langAttr = locale
  return `<!DOCTYPE html><html lang="${langAttr}"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TOYS4JOYS</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:${C.text};-webkit-font-smoothing:antialiased">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.bg};padding:40px 16px">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%">
      <!-- Brand bar -->
      <tr><td style="padding:0 0 28px;border-bottom:1px solid ${C.border}">
        <!--
          Styles on the <img> are inherited by the alt text when the image
          fails to load (Gmail/Outlook default). So if the user has "show
          images" disabled, they still see a styled "TOYS4JOYS" wordmark
          instead of a broken-image icon.
        -->
        <img src="${LOGO_URL}" alt="TOYS4JOYS" height="40" border="0"
             style="display:block;height:40px;width:auto;border:0;outline:none;text-decoration:none;font-size:24px;font-weight:700;letter-spacing:0.18em;color:${C.text};line-height:1" />
        <div style="font-size:10px;letter-spacing:0.16em;color:${C.textDim};margin-top:10px">${s.brandLine}</div>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:36px 0 24px">
        ${body}
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:24px 0 0;border-top:1px solid ${C.border}">
        <p style="font-size:11px;color:${C.textDim};line-height:1.7;margin:0 0 10px">
          ${s.discreet}<br>
          ${s.questions} <a href="mailto:${SUPPORT}" style="color:${C.accent};text-decoration:none">${SUPPORT}</a>
        </p>
        <p style="font-size:10px;color:${C.textDim};line-height:1.6;margin:14px 0 0">
          ${s.legalFooter}
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`
}

function button(label: string, href: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0"><tr><td>
<a href="${href}" style="display:inline-block;background:${C.accent};color:${C.white};text-decoration:none;padding:14px 36px;font-size:12px;font-weight:600;letter-spacing:0.14em;letter-spacing:0.14em">${label}</a>
</td></tr></table>`
}

function h1(text: string) {
  return `<h1 style="font-size:22px;font-weight:700;color:${C.text};margin:0 0 12px;line-height:1.25">${text}</h1>`
}

function p(text: string, opts: { dim?: boolean } = {}) {
  const color = opts.dim ? C.textDim : C.textMid
  return `<p style="font-size:13px;color:${color};line-height:1.7;margin:0 0 14px">${text}</p>`
}

function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase()
}

function eur(n: number): string {
  return `€${n.toFixed(2)}`
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]!))
}

// ── PUBLIC: Welcome / confirm ──────────────────────────────────────────
export function welcomeEmail({
  confirmUrl, locale,
}: { confirmUrl: string; locale?: string }): { subject: string; html: string } {
  const L = pickLocale(locale)
  const s = STRINGS[L]
  const body = `
${h1(s.welcomeHeading)}
${p(s.welcomeBody1)}
${button(s.welcomeCta, confirmUrl)}
<p style="font-size:11px;color:${C.textDim};word-break:break-all;line-height:1.6;margin:18px 0 0">
  ${confirmUrl}
</p>
<p style="font-size:12px;color:${C.textDim};line-height:1.7;margin:28px 0 0;border-top:1px solid ${C.border};padding-top:20px">
  ${s.welcomeBody2}
</p>`
  return { subject: s.welcomeSubject, html: wrap(body, L) }
}

// ── PUBLIC: Order confirmation ─────────────────────────────────────────
export interface OrderItem { name: string; qty: number; price: number }
export interface OrderInfo {
  id:                string
  email:             string
  subtotal:          number
  shipping_cost:     number
  total:             number
  shipping_address?: { firstName?: string; lastName?: string; street?: string; zip?: string; city?: string; country?: string } | null
  order_items:       OrderItem[]
}

export function orderEmail({ order, locale }: { order: OrderInfo; locale?: string }): { subject: string; html: string } {
  const L = pickLocale(locale)
  const s = STRINGS[L]
  const sid = shortId(order.id)

  const itemsHtml = order.order_items.map(i => `
<tr>
  <td style="padding:10px 0;font-size:13px;color:${C.text};border-bottom:1px solid ${C.border}">
    ${i.qty > 1 ? `<span style="color:${C.textDim};margin-right:6px">×${i.qty}</span>` : ''}
    ${escape(i.name)}
  </td>
  <td align="right" style="padding:10px 0;font-size:13px;color:${C.text};border-bottom:1px solid ${C.border};white-space:nowrap">${eur(i.price * i.qty)}</td>
</tr>`).join('')

  const vat = (order.total * 19 / 119).toFixed(2)
  const addr = order.shipping_address
  const addrHtml = addr ? `
<div style="margin-top:28px;padding-top:20px;border-top:1px solid ${C.border}">
  <div style="font-size:10px;letter-spacing:0.14em;color:${C.textDim};margin-bottom:10px">${s.shipToLbl}</div>
  <div style="font-size:13px;color:${C.textMid};line-height:1.8">
    ${[addr.firstName, addr.lastName].filter(Boolean).map(escape).join(' ')}<br>
    ${escape(addr.street ?? '')}<br>
    ${escape(addr.zip ?? '')} ${escape(addr.city ?? '')}<br>
    ${escape(addr.country ?? '')}
  </div>
</div>` : ''

  const body = `
${h1(s.orderHeading)}
${p(s.orderIntro)}

<div style="margin:24px 0 28px;padding:18px 20px;background:${C.bgCard};border:1px solid ${C.border}">
  <div style="font-size:10px;letter-spacing:0.14em;color:${C.textDim};margin-bottom:6px">${s.orderNumberLbl}</div>
  <div style="font-size:20px;font-weight:600;color:${C.text};letter-spacing:0.08em">#${sid}</div>
</div>

<div style="font-size:10px;letter-spacing:0.14em;color:${C.textDim};margin-bottom:14px">${s.summaryLbl}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">
  ${itemsHtml}
  <tr>
    <td style="padding:14px 0 4px;font-size:12px;color:${C.textMid}">${s.subtotalLbl}</td>
    <td align="right" style="padding:14px 0 4px;font-size:12px;color:${C.textMid}">${eur(order.subtotal)}</td>
  </tr>
  <tr>
    <td style="padding:4px 0;font-size:12px;color:${C.textMid}">${s.shippingLbl}</td>
    <td align="right" style="padding:4px 0;font-size:12px;color:${order.shipping_cost === 0 ? C.accent : C.textMid}">
      ${order.shipping_cost === 0 ? s.freeLbl : eur(order.shipping_cost)}
    </td>
  </tr>
  <tr>
    <td style="padding:14px 0 0;font-size:15px;color:${C.text};font-weight:600;border-top:1px solid ${C.border}">${s.totalLbl}</td>
    <td align="right" style="padding:14px 0 0;font-size:15px;color:${C.text};font-weight:600;border-top:1px solid ${C.border}">${eur(order.total)}</td>
  </tr>
  <tr><td colspan="2" style="padding:4px 0 0;font-size:10px;color:${C.textDim}">${s.taxNote('€' + vat)}</td></tr>
</table>

${addrHtml}`
  return { subject: s.orderSubject(sid), html: wrap(body, L) }
}

// ── PUBLIC: Shipping notification ──────────────────────────────────────
export function shippingEmail({
  orderId, trackingNumber, locale,
}: { orderId: string; trackingNumber?: string | null; locale?: string }): { subject: string; html: string } {
  const L = pickLocale(locale)
  const s = STRINGS[L]
  const sid = shortId(orderId)

  const trackingBlock = trackingNumber ? `
<div style="margin:24px 0;padding:20px;background:${C.bgCard};border:1px solid ${C.border}">
  <div style="font-size:10px;letter-spacing:0.12em;color:${C.textDim};margin-bottom:10px">${s.trackingLbl}</div>
  <div style="font-size:16px;color:${C.text};font-weight:600;letter-spacing:0.08em;font-family:monospace">${escape(trackingNumber)}</div>
  <div style="font-size:11px;color:${C.textMid};margin-top:10px">${s.trackingHint}</div>
</div>` : ''

  const body = `
${h1(s.shippedHeading)}
${p(s.shippedIntro)}
<p style="font-size:11px;color:${C.textDim};letter-spacing:0.06em;margin:0 0 6px">${s.orderNumberLbl}: #${sid}</p>
${trackingBlock}`
  return { subject: s.shippedSubject(sid), html: wrap(body, L) }
}
