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

const relativeUnits: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60],
  ["month", 30 * 24 * 60 * 60],
  ["week", 7 * 24 * 60 * 60],
  ["day", 24 * 60 * 60],
  ["hour", 60 * 60],
  ["minute", 60],
]

/** Cuánto pasó desde un instante, en el idioma elegido: `hace 5 minutos`, `ayer`, `hace 2 semanas`. */
export function formatRelativeTime(value: Date | string, now: Date = new Date()): string {
  const elapsedSeconds = Math.round((toDate(value).getTime() - now.getTime()) / 1000)
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })

  for (const [unit, seconds] of relativeUnits) {
    if (Math.abs(elapsedSeconds) >= seconds) {
      return formatter.format(Math.trunc(elapsedSeconds / seconds), unit)
    }
  }

  return formatter.format(0, "minute")
}

// `new Date("2026-10-04")` interpreta la fecha en UTC y en Argentina la corre al día anterior;
// parseISO toma una fecha sin hora como local.
function toDate(value: Date | string): Date {
  return typeof value === "string" ? parseISO(value) : value
}
