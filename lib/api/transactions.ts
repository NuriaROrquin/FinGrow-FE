import { api } from "./client"

export interface Transaction {
  id: string
  amount: number
  currency: string
  category: string
  date: string
  description: string
}

export function getTransactions() {
  return api.get<Transaction[]>("/api/transactions")
}
