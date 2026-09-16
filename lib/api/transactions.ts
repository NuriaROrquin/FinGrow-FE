import { api } from "./client"

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

export type Currency = "ARS" | "USD" | "EUR" | "BRL"

export type PaymentMethod = "Cash" | "CreditCard" | "DebitCard" | "BankTransfer" | "DigitalWallet"

export interface TransactionDto {
  id: string
  type: TransactionType
  amount: number
  currency: Currency
  category: string
  description: string
  occurredOn: string
  paymentMethod: PaymentMethod
  source: string
  status: string
  createdAt: string
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
}

export interface TransactionsResponse {
  items: TransactionDto[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface TransactionSummaryResponse {
  totalExpenseArs: number
  totalExpenseUsd: number
  totalIncomeArs: number
  totalIncomeUsd: number
  totalTransactions: number
  totalExpenseTransactions: number
  totalIncomeTransactions: number
}

export type TransactionHistoryType = "ingreso" | "gasto" | "income" | "expense"

export function getTransactionSummary(signal?: AbortSignal): Promise<TransactionSummaryResponse> {
  return api.get<TransactionSummaryResponse>("/api/transactions/summary", { signal })
}

export function listTransactions(
  pageNumber = 1,
  pageSize = 20,
  search?: string,
  type?: TransactionHistoryType,
  signal?: AbortSignal,
): Promise<TransactionsResponse> {
  return api.get<TransactionsResponse>("/api/transactions", {
    query: { pageNumber, pageSize, search, type },
    signal,
  })
}

export function createTransaction(payload: CreateTransactionPayload, signal?: AbortSignal): Promise<TransactionDto> {
  return api.post<TransactionDto>("/api/transactions", payload, { signal })
}
