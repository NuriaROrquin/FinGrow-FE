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

/**
 * Igual que en `lib/api/config.ts` de T-04: se lee `process.env.NEXT_PUBLIC_API_URL` de forma
 * literal porque Next solo inlina esa variable cuando aparece escrita tal cual.
 */
function getApiBaseUrl(): string {
  const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL

  if (!rawBaseUrl) {
    throw new Error("Falta la variable NEXT_PUBLIC_API_URL. Copiala en .env.local y completala.")
  }

  return rawBaseUrl.replace(/\/+$/, "")
}

async function throwIfNotOk(response: Response): Promise<void> {
  if (response.ok) {
    return
  }

  const problem = (await response.json().catch(() => null)) as { title?: string; detail?: string } | null
  throw new Error(problem?.detail ?? problem?.title ?? `La API respondio ${response.status}.`)
}

export async function listTransactions(): Promise<TransactionDto[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/transactions`)
  await throwIfNotOk(response)
  return (await response.json()) as TransactionDto[]
}

export async function createTransaction(payload: CreateTransactionPayload): Promise<TransactionDto> {
  const response = await fetch(`${getApiBaseUrl()}/api/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  await throwIfNotOk(response)
  return (await response.json()) as TransactionDto
}
