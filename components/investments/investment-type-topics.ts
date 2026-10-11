import type { InvestmentType } from "@/lib/api"

export const investmentTypeTopics: Record<InvestmentType, string> = {
  Stock: "acciones",
  Cedear: "CEDEARs",
  Etf: "ETFs",
  Bond: "bonos",
  CorporateBond: "obligaciones negociables",
  TreasuryBill: "letras del Tesoro",
  MutualFund: "fondos comunes de inversión",
  FixedTermDeposit: "plazos fijos",
  Repo: "cauciones",
  RemuneratedAccount: "cuentas remuneradas",
  Crypto: "criptomonedas",
}
