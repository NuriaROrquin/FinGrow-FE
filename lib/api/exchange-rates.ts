import { api } from "./client"
import type { Currency } from "./transactions"

export interface MepQuoteDto {
  baseCurrency: Currency
  quoteCurrency: Currency
  buy: number
  sell: number
  updatedAt: string
  source: string
}

export function getMepQuote(signal?: AbortSignal): Promise<MepQuoteDto> {
  return api.get<MepQuoteDto>("/api/exchange-rates/mep", { signal })
}
