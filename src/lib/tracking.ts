/**
 * Detect shipping carrier from tracking number format
 * and return a direct tracking URL.
 *
 * Supported: DHL, DPD, Hermes, GLS, UPS
 */

export type Carrier = 'DHL' | 'DPD' | 'Hermes' | 'GLS' | 'UPS' | null

export function detectCarrier(tracking: string): Carrier {
  const t = tracking.trim().toUpperCase()

  // DHL: starts with 00340, 00341, 1Z + 18 digits, or exactly 20 digits
  if (/^(00340|00341)\d+$/.test(t)) return 'DHL'
  if (/^\d{20}$/.test(t))           return 'DHL'
  if (/^JD\d{18}$/.test(t))         return 'DHL'

  // UPS: starts with 1Z
  if (/^1Z[A-Z0-9]{16}$/.test(t)) return 'UPS'

  // DPD: 14 digits
  if (/^\d{14}$/.test(t)) return 'DPD'

  // Hermes: 16 chars starting with H (or pure digits 16)
  if (/^H[A-Z0-9]{15}$/.test(t)) return 'Hermes'

  // GLS: 8 or 11 digits
  if (/^\d{8}$/.test(t) || /^\d{11}$/.test(t)) return 'GLS'

  return null
}

export function trackingUrl(tracking: string): string | null {
  const carrier = detectCarrier(tracking)
  const t = encodeURIComponent(tracking.trim())

  switch (carrier) {
    case 'DHL':    return `https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=${t}`
    case 'DPD':    return `https://tracking.dpd.de/status/de_DE/parcel/${t}`
    case 'Hermes': return `https://www.myhermes.de/empfangen/sendungsverfolgung/sendungsinformation/#${t}`
    case 'GLS':    return `https://gls-group.com/track/${t}`
    case 'UPS':    return `https://www.ups.com/track?tracknum=${t}`
    default:       return null
  }
}
