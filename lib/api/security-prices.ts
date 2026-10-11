import { api } from "./client"
import type { InvestmentType, QuoteMarket } from "./investments"
import type { Currency } from "./transactions"

const tickerCurrencies: Currency[] = ["ARS", "USD"]

export function canQuoteIn(market: QuoteMarket, currency: Currency): boolean {
  return market === "MutualFund" || tickerCurrencies.includes(currency)
}

export interface SecurityPriceDto {
  symbol: string
  name: string | null
  currency: Currency
  unitPrice: number
  pricedOn: string
  source: string
}

export function getSecurityPrice(
  symbol: string,
  currency: Currency,
  type: InvestmentType,
  signal?: AbortSignal,
): Promise<SecurityPriceDto> {
  return api.get<SecurityPriceDto>("/api/security-prices", { query: { symbol, currency, type }, signal })
}

export function searchSecurityPrices(
  type: InvestmentType,
  query: string,
  currency?: Currency,
  signal?: AbortSignal,
): Promise<SecurityPriceDto[]> {
  return api.get<SecurityPriceDto[]>("/api/security-prices/search", { query: { type, query, currency }, signal })
}
