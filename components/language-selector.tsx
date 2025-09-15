'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'
import { Language } from '@/lib/i18n'

export default function LanguageSelector() {
    const { language, setLanguage, t, getFlag, getName } = useLanguage()
    const [isOpen, setIsOpen] = useState(false)

    const languages: Language[] = ['pt', 'en', 'fr', 'es']

    return (
        <div className="relative">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 min-w-[80px]"
            >
                <span>{getFlag(language)}</span>
                <span className="text-xs">{language.toUpperCase()}</span>
                <ChevronDown className="h-3 w-3" />
            </Button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                        <div className="py-1">
                            {languages.map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => {
                                        setLanguage(lang)
                                        setIsOpen(false)
                                    }}
                                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-3 ${language === lang ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                                        }`}
                                >
                                    <span className="text-lg">{getFlag(lang)}</span>
                                    <span>{getName(lang)}</span>
                                    {language === lang && (
                                        <span className="ml-auto text-xs font-medium">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
