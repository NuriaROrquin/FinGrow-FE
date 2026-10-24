import { api } from "./client"
import { isApiError } from "./errors"
import type { FinancialRecommendationDto } from "./reports"
import type { Currency, ExpenseCategory } from "./transactions"

export type BudgetPeriod = "Monthly" | "Yearly"

export type BudgetHealth = "OnTrack" | "Warning" | "Exceeded"

export interface BudgetLimitDto {
  category: ExpenseCategory
  amount: number
  spent?: number | null
  remaining?: number | null
  usedPercentage?: number | null
  health?: BudgetHealth | null
}

export interface BudgetDto {
  id: string
  period: BudgetPeriod
  periodStart: string
  periodEnd: string
  currency: Currency | null
  limits: BudgetLimitDto[]
  createdAt: string
}

export interface CreateBudgetPayload {
  year: number
  month: number
  currency: Currency
  limits: BudgetLimitDto[]
}

export async function getBudget(year: number, month: number, signal?: AbortSignal): Promise<BudgetDto | null> {
  try {
    return await api.get<BudgetDto>(`/api/budgets/${year}/${month}`, { signal })
  } catch (error) {
    if (isApiError(error) && error.status === 404) {
      return null
    }

    throw error
  }
}

export function createBudget(payload: CreateBudgetPayload, signal?: AbortSignal): Promise<BudgetDto> {
  return api.post<BudgetDto>("/api/budgets", payload, { signal })
}

export interface SetBudgetLimitPayload {
  category: ExpenseCategory
  amount: number
}

export function setBudgetLimit(
  year: number,
  month: number,
  payload: SetBudgetLimitPayload,
  signal?: AbortSignal,
): Promise<BudgetDto> {
  return api.put<BudgetDto>(`/api/budgets/${year}/${month}/limits`, payload, { signal })
}

export function removeBudgetLimit(
  year: number,
  month: number,
  category: ExpenseCategory,
  signal?: AbortSignal,
): Promise<BudgetDto> {
  return api.delete<BudgetDto>(`/api/budgets/${year}/${month}/limits/${category}`, { signal })
}

export function deleteBudget(year: number, month: number, signal?: AbortSignal): Promise<void> {
  return api.delete(`/api/budgets/${year}/${month}`, { signal })
}

export function duplicatePreviousBudget(year: number, month: number, signal?: AbortSignal): Promise<BudgetDto> {
  return api.post<BudgetDto>("/api/budgets/duplicate-previous", { year, month }, { signal })
}
export interface BudgetAnalysisEligibilityDto {
  isEligible: boolean
  budgetMonths: number
  requiredBudgetMonths: number
  analyzedMonths: number
  hasCurrentMonthBudget: boolean
}

export interface BudgetMonthComplianceDto {
  year: number
  month: number
  categoriesWithLimit: number
  categoriesWithinLimit: number
  totalLimit: number
  totalSpent: number
}

export interface BudgetCategoryAnalysisDto {
  category: ExpenseCategory
  monthsWithLimit: number
  monthsExceeded: number
  averageLimit: number
  averageSpent: number
  averageUsedPercentage: number
  lastExceededMonth: string | null
}

export interface BudgetAnalysisSummaryDto {
  firstMonth: string
  lastMonth: string
  closedBudgets: number
  lastClosedMonth: BudgetMonthComplianceDto
  mostExceededCategory: ExpenseCategory | null
  categories: BudgetCategoryAnalysisDto[]
}

export interface BudgetAnalysisDto {
  currency: Currency
  eligibility: BudgetAnalysisEligibilityDto
  summary: BudgetAnalysisSummaryDto | null
  recommendations: FinancialRecommendationDto[]
  recommendationsAvailable: boolean
}

export function getBudgetAnalysis(currency: Currency, signal?: AbortSignal): Promise<BudgetAnalysisDto> {
  return api.get<BudgetAnalysisDto>("/api/budgets/analysis", { query: { currency }, signal })
}
