import { api } from "./client"
import type { Currency } from "./transactions"

export interface DashboardPeriodQuery {
  currency?: Currency
  signal?: AbortSignal
}

export interface DashboardDateRangeQuery extends DashboardPeriodQuery {
  dateFrom?: string
  dateTo?: string
}

export interface DashboardSummaryDto {
  fromDate: string
  toDate: string
  currency: "ARS" | "USD"
  hasMovements: boolean
  balance: number | null
  income: number | null
  expenses: number | null
  savings: number | null
  savingsRate: number | null
  previousPeriodSavingsRate: number | null
}

export interface MonthlyExpenseDto {
  month: string
  totalExpense: number
  currency: Currency
}

export interface IncomeExpenseMonthDto {
  month: string
  totalIncome: number
  totalExpense: number
  currency: Currency
}

export interface ExpenseCategoryTotalDto {
  category: string
  totalExpense: number
  currency: Currency
}

interface DashboardCollectionResponse<TItem> {
  items: TItem[]
}

export function getDashboardSummary(
  query: DashboardDateRangeQuery = {},
): Promise<DashboardSummaryDto> {
  return api.get<DashboardSummaryDto>("/api/dashboard", {
    query: {
      currency: query.currency ?? "ARS",
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    },
    signal: query.signal,
  })
}

export function getMonthlyExpenses(
  query: DashboardPeriodQuery = {},
): Promise<DashboardCollectionResponse<MonthlyExpenseDto>> {
  return api.get<DashboardCollectionResponse<MonthlyExpenseDto>>("/api/transactions/monthly-expenses", {
    query: { currency: query.currency ?? "ARS" },
    signal: query.signal,
  })
}

export function getIncomeVsExpenses(
  query: DashboardPeriodQuery = {},
): Promise<DashboardCollectionResponse<IncomeExpenseMonthDto>> {
  return api.get<DashboardCollectionResponse<IncomeExpenseMonthDto>>("/api/transactions/income-vs-expenses", {
    query: { currency: query.currency ?? "ARS" },
    signal: query.signal,
  })
}

export function getExpensesByCategory(
  query: DashboardDateRangeQuery = {},
): Promise<DashboardCollectionResponse<ExpenseCategoryTotalDto>> {
  return api.get<DashboardCollectionResponse<ExpenseCategoryTotalDto>>("/api/transactions/expenses-by-category", {
    query: {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      currency: query.currency ?? "ARS",
    },
    signal: query.signal,
  })
}
