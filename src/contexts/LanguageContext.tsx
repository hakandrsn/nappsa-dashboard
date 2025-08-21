import { createContext, useContext, useState, type ReactNode } from 'react'

interface LanguageContextType {
  currentLanguage: string
  setLanguage: (language: string) => void
  availableLanguages: string[]
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<string>('tr')
  
  const availableLanguages = ['tr', 'en', 'de', 'fr', 'es']

  const setLanguage = (language: string) => {
    setCurrentLanguage(language)
    // LocalStorage'a kaydet
    localStorage.setItem('preferred-language', language)
  }

  // Sayfa yüklendiğinde localStorage'dan dil ayarını al
  useState(() => {
    const savedLanguage = localStorage.getItem('preferred-language')
    if (savedLanguage && availableLanguages.includes(savedLanguage)) {
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
