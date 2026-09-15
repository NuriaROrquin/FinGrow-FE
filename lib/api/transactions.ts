import { apiFetch } from "@/lib/api/client"

export interface Transaction {
  id: string
  amount: number
  currency: string
  category: string
  date: string
  description: string
}

export function getTransactions(onUnauthorized?: () => void) {
  return apiFetch<Transaction[]>("/api/transactions", {
    method: "GET",
    onUnauthorized,
  })
}
