'use client'

import { useState, useRef, useEffect } from 'react'
import { Globe, ChevronDown, Check } from 'lucide-react'
import { LANGUAGES, useLanguageStore, Language } from '@/lib/i18n/translations'
import { useTranslation } from '@/lib/i18n/useTranslation'

export function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const { language, setLanguage } = useLanguageStore()
  const { t } = useTranslation()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLanguage = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-surface-container-low hover:bg-surface-container-high rounded-full transition-all text-xs font-bold text-on-surface-variant border border-outline-variant/10 shadow-sm"
      >
        <span className="text-lg leading-none">{currentLanguage.flag}</span>
        <span className="uppercase tracking-wider hidden sm:inline">{currentLanguage.code}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-surface-container-high backdrop-blur-xl border border-outline-variant/20 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn py-1">
          <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 border-b border-outline-variant/10 mb-1">
            {t('session_language')}
          </div>
          <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-outline-variant/20">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors hover:bg-primary/10 ${
                  language === lang.code ? 'text-primary font-bold' : 'text-on-surface'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg leading-none">{lang.flag}</span>
                  <span>{lang.label}</span>
                </div>
                {language === lang.code && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
