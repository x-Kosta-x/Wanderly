
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, ChevronDown } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

const languages = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
]

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const { language, setLanguage, t } = useLanguage()
  
  const currentLanguage = languages.find(lang => lang.code === language) || languages[0]

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode as 'ru' | 'en' | 'de')
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 hover:bg-white/30 transition-all duration-200 text-white border border-white/20"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">{currentLanguage.name}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    language === lang.code 
                      ? 'bg-blue-50 text-blue-600 font-medium' 
                      : 'text-gray-700'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-sm">{lang.name}</span>
                  {language === lang.code && (
                    <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
