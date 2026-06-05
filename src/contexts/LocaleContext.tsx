import React, { createContext, useContext, useState } from 'react'
import type { Locale, Translations } from '@/lib/i18n'
import { translations } from '@/lib/i18n'

interface LocaleContextType {
  locale:    Locale
  setLocale: (l: Locale) => void
  t:         Translations
}

const LocaleContext = createContext<LocaleContextType | null>(null)

const STORAGE_KEY = 't4j_locale'

function getSavedLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (saved && ['de','en','es'].includes(saved)) return saved
  } catch { /* */ }
  return 'de'
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getSavedLocale)

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    try { localStorage.setItem(STORAGE_KEY, l) } catch { /* */ }
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used inside LocaleProvider')
  return ctx
}

// Helper: return the localized display name for a canonical (German) category.
// Falls back to the raw value if no translation exists.
export function useLocalCategory() {
  const { t } = useLocale()
  return function localCategory(cat: string | undefined): string {
    if (!cat) return ''
    const map = t.categories as Record<string, string>
    return map[cat] ?? cat
  }
}

// Helper: return the product name/description in the current locale
// Falls back to German (canonical) if translation is missing
export function useLocalProduct() {
  const { locale } = useLocale()
  return function localProduct<T extends { name: string; desc: string; name_translations?: Record<string, string>; desc_translations?: Record<string, string> }>(p: T) {
    if (locale === 'de') return p
    return {
      ...p,
      name: p.name_translations?.[locale] || p.name,
      desc: p.desc_translations?.[locale] || p.desc,
    }
  }
}
