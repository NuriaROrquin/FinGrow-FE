import { api } from "./client"
import type { SortDirection } from "./investments"

export type TransactionType = "Income" | "Expense"

export type ExpenseCategory =
  | "Alimentos"
  | "Transporte"
  | "Vivienda"
  | "Servicios"
  | "Salud"
  | "Educacion"
  | "Entretenimiento"
  | "Indumentaria"
  | "AhorroInversion"
  | "Otros"

export type IncomeCategory = "Salario" | "Freelance" | "Inversiones" | "Regalo" | "Otros"

// Las etiquetas de estos valores están en `lib/i18n` (`labels`): acá quedan solo los valores
// que viajan a la API, que no se traducen.
export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Alimentos",
  "Transporte",
  "Vivienda",
  "Servicios",
  "Salud",
  "Educacion",
  "Entretenimiento",
  "Indumentaria",
  "AhorroInversion",
  "Otros",
]

export type TransactionStatus = "Confirmed" | "Pending"
export type TransactionListStatus = TransactionStatus | "Eliminated"

export type Currency = "ARS" | "USD" | "EUR" | "BRL"

export type PaymentMethod = "Cash" | "CreditCard" | "DebitCard" | "BankTransfer" | "DigitalWallet"

export interface TransactionDto {
  id: string
  type: TransactionType
  amount: number
  currency: Currency
  /** Valor de `ExpenseCategory` o `IncomeCategory`, según `type`. */
  category: string
  description: string
  occurredOn: string
  paymentMethod: PaymentMethod
  source: string
  status: TransactionListStatus
  createdAt: string
  receiptId: string | null
}

export interface CreateTransactionPayload {
  type: TransactionType
  amount: number
  currency: Currency
  expenseCategory: ExpenseCategory | null
  incomeCategory: IncomeCategory | null
  description: string
  occurredOn: string
  paymentMethod: PaymentMethod
  status: TransactionStatus
  receiptId?: string | null
}

export type UpdateTransactionPayload = CreateTransactionPayload

export interface TransactionsResponse {
  items: TransactionDto[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface TransactionSummaryResponse {
  currencies: Partial<Record<Currency, CurrencyTransactionSummary>>
  otherCurrencies: Currency[]
}

export interface CurrencyTransactionSummary {
  income: number
  expenses: number
  balance: number
  transactions: number
  incomeTransactions: number
  expenseTransactions: number
}

export interface TransactionFilters {
  search?: string
  type?: TransactionType
  expenseCategory?: ExpenseCategory
  incomeCategory?: IncomeCategory
  status?: TransactionListStatus[]
  paymentMethod?: PaymentMethod
  /** Fecha desde, formato yyyy-MM-dd (inclusive). */
  dateFrom?: string
  /** Fecha hasta, formato yyyy-MM-dd (inclusive). */
  dateTo?: string
  sortBy?: TransactionSortField
  sortDirection?: SortDirection
}

export type TransactionSortField =
  | "OccurredOn"
  | "Description"
  | "Category"
  | "PaymentMethod"
  | "Source"
  | "Status"
  | "Amount"

export interface TransactionSummaryFilters {
  dateFrom?: string
  dateTo?: string
}

export function getTransactionSummary(
  filters: TransactionSummaryFilters = {},
  signal?: AbortSignal,
): Promise<TransactionSummaryResponse> {
  return api.get<TransactionSummaryResponse>("/api/transactions/summary", {
    query: { dateFrom: filters.dateFrom, dateTo: filters.dateTo },
    signal,
  })
}

export function listTransactions(
  pageNumber = 1,
  pageSize = 10,
  filters: TransactionFilters = {},
  signal?: AbortSignal,
): Promise<TransactionsResponse> {
  return api.get<TransactionsResponse>("/api/transactions", {
    query: {
      pageNumber,
      pageSize,
      search: filters.search,
      type: filters.type,
      expenseCategory: filters.expenseCategory,
      incomeCategory: filters.incomeCategory,
      status: filters.status,
      paymentMethod: filters.paymentMethod,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      sortBy: filters.sortBy,
      sortDirection: filters.sortDirection,
    },
    signal,
  })
}

export function exportTransactions(filters: TransactionFilters = {}): Promise<Blob> {
  return api.get<Blob>("/api/transactions/export", {
    query: {
      search: filters.search,
      transactionType: filters.type,
      expenseCategory: filters.expenseCategory,
      incomeCategory: filters.incomeCategory,
      transactionStatus: filters.status,
      paymentMethod: filters.paymentMethod,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    },
    headers: {
      Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
    responseType: "blob",
  })
}

export function createTransaction(payload: CreateTransactionPayload, signal?: AbortSignal): Promise<TransactionDto> {
  return api.post<TransactionDto>("/api/transactions", payload, { signal })
}

export function updateTransaction(
  id: string,
  payload: UpdateTransactionPayload,
  signal?: AbortSignal,
): Promise<TransactionDto> {
  return api.put<TransactionDto>(`/api/transactions/${encodeURIComponent(id)}`, payload, { signal })
}

export function deleteTransaction(id: string, signal?: AbortSignal): Promise<void> {
  return api.delete(`/api/transactions/${encodeURIComponent(id)}`, { signal })
}

export function removeTransactionReceipt(id: string, signal?: AbortSignal): Promise<void> {
  return api.delete(`/api/transactions/${encodeURIComponent(id)}/receipt`, { signal })
}

export type ConfidenceLevel = "Low" | "Medium" | "High"

export type TransactionSource = "Manual" | "ReceiptScan" | "Gmail" | "Telegram" | "WhatsApp" | "MercadoPago"

export interface PendingTransactionDto {
  id: string
  type: TransactionType
  amount: number
  currency: Currency
  category: string
  description: string
  occurredOn: string
  paymentMethod: PaymentMethod
  source: TransactionSource
  status: "Pending"
  createdAt: string
  updatedAt: string
  aiConfidence: number | null
  aiConfidenceLevel: ConfidenceLevel | null
  receiptId: string | null
}

export interface PendingTransactionsResponse {
  items: PendingTransactionDto[]
  totalCount: number
}

export type ConfirmTransactionPayload = Omit<CreateTransactionPayload, "status">

export function listPendingTransactions(signal?: AbortSignal): Promise<PendingTransactionsResponse> {
  return api.get<PendingTransactionsResponse>("/api/transactions/pending", { signal })
}

export function confirmTransaction(
  id: string,
  payload: ConfirmTransactionPayload,
  signal?: AbortSignal,
): Promise<PendingTransactionDto> {
  return api.post<PendingTransactionDto>(`/api/transactions/${encodeURIComponent(id)}/confirm`, payload, { signal })
}

export function discardTransaction(id: string, signal?: AbortSignal): Promise<void> {
  return api.post<void>(`/api/transactions/${encodeURIComponent(id)}/discard`, undefined, { signal })
}
