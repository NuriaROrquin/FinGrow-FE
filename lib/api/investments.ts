import { api } from "./client"
import type { Currency } from "./transactions"

export type InvestmentType = "Etf" | "Stock" | "Bond" | "MutualFund" | "Crypto"

export const ASSET_NAME_MAX_LENGTH = 120

export const investmentTypeLabels: Record<InvestmentType, string> = {
  Etf: "ETF",
  Stock: "Acción",
  Bond: "Bono",
  MutualFund: "Fondo Común",
  Crypto: "Criptomoneda",
}

export interface InvestmentDto {
  id: string
  assetName: string
  type: InvestmentType
  investedAmount: number
  currentValue: number
  currency: Currency
  returnAmount: number
  returnPercentage: number
  purchasedOn: string
  valuedOn: string
  createdAt: string
}

export interface CreateInvestmentPayload {
  assetName: string
  type: InvestmentType
  investedAmount: number
  currency: Currency
  purchasedOn: string
}

export function listInvestments(signal?: AbortSignal): Promise<InvestmentDto[]> {
  return api.get<InvestmentDto[]>("/api/investments", { signal })
}

export function createInvestment(payload: CreateInvestmentPayload, signal?: AbortSignal): Promise<InvestmentDto> {
  return api.post<InvestmentDto>("/api/investments", payload, { signal })
}

export function updateInvestment(
  id: string,
  payload: CreateInvestmentPayload,
  signal?: AbortSignal,
): Promise<InvestmentDto> {
  return api.put<InvestmentDto>(`/api/investments/${encodeURIComponent(id)}`, payload, { signal })
}

export function deleteInvestment(id: string, signal?: AbortSignal): Promise<void> {
  return api.delete(`/api/investments/${encodeURIComponent(id)}`, { signal })
}
