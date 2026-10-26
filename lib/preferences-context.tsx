"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { toastApiError } from "@/lib/api/notify"
import { getCompanyPreferences } from "@/lib/api/company"
import {
  defaultPreferences,
  getPreferences,
  updatePreferences,
  type Language,
  type Preferences,
} from "@/lib/api/preferences"
import { useAuth } from "@/lib/auth-context"
import { setRegionalPreferences } from "@/lib/format"
import { es } from "@/lib/i18n/es"
import { messagesFor, setMessagesLanguage } from "@/lib/i18n/messages"

interface PreferencesContextType {
  preferences: Preferences
  /**
   * `false` mientras se cargan las preferencias del empleado recién logueado. El dashboard
   * espera a que esté en `true` para no mostrar una pantalla con los valores por defecto y
   * redibujarla un instante después.
   */
  isReady: boolean
  savePreferences: (preferences: Preferences) => Promise<void>
  applicationLanguage: Language | null
  setApplicationLanguage: (language: Language | null) => void
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined)

const supportedLanguages: readonly string[] = ["es", "en", "pt"] satisfies Language[]

// Quien no inició sesión todavía no eligió idioma: la página de inicio y los logins usan el del
// navegador si es uno de los de FinGrow.
function browserLanguage(): Language | null {
  const match = navigator.languages
    .map((tag) => tag.slice(0, 2).toLowerCase())
    .find((code) => supportedLanguages.includes(code))

  return (match as Language | undefined) ?? null
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isHydrated, role } = useAuth()
  const { setTheme } = useTheme()
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences)
  const [applicationLanguage, setApplicationLanguage] = useState<Language | null>(null)

  // Las preferencias son solo del empleado: la empresa y quien no inició sesión usan los
  // valores por defecto. `readyFor` evita que, justo después del login, el dashboard vea
  // como listas las preferencias de la sesión anterior.
  const owner = isAuthenticated && role ? role : "ninguno"
  // next-themes puede devolver un setTheme nuevo en cada render: sin la ref, el efecto de carga
  // se repetir�a al navegar y pisar�a el idioma elegido.
  const setThemeRef = useRef(setTheme)
  setThemeRef.current = setTheme
  const [readyFor, setReadyFor] = useState<string | null>(null)

  useEffect(() => {
    if (!isHydrated) return

    if (owner === "ninguno") {
      setPreferences(defaultPreferences)
      setApplicationLanguage(browserLanguage())
      setReadyFor(owner)
      return
    }

    const controller = new AbortController()

    if (owner === "empresa") {
      getCompanyPreferences(controller.signal)
        .then((loaded) => {
          if (loaded.theme !== null) setThemeRef.current(loaded.theme.toLowerCase())
          setApplicationLanguage(loaded.language)
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return
          toastApiError(error, es.preferences.loadFailed, { showCode: false })
        })
        .finally(() => {
          if (!controller.signal.aborted) setReadyFor(owner)
        })
      return () => controller.abort()
    }

    getPreferences(controller.signal)
      .then((loaded) => {
        setPreferences(loaded)
        setApplicationLanguage(null)
        setThemeRef.current(loaded.theme)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        // Todavía no se sabe el idioma del empleado: el aviso sale en el idioma por defecto.
        toastApiError(error, es.preferences.loadFailed, { showCode: false })
      })
      .finally(() => {
        if (!controller.signal.aborted) setReadyFor(owner)
      })

    return () => controller.abort()
  }, [isHydrated, owner])

  const language = applicationLanguage ?? preferences.language
  const pathname = usePathname()

  // Se aplica durante el render y no en un efecto: así los hijos que se dibujan en esta misma
  // pasada ya formatean montos y fechas, y arman los textos de `lib/api`, con las preferencias nuevas.
  setRegionalPreferences(language, preferences.dateFormat)
  setMessagesLanguage(language)

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  // El `metadata` del layout es del servidor y no conoce el idioma elegido: el título de la pestaña
  // se reemplaza acá. Se repite al navegar por si Next vuelve a poner el del layout.
  useEffect(() => {
    document.title = messagesFor(language).meta.title
  }, [language, pathname])

  const savePreferences = useCallback(
    async (next: Preferences) => {
      await updatePreferences(next)
      setPreferences(next)
      setTheme(next.theme)
    },
    [setTheme],
  )

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        isReady: readyFor === owner,
        savePreferences,
        applicationLanguage,
        setApplicationLanguage,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (context === undefined) {
    throw new Error("usePreferences debe usarse dentro de un PreferencesProvider")
  }
  return context
}
