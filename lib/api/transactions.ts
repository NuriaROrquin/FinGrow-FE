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

export function listTransactions(signal?: AbortSignal): Promise<TransactionDto[]> {
  return api.get<TransactionDto[]>("/api/transactions", { signal })
}

export function createTransaction(payload: CreateTransactionPayload, signal?: AbortSignal): Promise<TransactionDto> {
  return api.post<TransactionDto>("/api/transactions", payload, { signal })
}
