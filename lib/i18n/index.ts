"use client"

import type { Language } from "@/lib/api/preferences"
import { usePreferences } from "@/lib/preferences-context"

import { en } from "./en"
import { es, type Messages } from "./es"
import { pt } from "./pt"

const messagesByLanguage: Record<Language, Messages> = { es, en, pt }

/**
 * Textos de la interfaz en el idioma que eligió el empleado.
 *
 * ```tsx
 * const t = useMessages()
 * return <span>{t.nav.transactions}</span>
 * ```
 */
export function useMessages(): Messages {
  const { preferences } = usePreferences()
  return messagesByLanguage[preferences.language]
}

export type { Messages }
