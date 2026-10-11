"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { SecurityCombobox, type SecurityOption } from "@/components/investments/security-combobox"
import {
  ASSET_NAME_MAX_LENGTH,
  FUND_NAME_MAX_LENGTH,
  SYMBOL_MAX_LENGTH,
  canQuoteIn,
  formatQuantity,
  getSecurityPrice,
  investmentTypeLabels,
  isApiError,
  isPricedPerNominal,
  quoteMarketOf,
  searchSecurityPrices,
  toastApiError,
  type CreateInvestmentPayload,
  type InvestmentDto,
  type InvestmentType,
  type QuoteMarket,
  type SecurityPriceDto,
} from "@/lib/api"
import type { Currency } from "@/lib/api/transactions"
import { formatDateText, formatMoney } from "@/lib/format"

const QUOTE_DEBOUNCE_MS = 400

const SEARCH_DEBOUNCE_MS = 250

const TICKER_SEARCH_MIN_LENGTH = 2

const FUND_SEARCH_MIN_LENGTH = 3

const SYMBOL_PATTERN = /^[A-Z0-9]+$/

const currencyLabels: Record<Currency, string> = {
  ARS: "ARS ($)",
  USD: "USD ($)",
  EUR: "EUR (€)",
  BRL: "BRL (R$)",
}

const currencyNames: Record<Currency, string> = {
  ARS: "pesos",
  USD: "dólares",
  EUR: "euros",
  BRL: "reales",
}

type QuoteResult =
  | { status: "loading" }
  | { status: "found"; price: SecurityPriceDto }
  | { status: "choose" }
  | { status: "missing" }
  | { status: "unavailable" }

interface SearchState {
  scope: string
  key: string
  options: SecurityPriceDto[] | null
}

const symbolPlaceholders: Partial<Record<InvestmentType, string>> = {
  Stock: "ej. YPFD, GGAL",
  Cedear: "ej. AAPL, MELI",
  Etf: "ej. SPY, QQQ",
  Bond: "ej. AL30, GD30",
  CorporateBond: "ej. YMCXO",
  TreasuryBill: "ej. S30N6",
  MutualFund: "ej. Balanz Money Market",
  Crypto: "ej. BTC, Ethereum",
}

const quoteHelp: Record<QuoteMarket, string> = {
  Exchange: "Buscá el símbolo de BYMA en la moneda de la inversión: AL30 en pesos, AL30D en dólares.",
  MutualFund: "Buscá el fondo por nombre y cargá tus cuotapartes.",
  Crypto: "Buscá la cripto por símbolo o por nombre.",
}

function todayForDateInput(): string {
  return format(new Date(), "yyyy-MM-dd")
}

function quantityLabel(type: InvestmentType | "", symbol: string): string {
  if (type !== "" && isPricedPerNominal(type)) {
    return "Nominales"
  }

  if (type === "MutualFund") {
    return "Cuotapartes"
  }

  if (type === "Crypto") {
    return symbol === "" ? "Cantidad" : `Cantidad de ${symbol}`
  }

  return "Unidades"
}

function pricePerLabel(type: InvestmentType | ""): string {
  if (type !== "" && isPricedPerNominal(type)) {
    return "por nominal"
  }

  return type === "MutualFund" ? "por cuotaparte" : "por unidad"
}

function normalizeSymbol(symbol: string, market: QuoteMarket | null): string {
  return market === "MutualFund" ? symbol.trim().replace(/\s+/g, " ") : symbol.trim().toUpperCase()
}


function formatUnitPrice(amount: number, currency: Currency): string {
  const digits = amount >= 1 ? { minimumFractionDigits: 2, maximumFractionDigits: 6 } : { maximumSignificantDigits: 6 }

  return formatMoney(amount, currency, digits)
}

function pricedOnLabel(price: SecurityPriceDto): string {
  return price.pricedOn === todayForDateInput()
    ? `${price.source}, hoy`
    : `${price.source}, al ${formatDateText(price.pricedOn, { day: "2-digit", month: "2-digit" })}`
}

function quotedOnText(price: SecurityPriceDto): string {
  return price.pricedOn === todayForDateInput() ? "de hoy" : `del ${formatDateText(price.pricedOn, { day: "2-digit", month: "2-digit" })}`
}

function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
}

