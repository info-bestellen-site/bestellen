'use client'

import { translations, useLanguageStore, Language, TranslationKey } from './translations'

export function useTranslation() {
  const { language } = useLanguageStore()

  const t = (key: TranslationKey | string, variables?: Record<string, string | number>): string => {
    // Cast to Language to ensure it's a valid key
    const currentTranslations = translations[language as Language] || translations.de
    let text = currentTranslations[key] || (translations.de[key] || key)
    
    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v))
      })
    }
    
    return text
  }

  return {
    t,
    language,
    setLanguage: useLanguageStore.getState().setLanguage,
    translations: translations[language as Language] || translations.de
  }
}
