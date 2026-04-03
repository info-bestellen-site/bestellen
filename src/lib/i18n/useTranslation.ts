'use client'

import { translations, useLanguageStore, Language, TranslationKey } from './translations'

export function useTranslation() {
  const { language } = useLanguageStore()

  const t = (key: TranslationKey | string): string => {
    // Cast to Language to ensure it's a valid key
    const currentTranslations = translations[language as Language] || translations.de
    return currentTranslations[key] || (translations.de[key] || key)
  }

  return {
    t,
    language,
    setLanguage: useLanguageStore.getState().setLanguage,
    translations: translations[language as Language] || translations.de
  }
}
