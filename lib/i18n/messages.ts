import type { Language } from "@/lib/api/preferences"

import { en } from "./en"
import { es, type Messages } from "./es"
import { pt } from "./pt"

const messagesByLanguage: Record<Language, Messages> = { es, en, pt }

// Igual que `lib/format`: el idioma vive a nivel de módulo para que los textos que se arman fuera
// de los componentes (`lib/api`, helpers de módulo) salgan en el idioma elegido. PreferencesProvider
// lo actualiza cada vez que cambia. Hasta entonces se usa el idioma de origen.
let currentLanguage: Language = "es"

export function setMessagesLanguage(language: Language): void {
  currentLanguage = language
}

export function messagesFor(language: Language): Messages {
  return messagesByLanguage[language]
}

/** Textos del idioma actual, para usar fuera de los componentes. Adentro, usar `useMessages()`. */
export function currentMessages(): Messages {
  return messagesFor(currentLanguage)
}
