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

export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  Alimentos: "Alimentos",
  Transporte: "Transporte",
  Vivienda: "Vivienda",
  Servicios: "Servicios",
  Salud: "Salud",
  Educacion: "Educación",
  Entretenimiento: "Entretenimiento",
  Indumentaria: "Indumentaria",
  AhorroInversion: "Ahorro e Inversión",
  Otros: "Otros",
}

export const incomeCategoryLabels: Record<IncomeCategory, string> = {
  Salario: "Salario",
  Freelance: "Freelance",
  Inversiones: "Inversiones",
  Regalo: "Regalo",
  Otros: "Otros",
}

export type TransactionStatus = "Confirmed" | "Pending"

export const transactionStatusLabels: Record<TransactionStatus, string> = {
  Confirmed: "Confirmada",
  Pending: "Pendiente",
}

export type Currency = "ARS" | "USD" | "EUR" | "BRL"

export type PaymentMethod = "Cash" | "CreditCard" | "DebitCard" | "BankTransfer" | "DigitalWallet"
export type PaymentMethodLabel =
  | "Efectivo"
  | "Tarjeta de Crédito"
  | "Tarjeta de Débito"
  | "Transferencia Bancaria"
  | "Billetera Digital"

export const paymentMethodLabels: Record<PaymentMethod, PaymentMethodLabel> = {
  Cash: "Efectivo",
  CreditCard: "Tarjeta de Crédito",
  DebitCard: "Tarjeta de Débito",
  BankTransfer: "Transferencia Bancaria",
  DigitalWallet: "Billetera Digital",
}

export interface TransactionDto {
  id: string
  type: TransactionType
  amount: number
  currency: Currency
  category: string
  description: string
  occurredOn: string
  paymentMethod: PaymentMethodLabel
  source: string
  status: TransactionStatus
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

export interface TransactionFilters {
  search?: string
  type?: TransactionType
  expenseCategory?: ExpenseCategory
  incomeCategory?: IncomeCategory
  status?: TransactionStatus
  paymentMethod?: PaymentMethod
  /** Fecha desde, formato yyyy-MM-dd (inclusive). */
  dateFrom?: string
  /** Fecha hasta, formato yyyy-MM-dd (inclusive). */
  dateTo?: string
}

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

function translateTransaction(transaction: Omit<TransactionDto, "paymentMethod"> & { paymentMethod: PaymentMethod }) {
  return {
    ...transaction,
    paymentMethod: paymentMethodLabels[transaction.paymentMethod] ?? transaction.paymentMethod,
  }
}

export function listTransactions(
  pageNumber = 1,
  pageSize = 10,
  filters: TransactionFilters = {},
  signal?: AbortSignal,
): Promise<TransactionsResponse> {
  return api.get<{ items: (Omit<TransactionDto, "paymentMethod"> & { paymentMethod: PaymentMethod })[]; pageNumber: number; pageSize: number; totalCount: number; totalPages: number }>("/api/transactions", {
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
    },
    signal,
  }).then((response) => ({
    ...response,
    items: response.items.map(translateTransaction),
  }))
}

export function createTransaction(payload: CreateTransactionPayload, signal?: AbortSignal): Promise<TransactionDto> {
  return api
    .post<Omit<TransactionDto, "paymentMethod"> & { paymentMethod: PaymentMethod }>("/api/transactions", payload, { signal })
    .then(translateTransaction)
}