export function AddInvestmentForm({
  initialInvestment,
  onSubmit,
  onClose,
}: {
  initialInvestment?: InvestmentDto | null
  onSubmit: (payload: CreateInvestmentPayload) => Promise<void>
  onClose: () => void
}) {
  const isEditing = Boolean(initialInvestment)
  const [type, setType] = useState<InvestmentType | "">(initialInvestment?.type ?? "")
  const [assetName, setAssetName] = useState(initialInvestment?.assetName ?? "")
  const [assetNameTouched, setAssetNameTouched] = useState(isEditing)
  const [investedAmount, setInvestedAmount] = useState(initialInvestment ? String(initialInvestment.investedAmount) : "")
  const [investedAmountTouched, setInvestedAmountTouched] = useState(isEditing)
  const [currency, setCurrency] = useState<Currency>(initialInvestment?.currency ?? "ARS")
  const [purchasedOn, setPurchasedOn] = useState(initialInvestment?.purchasedOn ?? todayForDateInput())
  const [symbol, setSymbol] = useState(initialInvestment?.symbol ?? "")
  const [quantity, setQuantity] = useState(initialInvestment?.quantity != null ? String(initialInvestment.quantity) : "")
  const [quote, setQuote] = useState<{ key: string; result: QuoteResult } | null>(null)
  const [search, setSearch] = useState<SearchState | null>(null)
  const [trackingError, setTrackingError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const market = type === "" ? null : quoteMarketOf(type)
  const canBeQuoted = market !== null
  const isFund = market === "MutualFund"
  const normalizedSymbol = normalizeSymbol(symbol, market)
  const isValidTicker = normalizedSymbol.length <= SYMBOL_MAX_LENGTH && SYMBOL_PATTERN.test(normalizedSymbol)
  const currencyIsQuotable = market !== null && canQuoteIn(market, currency)

  const quoteKeyFor = (tickerSymbol: string) => `${market}:${tickerSymbol}:${currency}`
  const quoteKey = canBeQuoted && !isFund && isValidTicker && currencyIsQuotable ? quoteKeyFor(normalizedSymbol) : null

  const searchScope = canBeQuoted && currencyIsQuotable ? `${market}:${isFund ? "" : currency}` : null
  const searchMinLength = isFund ? FUND_SEARCH_MIN_LENGTH : TICKER_SEARCH_MIN_LENGTH
  const searchKey =
    searchScope !== null && normalizedSymbol.length >= searchMinLength && (isFund || isValidTicker)
      ? `${searchScope}:${normalizedSymbol.toLowerCase()}`
      : null

  useEffect(() => {
    if (quoteKey === null || type === "") {
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      getSecurityPrice(normalizedSymbol, currency, type, controller.signal)
        .then((price) => setQuote({ key: quoteKey, result: { status: "found", price } }))
        .catch((error: unknown) => {
          if (isAbort(error)) return
          const status = isApiError(error) && error.status === 404 ? "missing" : "unavailable"
          setQuote({ key: quoteKey, result: { status } })
        })
    }, QUOTE_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [quoteKey, normalizedSymbol, currency, type])

  useEffect(() => {
    if (searchKey === null || searchScope === null || type === "") {
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      searchSecurityPrices(type, normalizedSymbol, isFund ? undefined : currency, controller.signal)
        .then((options) => setSearch({ scope: searchScope, key: searchKey, options }))
        .catch((error: unknown) => {
          if (isAbort(error)) return
          setSearch({ scope: searchScope, key: searchKey, options: null })
        })
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [searchKey, searchScope, normalizedSymbol, currency, isFund, type])

  const searchOptions = search !== null && search.scope === searchScope ? (search.options ?? []) : []
  const currentSearch = searchKey !== null && search?.key === searchKey ? search : null
  const isSearching = searchKey !== null && currentSearch === null
  const matchedFund = isFund
    ? searchOptions.find((option) => option.symbol.toLowerCase() === normalizedSymbol.toLowerCase())
    : undefined

  const fundQuoteResult = (): QuoteResult | null => {
    if (searchKey === null) {
      return null
    }

    if (matchedFund) {
      return { status: "found", price: matchedFund }
    }

    if (currentSearch === null) {
      return { status: "loading" }
    }

    if (currentSearch.options === null) {
      return { status: "unavailable" }
    }

    return { status: currentSearch.options.length === 0 ? "missing" : "choose" }
  }

  const quoteResult: QuoteResult | null = isFund
    ? fundQuoteResult()
    : quoteKey === null
      ? null
      : quote?.key === quoteKey
        ? quote.result
        : { status: "loading" }
  const quotedPrice = quoteResult?.status === "found" ? quoteResult.price : null
  const parsedQuantity = Number(quantity)
  const hasQuantity = quantity.trim() !== "" && Number.isFinite(parsedQuantity) && parsedQuantity > 0
  const marketValue = quotedPrice !== null && hasQuantity ? roundToCents(quotedPrice.unitPrice * parsedQuantity) : null
  const isAmountCalculated = marketValue !== null && !investedAmountTouched
  const effectiveInvestedAmount = isAmountCalculated ? marketValue.toFixed(2) : investedAmount
  const canUseMarketValue = marketValue !== null && investedAmountTouched && Number(investedAmount) !== marketValue
  const suggestedAssetName = quotedPrice ? (quotedPrice.name ?? quotedPrice.symbol).slice(0, ASSET_NAME_MAX_LENGTH) : null
  const effectiveAssetName = !assetNameTouched && suggestedAssetName !== null ? suggestedAssetName : assetName
  const fundCurrencyDiffers = isFund && quotedPrice !== null && quotedPrice.currency !== currency
  const priceCurrency = quotedPrice === null || isFund ? currency : quotedPrice.currency
  const quantityText =
    type === ""
      ? ""
      : type === "Crypto"
        ? `${formatQuantity(parsedQuantity, type)} ${normalizedSymbol}`
        : formatQuantity(parsedQuantity, type)

  const comboboxOptions: SecurityOption[] = searchOptions.map((option) => ({
    value: option.symbol,
    label: option.symbol,
    detail: option.name,
    trailing: formatUnitPrice(option.unitPrice, option.currency),
  }))

  const handleSymbolSelect = (option: SecurityOption) => {
    const selected = searchOptions.find((candidate) => candidate.symbol === option.value)
    setSymbol(option.value)

    if (selected && !isFund) {
      setQuote({ key: quoteKeyFor(normalizeSymbol(option.value, market)), result: { status: "found", price: selected } })
    }
  }

  const handleTypeChange = (value: InvestmentType) => {
    if (quoteMarketOf(value) !== market) {
      setSymbol("")
      setQuantity("")
    }

    setType(value)
  }

  const handleAssetNameChange = (value: string) => {
    setAssetName(value)
    setAssetNameTouched(value !== "")
  }

  const handleInvestedAmountChange = (value: string) => {
    setInvestedAmount(value)
    setInvestedAmountTouched(value !== "")
  }

  const applyMarketValue = () => {
    if (marketValue === null) {
      return
    }

    setInvestedAmount(marketValue.toFixed(2))
    setInvestedAmountTouched(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!type) {
      return
    }

    const trimmedSymbol = canBeQuoted ? normalizedSymbol : ""
    const trimmedQuantity = canBeQuoted ? quantity.trim() : ""

    if ((trimmedSymbol === "") !== (trimmedQuantity === "")) {
      setTrackingError(
        isFund
          ? "Para cotizar la inversión completá el fondo y las cuotapartes, o dejá los dos vacíos."
          : "Para cotizar la inversión completá el símbolo y la cantidad, o dejá los dos vacíos.",
      )
      return
    }

    setTrackingError(null)
    setIsSubmitting(true)
    try {
      await onSubmit({
        assetName: effectiveAssetName.trim(),
        type,
        investedAmount: Number(effectiveInvestedAmount),
        currency,
        purchasedOn,
        symbol: trimmedSymbol || null,
        quantity: trimmedQuantity ? Number(trimmedQuantity) : null,
      })
      onClose()
    } catch (error) {
      toastApiError(error, isEditing ? "No se pudo actualizar la inversión." : "No se pudo registrar la inversión.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="investment-type">Tipo de activo</Label>
          <Select value={type} onValueChange={(value) => handleTypeChange(value as InvestmentType)} required>
            <SelectTrigger id="investment-type" className="w-full">
              <SelectValue placeholder="Seleccioná el tipo" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(investmentTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="investment-currency">Moneda</Label>
          <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
            <SelectTrigger id="investment-currency" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(currencyLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {canBeQuoted && (
        <section aria-labelledby="investment-quote-title" className="space-y-3 rounded-md border p-3">
          <div>
            <p id="investment-quote-title" className="text-sm font-medium">
              Cotización automática
            </p>
            <p className="text-xs text-muted-foreground">{quoteHelp[market]}</p>
          </div>

          <div className={isFund ? "grid grid-cols-1 gap-3" : "grid grid-cols-5 gap-2"}>
            <div className={isFund ? "space-y-2" : "col-span-3 space-y-2"}>
              <Label htmlFor="investment-symbol">{isFund ? "Fondo" : "Símbolo"}</Label>
              <SecurityCombobox
                id="investment-symbol"
                value={symbol}
                options={comboboxOptions}
                isSearching={isSearching}
                placeholder={(type === "" ? undefined : symbolPlaceholders[type]) ?? "ej. AL30, YPFD, SPY"}
                maxLength={isFund ? FUND_NAME_MAX_LENGTH : SYMBOL_MAX_LENGTH}
                onValueChange={(value) => setSymbol(isFund ? value : value.toUpperCase())}
                onSelect={handleSymbolSelect}
              />
            </div>
            <div className={isFund ? "space-y-2" : "col-span-2 space-y-2"}>
              <Label htmlFor="investment-quantity">{quantityLabel(type, isValidTicker ? normalizedSymbol : "")}</Label>
              <Input
                id="investment-quantity"
                type="number"
                inputMode="decimal"
                placeholder="0"
                step="any"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </div>

          {!isFund && normalizedSymbol !== "" && !currencyIsQuotable && (
            <p className="text-sm text-muted-foreground">
              {market === "Crypto"
                ? "Las criptomonedas se cotizan en pesos o en dólares: elegí ARS o USD para ver el precio."
                : "BYMA cotiza en pesos y en dólares: elegí ARS o USD para ver el precio."}
            </p>
          )}

          {!isFund && quoteResult?.status === "loading" && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
              <Spinner />
              Buscando la cotización de {normalizedSymbol}…
            </p>
          )}

          {quotedPrice && (
            <div className="space-y-1 rounded-md bg-muted/50 p-3" aria-live="polite">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <p className="min-w-0 truncate" title={quotedPrice.name ?? quotedPrice.symbol}>
                  <span className="font-medium">{quotedPrice.symbol}</span>
                  {quotedPrice.name && <span className="text-muted-foreground"> · {quotedPrice.name}</span>}
                </p>
                <p className="shrink-0 text-xs text-muted-foreground">{pricedOnLabel(quotedPrice)}</p>
              </div>
              {marketValue !== null ? (
                <>
                  <p className="text-2xl font-semibold tabular-nums">{formatMoney(marketValue, currency)}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {quantityText} × {formatUnitPrice(quotedPrice.unitPrice, priceCurrency)} {pricePerLabel(type)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-semibold tabular-nums">
                    {formatUnitPrice(quotedPrice.unitPrice, priceCurrency)}{" "}
                    <span className="text-sm font-normal text-muted-foreground">{pricePerLabel(type)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cargá {isFund ? "tus cuotapartes" : "la cantidad"} para ver cuánto vale tu inversión.
                  </p>
                </>
              )}
              {fundCurrencyDiffers && (
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Por el nombre, este fondo parece estar en {currencyNames[quotedPrice.currency]}: revisá la moneda.
                </p>
              )}
            </div>
          )}

          {quoteResult?.status === "choose" && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              Elegí uno de los fondos de la lista para ver el valor de la cuotaparte.
            </p>
          )}

          {quoteResult?.status === "missing" && (
            <p className="text-sm text-amber-700 dark:text-amber-300" aria-live="polite">
              {isFund
                ? "No encontramos fondos con ese nombre. Probá con otra parte del nombre."
                : market === "Crypto"
                  ? `No encontramos ${normalizedSymbol} en CoinGecko. Probá con el nombre, por ejemplo Bitcoin.`
                  : `No encontramos ${normalizedSymbol} en ${currencyNames[currency]} en BYMA. Si es en dólares, probá con la variante D (AL30D).`}
            </p>
          )}

          {quoteResult?.status === "unavailable" && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              No pudimos traer la cotización ahora. Podés guardar igual: la cotizamos con el cierre del día.
            </p>
          )}

          {trackingError && <p className="text-sm text-destructive">{trackingError}</p>}
        </section>
      )}

      <div className="space-y-2">
        <Label htmlFor="investment-asset">Nombre del activo</Label>
        <Input
          id="investment-asset"
          placeholder="ej. AL30, Apple, Bitcoin"
          maxLength={ASSET_NAME_MAX_LENGTH}
          value={effectiveAssetName}
          onChange={(e) => handleAssetNameChange(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="investment-amount">Capital invertido</Label>
        <Input
          id="investment-amount"
          type="number"
          inputMode="decimal"
          placeholder="0.00"
          step="0.01"
          min="0.01"
          value={effectiveInvestedAmount}
          onChange={(e) => handleInvestedAmountChange(e.target.value)}
          required
        />
        {isAmountCalculated && quotedPrice && (
          <p className="text-xs text-muted-foreground">
            Calculado con la cotización {quotedOnText(quotedPrice)}. Si pagaste otro precio, escribí lo que pagaste.
          </p>
        )}
        {canUseMarketValue && quotedPrice && (
          <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={applyMarketValue}>
            Usar el valor a la cotización {quotedOnText(quotedPrice)} ({formatMoney(marketValue, currency)})
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="investment-date">Fecha de compra</Label>
        <Input
          id="investment-date"
          type="date"
          max={todayForDateInput()}
          value={purchasedOn}
          onChange={(e) => setPurchasedOn(e.target.value)}
          required
        />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : isEditing ? "Guardar cambios" : "Agregar Inversión"}
        </Button>
      </div>
    </form>
  )
}
