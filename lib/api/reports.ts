import type { AchievementDto } from "./achievements"
import { api } from "./client"
import type { Currency, ExpenseCategory } from "./transactions"

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

export interface CategoryAmountDto {
  category: ExpenseCategory
  amount: number
}

export interface MonthlySummaryMonthDto {
  year: number
  month: number
  income: number
  expenses: number
  savings: number
  expensesByCategory: CategoryAmountDto[]
  hasMovements: boolean
}

export interface MonthlySummaryDto {
  currency: Currency
  from: string
  to: string
  months: MonthlySummaryMonthDto[]
  totalIncome: number
  totalExpenses: number
  totalSavings: number
  expensesByCategory: CategoryAmountDto[]
}

export function getMonthlySummary(
  currency: Currency,
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<MonthlySummaryDto> {
  return api.get<MonthlySummaryDto>("/api/reports/monthly-summary", {
    query: { currency, from, to },
    signal,
  })
}

export type RecommendationKind = "Positive" | "Warning" | "Tip"

export type RecommendationAction = "None" | "Budgets" | "Goals" | "Transactions" | "Education"

export interface FinancialRecommendationDto {
  kind: RecommendationKind
  title: string
  body: string
  action: RecommendationAction
}

export interface InsightsEligibilityDto {
  isEligible: boolean
  activeMonths: number
  requiredActiveMonths: number
  currentMonthTransactions: number
  requiredTransactions: number
  currentMonthHasIncome: boolean
}

export interface MonthAmountDto {
  year: number
  month: number
  amount: number
}

export interface FinancialHighlightsDto {
  monthCount: number
  hasMovements: boolean
  totalIncome: number
  totalExpenses: number
  totalSavings: number
  savingsRate: number | null
  highestIncomeMonth: MonthAmountDto | null
  highestExpenseMonth: MonthAmountDto | null
  bestSavingsMonth: MonthAmountDto | null
}

export interface FinancialInsightsDto {
  currency: Currency
  from: string
  to: string
  eligibility: InsightsEligibilityDto
  highlights: FinancialHighlightsDto | null
  achievements: AchievementDto[]
  recommendations: FinancialRecommendationDto[]
  recommendationsAvailable: boolean
}

export function getFinancialInsights(
  currency: Currency,
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<FinancialInsightsDto> {
  return api.get<FinancialInsightsDto>("/api/reports/insights", {
    query: { currency, from, to },
    signal,
  })
}
