'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import '../lib/i18n'

type Language = 'ru' | 'en' | 'de'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, options?: any) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('de')  // Standard auf Deutsch ändern
  const { i18n, t } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Загружаем язык из localStorage при монтировании
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && ['ru', 'en', 'de'].includes(savedLanguage)) {
      setLanguageState(savedLanguage)
      i18n.changeLanguage(savedLanguage)
    } else {
      // Wenn keine gespeicherte Sprache, verwende Deutsch als Standard
      setLanguageState('de')
      i18n.changeLanguage('de')
    }
  }, [i18n])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    i18n.changeLanguage(lang)
    localStorage.setItem('language', lang)
  }

  // Предотвращаем hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}