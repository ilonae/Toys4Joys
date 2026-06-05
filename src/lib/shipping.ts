export type ShippingZone = 'germany' | 'europe' | 'international'

export const FREE_THRESHOLD: Record<ShippingZone, number> = {
  germany:       49,
  europe:        100,
  international: 149,
}

export const SHIPPING_RATE: Record<ShippingZone, number> = {
  germany:       4.99,
  europe:        8.99,
  international: 19.99,
}

// All European countries in both German and English spellings
const EUROPE_COUNTRIES = new Set([
  // German names (used in our forms)
  'Österreich','Belgien','Bulgarien','Kroatien','Zypern','Tschechien',
  'Dänemark','Estland','Finnland','Frankreich','Griechenland','Ungarn',
  'Irland','Italien','Lettland','Litauen','Luxemburg','Malta','Niederlande',
  'Polen','Portugal','Rumänien','Slowakei','Slowenien','Spanien','Schweden',
  'Schweiz','Norwegen','Island','Vereinigtes Königreich','Liechtenstein',
  // English names (fallback)
  'Austria','Belgium','Bulgaria','Croatia','Cyprus','Czech Republic',
  'Denmark','Estonia','Finland','France','Greece','Hungary','Ireland',
  'Italy','Latvia','Lithuania','Luxembourg','Malta','Netherlands','Poland',
  'Portugal','Romania','Slovakia','Slovenia','Spain','Sweden','Switzerland',
  'Norway','Iceland','United Kingdom','Liechtenstein',
])

export function getShippingZone(country: string | undefined): ShippingZone {
  if (!country || country === 'Deutschland' || country === 'Germany') return 'germany'
  if (EUROPE_COUNTRIES.has(country)) return 'europe'
  return 'international'
}

export function calcShipping(subtotal: number, country: string | undefined): number {
  const zone = getShippingZone(country)
  return subtotal >= FREE_THRESHOLD[zone] ? 0 : SHIPPING_RATE[zone]
}

export function shippingLabel(zone: ShippingZone): string {
  return { germany: 'Deutschland', europe: 'Europa', international: 'International' }[zone]
}
