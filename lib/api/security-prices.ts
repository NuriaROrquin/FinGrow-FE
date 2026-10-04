import { api } from "./client"
import type { Currency } from "./transactions"

export const quotedCurrencies: Currency[] = ["ARS", "USD"]

export function isQuotedCurrency(currency: Currency): boolean {
  return quotedCurrencies.includes(currency)
}

export interface SecurityPriceDto {
  symbol: string
  currency: Currency
  unitPrice: number
  pricedOn: string
  source: string
}

export function getSecurityPrice(symbol: string, currency: Currency, signal?: AbortSignal): Promise<SecurityPriceDto> {
  return api.get<SecurityPriceDto>(`/api/security-prices/${encodeURIComponent(symbol)}`, { query: { currency }, signal })
}
