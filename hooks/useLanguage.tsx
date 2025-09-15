'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Language, translations, getLanguageFlag, getLanguageName } from '@/lib/i18n'

interface LanguageContextType {
    language: Language
    setLanguage: (language: Language) => void
    t: typeof translations.pt
    getFlag: (language: Language) => string
    getName: (language: Language) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>('pt')

    // Load language from localStorage on mount
    useEffect(() => {
        const savedLanguage = localStorage.getItem('app-language') as Language
        if (savedLanguage && ['pt', 'en', 'fr', 'es'].includes(savedLanguage)) {
            setLanguageState(savedLanguage)
        }
    }, [])

    // Save language to localStorage when it changes
    const setLanguage = (newLanguage: Language) => {
        setLanguageState(newLanguage)
        localStorage.setItem('app-language', newLanguage)
    }

    const value: LanguageContextType = {
        language,
        setLanguage,
        t: translations[language],
        getFlag: getLanguageFlag,
        getName: getLanguageName
    }

    return (
        <LanguageContext.Provider value={value}>
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
