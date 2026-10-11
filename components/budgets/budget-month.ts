import type { Currency, ExpenseCategory } from "@/lib/api/transactions"
import { formatDateText, formatMoney, formatNumber } from "@/lib/format"

export interface YearMonth {
  year: number
  month: number
}

export function currentYearMonth(): YearMonth {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export function shiftMonth({ year, month }: YearMonth, delta: number): YearMonth {
  const date = new Date(year, month - 1 + delta, 1)
  return { year: date.getFullYear(), month: date.getMonth() + 1 }
}

export function formatYearMonth({ year, month }: YearMonth): string {
  return formatDateText(new Date(year, month - 1, 1), { month: "long", year: "numeric" })
}

export function formatAmount(amount: number, currency: Currency | null): string {
  return currency ? formatMoney(amount, currency) : formatNumber(amount)
}

export const expenseCategoryIcons: Record<ExpenseCategory, string> = {
  Alimentos: "🍔",
  Transporte: "🚗",
  Vivienda: "🏠",
  Servicios: "💡",
  Salud: "🩺",
  Educacion: "📚",
  Entretenimiento: "🎬",
  Indumentaria: "👕",
  AhorroInversion: "🐷",
  Otros: "📦",
}

export const currencyLabels: Record<Currency, string> = {
  ARS: "ARS ($)",
  USD: "USD ($)",
  EUR: "EUR (€)",
  BRL: "BRL (R$)",
}