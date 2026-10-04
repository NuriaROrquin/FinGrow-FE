import { api } from "./client"
import type { Currency } from "./transactions"

export type InvestmentType =
  | "Stock"
  | "Cedear"
  | "Etf"
  | "Bond"
  | "CorporateBond"
  | "TreasuryBill"
  | "MutualFund"
  | "FixedTermDeposit"
  | "Repo"
  | "RemuneratedAccount"
  | "Crypto"

export const ASSET_NAME_MAX_LENGTH = 120

export const SYMBOL_MAX_LENGTH = 20

export const FUND_NAME_MAX_LENGTH = 150

export type QuoteMarket = "Exchange" | "MutualFund" | "Crypto"

const quoteMarkets: Partial<Record<InvestmentType, QuoteMarket>> = {
  Stock: "Exchange",
  Cedear: "Exchange",
  Etf: "Exchange",
  Bond: "Exchange",
  CorporateBond: "Exchange",
  TreasuryBill: "Exchange",
  MutualFund: "MutualFund",
  Crypto: "Crypto",
}

export function quoteMarketOf(type: InvestmentType): QuoteMarket | null {
  return quoteMarkets[type] ?? null
}

export function isQuoted(type: InvestmentType): boolean {
  return quoteMarketOf(type) !== null
}

export const pricedPerNominalTypes: InvestmentType[] = ["Bond", "CorporateBond", "TreasuryBill"]

export function isPricedPerNominal(type: InvestmentType): boolean {
  return pricedPerNominalTypes.includes(type)
}

export function quantityUnit(type: InvestmentType, quantity: number): string {
  const isOne = quantity === 1

  if (isPricedPerNominal(type)) {
    return isOne ? "nominal" : "nominales"
  }

  if (type === "MutualFund") {
    return isOne ? "cuotaparte" : "cuotapartes"
  }

  if (type === "Crypto") {
    return ""
  }

  return isOne ? "unidad" : "unidades"
}

export function formatQuantity(quantity: number, type: InvestmentType): string {
  const amount = quantity.toLocaleString("es-AR", { maximumFractionDigits: 10 })
  const unit = quantityUnit(type, quantity)

  return unit === "" ? amount : `${amount} ${unit}`
}

export const investmentTypeLabels: Record<InvestmentType, string> = {
  Stock: "Acción",
  Cedear: "CEDEAR",
  Etf: "ETF",
  Bond: "Bono",
  CorporateBond: "Obligación Negociable",
  TreasuryBill: "Letra del Tesoro",
  MutualFund: "Fondo Común",
  FixedTermDeposit: "Plazo Fijo",
  Repo: "Caución",
  RemuneratedAccount: "Cuenta Remunerada",
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
  hasMarketValuation: boolean
  symbol: string | null
  quantity: number | null
  createdAt: string
}

export interface CreateInvestmentPayload {
  assetName: string
  type: InvestmentType
  investedAmount: number
  currency: Currency
  purchasedOn: string
  symbol: string | null
  quantity: number | null
}

export interface CurrencyPortfolioDto {
  currency: Currency
  investmentCount: number
  investedAmount: number
  currentValue: number
  quotedCount: number
  quotedInvestedAmount: number
  quotedReturnAmount: number
  quotedReturnPercentage: number
}

export interface AllocationGroupDto {
  type: InvestmentType
  currency: Currency
  currentValue: number
}

export interface LastPurchaseDto {
  id: string
  assetName: string
  type: InvestmentType
  purchasedOn: string
}

export interface PortfolioSummaryDto {
  investmentCount: number
  unquotedCount: number
  oldestQuotedOn: string | null
  lastPurchase: LastPurchaseDto | null
  currencies: CurrencyPortfolioDto[]
  allocation: AllocationGroupDto[]
}

export function getPortfolioSummary(signal?: AbortSignal): Promise<PortfolioSummaryDto> {
  return api.get<PortfolioSummaryDto>("/api/investments/summary", { signal })
}

export type InvestmentSortField = "PurchasedOn" | "AssetName" | "InvestedAmount" | "CurrentValue" | "ReturnPercentage"

export type SortDirection = "Ascending" | "Descending"

export type InvestmentPerformance = "Gain" | "Loss"

export const investmentSortFieldLabels: Record<InvestmentSortField, string> = {
  PurchasedOn: "Fecha de compra",
  AssetName: "Nombre del activo",
  InvestedAmount: "Capital invertido",
  CurrentValue: "Valor actual",
  ReturnPercentage: "Rendimiento",
}

export interface InvestmentListQuery {
  pageNumber: number
  pageSize: number
  search?: string
  type?: InvestmentType
  currency?: Currency
  purchasedFrom?: string
  purchasedTo?: string
  minInvested?: number
  maxInvested?: number
  quoted?: boolean
  performance?: InvestmentPerformance
  sortBy: InvestmentSortField
  sortDirection: SortDirection
}

export interface PagedResultDto<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export function listInvestments(
  query: InvestmentListQuery,
  signal?: AbortSignal,
): Promise<PagedResultDto<InvestmentDto>> {
  return api.get<PagedResultDto<InvestmentDto>>("/api/investments", {
    query: {
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      search: query.search,
      types: query.type,
      currencies: query.currency,
      purchasedFrom: query.purchasedFrom,
      purchasedTo: query.purchasedTo,
      minInvested: query.minInvested,
      maxInvested: query.maxInvested,
      quoted: query.quoted,
      performance: query.performance,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    },
    signal,
  })
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
