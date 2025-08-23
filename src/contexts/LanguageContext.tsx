import { createContext, useContext, useState, type ReactNode } from 'react'

interface Language {
  code: string
  name: string
  flag: string
}

interface LanguageContextType {
  currentLanguage: string
  setLanguage: (language: string) => void
  availableLanguages: Language[]
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<string>('tr')
  
  const availableLanguages: Language[] = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' }
  ]

  const setLanguage = (language: string) => {
    setCurrentLanguage(language)
    // LocalStorage'a kaydet
    localStorage.setItem('preferred-language', language)
  }

  // Sayfa yüklendiğinde localStorage'dan dil ayarını al
  useState(() => {
    const savedLanguage = localStorage.getItem('preferred-language')
    if (savedLanguage && availableLanguages.some(lang => lang.code === savedLanguage)) {
      setCurrentLanguage(savedLanguage)
    }
  })

  return (
    <LanguageContext.Provider value={{ 
      currentLanguage, 
      setLanguage, 
      availableLanguages 
    }}>
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
