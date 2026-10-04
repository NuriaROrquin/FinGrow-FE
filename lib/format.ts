import { format as formatPattern, parseISO } from "date-fns"

import { defaultPreferences, type DateFormat, type Language } from "@/lib/api/preferences"
import type { Currency } from "@/lib/api/transactions"

// Formato regional de montos, números y fechas según las preferencias del empleado (HU-03).
// Son funciones comunes y no un hook para poder usarlas también fuera de los componentes
// (helpers de módulo, `lib/api`). PreferencesProvider actualiza la configuración cada vez
// que cambian las preferencias.

const localeByLanguage: Record<Language, string> = { es: "es-AR", en: "en-US", pt: "pt-BR" }

const datePatterns: Record<DateFormat, string> = { dmy: "dd/MM/yyyy", mdy: "MM/dd/yyyy", ymd: "yyyy-MM-dd" }

let locale = localeByLanguage[defaultPreferences.language]
let datePattern = datePatterns[defaultPreferences.dateFormat]

export function setRegionalPreferences(language: Language, dateFormat: DateFormat): void {
  locale = localeByLanguage[language]
  datePattern = datePatterns[dateFormat]
}

/** El símbolo sale de la moneda del importe y los separadores, del idioma: `$ 1.234,56`, `US$ 1.234,56`. */
export function formatMoney(
  amount: number,
  currency: Currency,
  digits?: Pick<Intl.NumberFormatOptions, "minimumFractionDigits" | "maximumFractionDigits">,
): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency, ...digits }).format(amount)
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return value.toLocaleString(locale, options)
}

/** Fecha numérica en el formato elegido: `04/10/2026`, `10/04/2026` o `2026-10-04`. */
export function formatDate(value: Date | string): string {
  return formatPattern(toDate(value), datePattern)
}

export function formatDateTime(value: Date | string): string {
  return formatPattern(toDate(value), `${datePattern} HH:mm`)
}

/** Fecha con nombre de mes (`4 de octubre de 2026`, `oct`), en el idioma elegido. */
export function formatDateText(value: Date | string, options: Intl.DateTimeFormatOptions): string {
  return toDate(value).toLocaleDateString(locale, options)
}

// `new Date("2026-10-04")` interpreta la fecha en UTC y en Argentina la corre al día anterior;
// parseISO toma una fecha sin hora como local.
function toDate(value: Date | string): Date {
  return typeof value === "string" ? parseISO(value) : value
}
