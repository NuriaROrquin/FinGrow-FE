"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { useTheme } from "next-themes"
import { toastApiError } from "@/lib/api/notify"
import { defaultPreferences, getPreferences, updatePreferences, type Preferences } from "@/lib/api/preferences"
import { useAuth } from "@/lib/auth-context"
import { setRegionalPreferences } from "@/lib/format"
import { es } from "@/lib/i18n/es"

interface PreferencesContextType {
  preferences: Preferences
  /**
   * `false` mientras se cargan las preferencias del empleado recién logueado. El dashboard
   * espera a que esté en `true` para no mostrar una pantalla con los valores por defecto y
   * redibujarla un instante después.
   */
  isReady: boolean
  savePreferences: (preferences: Preferences) => Promise<void>
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isHydrated, role } = useAuth()
  const { setTheme } = useTheme()
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences)

  // Las preferencias son solo del empleado: la empresa y quien no inició sesión usan los
  // valores por defecto. `readyFor` evita que, justo después del login, el dashboard vea
  // como listas las preferencias de la sesión anterior.
  const owner = isAuthenticated && role === "empleado" ? "empleado" : "ninguno"
  const [readyFor, setReadyFor] = useState<string | null>(null)

  useEffect(() => {
    if (!isHydrated) return

    if (owner === "ninguno") {
      setPreferences(defaultPreferences)
      setReadyFor(owner)
      return
    }

    const controller = new AbortController()

    getPreferences(controller.signal)
      .then((loaded) => {
        setPreferences(loaded)
        setTheme(loaded.theme)
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
  }, [isHydrated, owner, setTheme])

  // Se aplica durante el render y no en un efecto: así los hijos que se dibujan en esta misma
  // pasada ya formatean montos y fechas con las preferencias nuevas.
  setRegionalPreferences(preferences.language, preferences.dateFormat)

  useEffect(() => {
    document.documentElement.lang = preferences.language
  }, [preferences.language])

  const savePreferences = useCallback(
    async (next: Preferences) => {
      await updatePreferences(next)
      setPreferences(next)
      setTheme(next.theme)
    },
    [setTheme],
  )

  return (
    <PreferencesContext.Provider value={{ preferences, isReady: readyFor === owner, savePreferences }}>
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
