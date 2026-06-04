import type { CategoryDef } from '@/types'

export const CATEGORIES: CategoryDef[] = [
  { name: 'Alle',                subs: [] },
  { name: 'Latex & Fetischwear', subs: [] },
  { name: 'BDSM & Kontrolle',    subs: [] },
  { name: 'Vibratoren & Elektro',subs: [] },
  { name: 'Dildos',              subs: [] },
  { name: 'Anal',                subs: [] },
]

export const NAV_CATS = ['Latex & Fetischwear', 'BDSM & Kontrolle', 'Vibratoren & Elektro', 'Dildos', 'Anal'] as const
