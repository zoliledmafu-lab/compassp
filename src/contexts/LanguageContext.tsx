import { createContext, useContext, type ReactNode } from 'react'
import { type Language, type Translations, translations } from '../lib/i18n'

interface LanguageContextType {
  language: Language
  t: (key: keyof Translations) => string
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  t: (key) => key as string,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  function t(key: keyof Translations): string {
    return translations.en[key] ?? (key as string)
  }

  return (
    <LanguageContext.Provider value={{ language: 'en', t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
