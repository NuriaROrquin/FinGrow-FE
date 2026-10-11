import { api } from "./client"
import type { Currency } from "./transactions"

export interface SavingsVsGoalsMonthDto {
  year: number
  month: number
  contributed: number
  committed: number
  metTarget: boolean | null
}

export interface SavingsVsGoalsDto {
  currency: Currency
  months: SavingsVsGoalsMonthDto[]
  totalContributed: number
  totalCommitted: number
  monthsWithCommitment: number
  monthsOnTarget: number
  completionRate: number | null
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
