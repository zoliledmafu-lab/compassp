import { createContext, useContext, useState, type ReactNode } from 'react'
import { type Language, type Translations, translations, LANGUAGE_AI_INSTRUCTION } from '../lib/i18n'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: keyof Translations) => string
  aiInstruction: string
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key as string,
  aiInstruction: '',
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('compass_lang')
    return (stored === 'en' || stored === 'sn' || stored === 'nd') ? stored : 'en'
  })

  function setLanguage(lang: Language) {
    setLanguageState(lang)
    localStorage.setItem('compass_lang', lang)
  }

  function t(key: keyof Translations): string {
    return translations[language][key] ?? translations.en[key] ?? (key as string)
  }

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t,
      aiInstruction: LANGUAGE_AI_INSTRUCTION[language],
    }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
