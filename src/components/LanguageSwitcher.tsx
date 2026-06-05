import React from 'react'
import { C } from '@/tokens'
import { LOCALES } from '@/lib/i18n'
import { useLocale } from '@/contexts/LocaleContext'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {LOCALES.map((l, i) => (
        <React.Fragment key={l.code}>
          {i > 0 && (
            <span style={{ fontSize: '10px', color: C.border, userSelect: 'none' }}>|</span>
          )}
          <button
            onClick={() => setLocale(l.code)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '2px 6px', fontFamily: 'inherit',
              fontSize: '10px', letterSpacing: '0.1em',
              color: locale === l.code ? C.text : C.textDim,
              fontWeight: locale === l.code ? 700 : 400,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { if (locale !== l.code) (e.currentTarget as HTMLButtonElement).style.color = C.textMid }}
            onMouseLeave={e => { if (locale !== l.code) (e.currentTarget as HTMLButtonElement).style.color = C.textDim }}
            title={l.flag + ' ' + l.label}
          >
            {l.flag} {l.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  )
}
