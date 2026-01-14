'use client'

import { useEffect, useState } from 'react'
import { Languages, Globe, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const COOKIE_NAME = 'googtrans'

// Google Translate languages
const TRANSLATE_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'zh-CN', name: 'Chinese', native: '中文' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'th', name: 'Thai', native: 'ไทย' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
]

// Helper to get cookie value
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift()
    return cookieValue || null
  }
  return null
}

// Helper to set cookie
function setCookie(name: string, value: string, days: number = 365) {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
}

// Helper to delete cookie
function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/`
}

// Simple translate button component for enabling translation
interface EnableTranslateButtonProps {
  currentLang: 'en' | 'vi'
  targetLang: string
  children: React.ReactNode
}

export function EnableTranslateButton({ currentLang, targetLang, children }: EnableTranslateButtonProps) {
  const handleEnableTranslate = () => {
    // Set the googtrans cookie with format: /source/target
    const cookieValue = `/${currentLang}/${targetLang}`
    const expires = new Date()
    expires.setTime(expires.getTime() + 365 * 24 * 60 * 60 * 1000)
    document.cookie = `googtrans=${encodeURIComponent(cookieValue)};expires=${expires.toUTCString()};path=/`

    // Reload to apply translation
    window.location.reload()
  }

  return (
    <button onClick={handleEnableTranslate}>
      {children}
    </button>
  )
}

interface GoogleTranslateWidgetProps {
  currentLang: 'en' | 'vi'
}

export function GoogleTranslateWidget({ currentLang }: GoogleTranslateWidgetProps) {
  const [selectedLang, setSelectedLang] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Load saved language on mount
  useEffect(() => {
    const cookie = getCookie(COOKIE_NAME)
    if (cookie) {
      try {
        // Format: /en/vi or /en/fr
        const decoded = decodeURIComponent(cookie)
        const match = decoded.match(/^\/\w+\/(\w+(-\w+)?)$/)
        if (match) {
          const langCode = match[1]
          if (langCode !== currentLang) {
            setSelectedLang(langCode)
          }
        }
      } catch {
        // Invalid format, ignore
      }
    }
  }, [currentLang])

  // Apply translation by setting cookie and reloading
  const applyTranslation = (targetLang: string) => {
    // Set the googtrans cookie with format: /source/target
    const cookieValue = `/${currentLang}/${targetLang}`
    setCookie(COOKIE_NAME, encodeURIComponent(cookieValue))

    setSelectedLang(targetLang)
    setIsOpen(false)

    // Reload to apply translation
    window.location.reload()
  }

  // Clear translation (restore original)
  const clearTranslation = () => {
    // Clear the cookie
    deleteCookie(COOKIE_NAME)

    setSelectedLang(null)
    setIsOpen(false)

    // Reload to restore original
    window.location.reload()
  }

  // Get display label for current selection
  const getDisplayLabel = () => {
    if (!selectedLang) return 'Translate'
    const lang = TRANSLATE_LANGUAGES.find(l => l.code === selectedLang)
    return lang ? lang.native : 'Translate'
  }

  return (
    <>
      {/* Hidden Google Translate element */}
      <div id="google_translate_element" style={{ display: 'none' }} />

      {/* Custom Translate Button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 font-medium gap-1.5"
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{getDisplayLabel()}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 max-h-80 overflow-y-auto p-1" align="end">
          <div className="space-y-0.5">
            {/* Original language option */}
            <button
              key="original"
              onClick={clearTranslation}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs text-left transition-colors ${
                !selectedLang
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'hover:bg-muted text-foreground'
              }`}
              disabled={!selectedLang}
            >
              <Languages className="h-3.5 w-3.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">Original</div>
                <div className="text-[10px] text-muted-foreground truncate">Restore original</div>
              </div>
              {!selectedLang && <Check className="h-3 w-3 text-primary" />}
            </button>

            <div className="border-t border-border/50 my-1" />

            {/* Language options */}
            {TRANSLATE_LANGUAGES.map((lang) => {
              const isSelected = selectedLang === lang.code
              const isOriginal = lang.code === currentLang

              return (
                <button
                  key={lang.code}
                  onClick={() => applyTranslation(lang.code)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs text-left transition-colors ${
                    isOriginal
                      ? 'opacity-50 cursor-not-allowed'
                      : isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted text-foreground'
                  }`}
                  disabled={isOriginal}
                >
                  <Globe className="h-3.5 w-3.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{lang.native}</div>
                    <div className="text-[10px] opacity-70 truncate">{lang.name}</div>
                  </div>
                  {isSelected && <Check className="h-3 w-3" />}
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}

// Also load Google Translate script
declare global {
  interface Window {
    googleTranslateElementInit?: () => void
    google?: {
      translate: {
        TranslateElement: {
          new (options: any, elementId: string): void
          InlineLayout: {
            SIMPLE: number
          }
        }
      }
    }
  }
}

// Hook to check if Google Translate is enabled
export function useTranslateEnabled(currentLang: 'en' | 'vi') {
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    const cookie = getCookie(COOKIE_NAME)
    if (cookie) {
      try {
        const decoded = decodeURIComponent(cookie)
        const match = decoded.match(/^\/\w+\/(\w+(-\w+)?)$/)
        if (match) {
          const targetLang = match[1]
          setIsEnabled(targetLang !== currentLang)
        }
      } catch {
        setIsEnabled(false)
      }
    }
  }, [currentLang])

  return isEnabled
}

// Simple toggle button for Google Translate
interface TranslateToggleProps {
  currentLang: 'en' | 'vi'
  defaultTargetLang?: string
}

export function TranslateToggle({ currentLang, defaultTargetLang }: TranslateToggleProps) {
  const isEnabled = useTranslateEnabled(currentLang)

  const handleToggle = () => {
    if (isEnabled) {
      // Disable: clear cookie
      deleteCookie(COOKIE_NAME)
    } else {
      // Enable: set cookie to translate to default target
      const targetLang = defaultTargetLang || (currentLang === 'en' ? 'vi' : 'en')
      const cookieValue = `/${currentLang}/${targetLang}`
      setCookie(COOKIE_NAME, encodeURIComponent(cookieValue))
    }
    // Reload to apply changes
    window.location.reload()
  }

  return (
    <Button
      onClick={handleToggle}
      variant={isEnabled ? 'default' : 'outline'}
      size="sm"
      className={`h-8 px-3 text-xs font-medium gap-1.5 ${
        isEnabled ? 'bg-primary text-primary-foreground' : ''
      }`}
    >
      <Languages className="h-3.5 w-3.5" />
      {isEnabled ? 'Translation On' : 'Translation Off'}
    </Button>
  )
}

export function GoogleTranslateScript({ pageLang }: { pageLang: 'en' | 'vi' }) {
  useEffect(() => {
    // Check if cookie exists and auto-translate
    const cookie = getCookie(COOKIE_NAME)
    if (!cookie) {
      // No cookie, don't load Google Translate at all
      // Default is no translation
      return
    }

    // Parse cookie to see if translation is needed
    try {
      const decoded = decodeURIComponent(cookie)
      const match = decoded.match(/^\/\w+\/(\w+(-\w+)?)$/)
      if (match) {
        const targetLang = match[1]
        if (targetLang !== pageLang) {
          // Translation needed - load script
          loadGoogleTranslateScript()
        }
      }
    } catch {
      // Invalid cookie, ignore
    }
  }, [pageLang])

  const loadGoogleTranslateScript = () => {
    // Skip if already loaded
    if (document.querySelector('script[src*="translate.google.com"]')) {
      return
    }

    // Initialize callback
    window.googleTranslateElementInit = () => {
      try {
        if (window.google?.translate?.TranslateElement) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: pageLang,
              includedLanguages: TRANSLATE_LANGUAGES.map(l => l.code).join(','),
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
            },
            'google_translate_element'
          )
        }
      } catch (error) {
        console.error('Google Translate initialization error:', error)
      }
    }

    // Load Google Translate script
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    document.head.appendChild(script)

    return () => {
      // Cleanup script
      const existingScript = document.querySelector('script[src*="translate.google.com"]')
      if (existingScript) {
        existingScript.remove()
      }
    }
  }

  return null
}
