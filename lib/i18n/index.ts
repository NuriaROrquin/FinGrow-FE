"use client"

import { usePreferences } from "@/lib/preferences-context"

import type { Messages } from "./es"
import { messagesFor } from "./messages"

/**
 * Textos de la interfaz en el idioma que eligió el empleado.
 *
 * ```tsx
 * const t = useMessages()
 * return <span>{t.nav.transactions}</span>
 * ```
 */
export function useMessages(): Messages {
  const { preferences, applicationLanguage } = usePreferences()
  return messagesFor(applicationLanguage ?? preferences.language)
}

export { currentMessages, messagesFor } from "./messages"
export type { Messages }
