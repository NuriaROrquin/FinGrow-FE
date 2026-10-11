import { api } from "./client"
import type { Currency } from "./transactions"

export type ThemePreference = "system" | "light" | "dark"
export type Language = "es" | "en" | "pt"
export type DateFormat = "dmy" | "mdy" | "ymd"

export interface Preferences {
  theme: ThemePreference
  language: Language
  currency: Currency
  dateFormat: DateFormat
}

export const defaultPreferences: Preferences = {
  theme: "system",
  language: "es",
  currency: "ARS",
  dateFormat: "dmy",
}

// El backend usa los nombres de sus enums; el frontend, los valores que ya esperan
// next-themes y los selectores de Configuración.
type ThemeDto = "System" | "Light" | "Dark"
type DateFormatDto = "DayMonthYear" | "MonthDayYear" | "YearMonthDay"

interface PreferencesDto {
  theme: ThemeDto
  language: Language
  currency: Currency
  dateFormat: DateFormatDto
}

const themeFromDto: Record<ThemeDto, ThemePreference> = { System: "system", Light: "light", Dark: "dark" }
const themeToDto: Record<ThemePreference, ThemeDto> = { system: "System", light: "Light", dark: "Dark" }

const dateFormatFromDto: Record<DateFormatDto, DateFormat> = {
  DayMonthYear: "dmy",
  MonthDayYear: "mdy",
  YearMonthDay: "ymd",
}
const dateFormatToDto: Record<DateFormat, DateFormatDto> = {
  dmy: "DayMonthYear",
  mdy: "MonthDayYear",
  ymd: "YearMonthDay",
}

export async function getPreferences(signal?: AbortSignal): Promise<Preferences> {
  const dto = await api.get<PreferencesDto>("/account/preferences", { signal })

  return {
    theme: themeFromDto[dto.theme],
    language: dto.language,
    currency: dto.currency,
    dateFormat: dateFormatFromDto[dto.dateFormat],
  }
}

export function updatePreferences(preferences: Preferences): Promise<void> {
  const dto: PreferencesDto = {
    theme: themeToDto[preferences.theme],
    language: preferences.language,
    currency: preferences.currency,
    dateFormat: dateFormatToDto[preferences.dateFormat],
  }

  return api.put("/account/preferences", dto)
}
