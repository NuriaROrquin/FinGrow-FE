import { api } from "./client"
import type { Currency } from "./transactions"

export interface SavingsVsGoalsMonthDto {
  year: number
  month: number
  income: number
  expense: number
  actualSavings: number
  committed: number
  metTarget: boolean | null
}

export interface SavingsVsGoalsDto {
  currency: Currency
  months: SavingsVsGoalsMonthDto[]
  totalIncome: number
  totalActualSavings: number
  totalCommitted: number
  monthsWithCommitment: number
  monthsOnTarget: number
  savingsRate: number | null
  hasGoals: boolean
}

export function getSavingsVsGoals(
  currency: Currency,
  months: number | null,
  signal?: AbortSignal,
): Promise<SavingsVsGoalsDto> {
  return api.get<SavingsVsGoalsDto>("/api/reports/savings-vs-goals", {
    query: { currency, months },
    signal,
  })
}
