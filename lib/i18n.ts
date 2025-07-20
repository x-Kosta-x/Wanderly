import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import Backend from 'i18next-resources-to-backend'

const resources = Backend((language: string, namespace: string) => {
  return import(`../locales/${language}/${namespace}.json`)
})

i18n
  .use(resources)
  .use(initReactI18next)
  .init({
    fallbackLng: 'de',  // Fallback auf Deutsch ändern
    debug: false,
    defaultNS: 'common',
    ns: ['common'],
    
    interpolation: {
      escapeValue: false,
    },
    
    react: {
      useSuspense: false,
    },
  })

export default i18n