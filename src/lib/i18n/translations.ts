'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { translations, Language, LANGUAGES } from './dictionary'

export { translations, LANGUAGES }
export type { Language }
export type TranslationKey = keyof typeof translations.de

interface LanguageStore {
  language: Language
  setLanguage: (lang: Language) => void
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'de',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'bestellen-language-storage',
    }
  )
)
