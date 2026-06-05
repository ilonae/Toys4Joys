// Mirrors src/lib/shipping.ts for use in Vercel API functions
// (API functions can't import from src/)

type ShippingZone = 'germany' | 'europe' | 'international'

const FREE_THRESHOLD: Record<ShippingZone, number> = {
  germany:       49,
  europe:        100,
  international: 149,
}

const SHIPPING_RATE: Record<ShippingZone, number> = {
  germany:       4.99,
  europe:        8.99,
  international: 19.99,
}

const EUROPE_COUNTRIES = new Set([
  'Österreich','Belgien','Bulgarien','Kroatien','Zypern','Tschechien',
  'Dänemark','Estland','Finnland','Frankreich','Griechenland','Ungarn',
  'Irland','Italien','Lettland','Litauen','Luxemburg','Malta','Niederlande',
  'Polen','Portugal','Rumänien','Slowakei','Slowenien','Spanien','Schweden',
  'Schweiz','Norwegen','Island','Vereinigtes Königreich','Liechtenstein',
  'Austria','Belgium','Bulgaria','Croatia','Cyprus','Czech Republic',
  'Denmark','Estonia','Finland','France','Greece','Hungary','Ireland',
  'Italy','Latvia','Lithuania','Luxembourg','Malta','Netherlands','Poland',
  'Portugal','Romania','Slovakia','Slovenia','Spain','Sweden','Switzerland',
  'Norway','Iceland','United Kingdom','Liechtenstein',
])

function getShippingZone(country: string | undefined): ShippingZone {
  if (!country || country === 'Deutschland' || country === 'Germany') return 'germany'
  if (EUROPE_COUNTRIES.has(country)) return 'europe'
  return 'international'
}

export function calcShipping(subtotal: number, country: string | undefined): number {
  const zone = getShippingZone(country)
  return subtotal >= FREE_THRESHOLD[zone] ? 0 : SHIPPING_RATE[zone]
}
