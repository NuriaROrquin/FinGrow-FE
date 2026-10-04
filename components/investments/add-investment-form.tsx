"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { format, parseISO } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
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

const QUOTE_DEBOUNCE_MS = 400

const FUND_SEARCH_DEBOUNCE_MS = 300

const FUND_SEARCH_MIN_LENGTH = 3

const SYMBOL_PATTERN = /^[A-Z0-9]+$/

const FUND_OPTIONS_ID = "investment-fund-options"

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

const symbolPlaceholders: Partial<Record<InvestmentType, string>> = {
  Stock: "ej. YPFD, GGAL",
  Cedear: "ej. AAPL, MELI",
  Etf: "ej. SPY, QQQ",
  Bond: "ej. AL30, GD30",
  CorporateBond: "ej. YMCXO",
  TreasuryBill: "ej. S30N6",
  MutualFund: "Buscá por nombre, ej. Balanz Money Market",
  Crypto: "ej. BTC, ETH, USDT",
}

const quoteHelp: Record<QuoteMarket, string> = {
  Exchange:
    "Con el símbolo y la cantidad te mostramos el precio de BYMA y calculamos el capital; después la cotizamos todos los días hábiles con el cierre. Usá la variante de la moneda de la inversión: AL30 en pesos, AL30D en dólares.",
  MutualFund:
    "Elegí el fondo de la lista y cargá tus cuotapartes: te mostramos el valor de la cuotaparte que publica ArgentinaDatos y calculamos el capital; después lo cotizamos todos los días hábiles.",
  Crypto:
    "Con el símbolo y la cantidad te mostramos el precio de CoinGecko y calculamos el capital; después la cotizamos todos los días hábiles.",
}

function todayForDateInput(): string {
  return format(new Date(), "yyyy-MM-dd")
}

function quantityLabel(type: InvestmentType | ""): string {
  if (type !== "" && isPricedPerNominal(type)) {
    return "Cantidad de nominales"
  }

  if (type === "MutualFund") {
    return "Cantidad de cuotapartes"
  }

  return type === "Crypto" ? "Cantidad" : "Cantidad de unidades"
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

function formatMoney(amount: number, currency: Currency): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency }).format(amount)
}

function formatUnitPrice(amount: number, currency: Currency): string {
  const digits = amount >= 1 ? { minimumFractionDigits: 2, maximumFractionDigits: 6 } : { maximumSignificantDigits: 6 }

  return new Intl.NumberFormat("es-AR", { style: "currency", currency, ...digits }).format(amount)
}

function pricedOnLabel(price: SecurityPriceDto): string {
  return price.pricedOn === todayForDateInput()
    ? `${price.source}, hoy`
    : `${price.source}, al ${format(parseISO(price.pricedOn), "dd/MM")}`
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
  const [investedAmount, setInvestedAmount] = useState(initialInvestment ? String(initialInvestment.investedAmount) : "")
  const [investedAmountTouched, setInvestedAmountTouched] = useState(isEditing)
  const [currency, setCurrency] = useState<Currency>(initialInvestment?.currency ?? "ARS")
  const [purchasedOn, setPurchasedOn] = useState(initialInvestment?.purchasedOn ?? "")
  const [symbol, setSymbol] = useState(initialInvestment?.symbol ?? "")
  const [quantity, setQuantity] = useState(initialInvestment?.quantity != null ? String(initialInvestment.quantity) : "")
  const [quote, setQuote] = useState<{ key: string; result: QuoteResult } | null>(null)
  const [fundSearch, setFundSearch] = useState<{ key: string; options: SecurityPriceDto[] | null } | null>(null)
  const [trackingError, setTrackingError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const market = type === "" ? null : quoteMarketOf(type)
  const canBeQuoted = market !== null
  const isFund = market === "MutualFund"
  const normalizedSymbol = normalizeSymbol(symbol, market)
  const hasValidSymbol = isFund
    ? normalizedSymbol.length >= FUND_SEARCH_MIN_LENGTH && normalizedSymbol.length <= FUND_NAME_MAX_LENGTH
    : normalizedSymbol.length <= SYMBOL_MAX_LENGTH && SYMBOL_PATTERN.test(normalizedSymbol)
  const currencyIsQuotable = market !== null && canQuoteIn(market, currency)
  const quoteKey =
    canBeQuoted && !isFund && hasValidSymbol && currencyIsQuotable ? `${market}:${normalizedSymbol}:${currency}` : null
  const fundSearchKey = isFund && hasValidSymbol ? normalizedSymbol.toLowerCase() : null

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
    if (fundSearchKey === null || type === "") {
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      searchSecurityPrices(type, normalizedSymbol, undefined, controller.signal)
        .then((options) => setFundSearch({ key: fundSearchKey, options }))
        .catch((error: unknown) => {
          if (isAbort(error)) return
          setFundSearch({ key: fundSearchKey, options: null })
        })
    }, FUND_SEARCH_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [fundSearchKey, normalizedSymbol, type])

  const fundOptions = isFund ? (fundSearch?.options ?? []) : []
  const matchedFund = fundOptions.find((option) => option.symbol.toLowerCase() === normalizedSymbol.toLowerCase())
  const currentFundSearch = fundSearchKey !== null && fundSearch?.key === fundSearchKey ? fundSearch : null

  const fundQuoteResult = (): QuoteResult | null => {
    if (fundSearchKey === null) {
      return null
    }

    if (matchedFund) {
      return { status: "found", price: matchedFund }
    }

    if (currentFundSearch === null) {
      return { status: "loading" }
    }

    if (currentFundSearch.options === null) {
      return { status: "unavailable" }
    }

    return { status: currentFundSearch.options.length === 0 ? "missing" : "choose" }
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
  const fundCurrencyDiffers = isFund && quotedPrice !== null && quotedPrice.currency !== currency

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
          ? "Para cotizar la inversión completá el fondo y la cantidad de cuotapartes, o dejá los dos vacíos."
          : "Para cotizar la inversión completá el símbolo y la cantidad, o dejá los dos vacíos.",
      )
      return
    }

    setTrackingError(null)
    setIsSubmitting(true)
    try {
      await onSubmit({
        assetName: assetName.trim(),
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
      <div className="space-y-2">
        <Label htmlFor="investment-type">Tipo de activo</Label>
        <Select value={type} onValueChange={(value) => setType(value as InvestmentType)} required>
          <SelectTrigger id="investment-type">
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
        <Label htmlFor="investment-asset">Nombre del activo</Label>
        <Input
          id="investment-asset"
          placeholder="ej. AL30, Apple, Bitcoin"
          maxLength={ASSET_NAME_MAX_LENGTH}
          value={assetName}
          onChange={(e) => setAssetName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="investment-amount">Capital invertido</Label>
            <Input
              id="investment-amount"
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0.01"
              value={effectiveInvestedAmount}
              onChange={(e) => handleInvestedAmountChange(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="investment-currency">Moneda</Label>
            <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
              <SelectTrigger id="investment-currency">
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
        {isAmountCalculated && quotedPrice && (
          <p className="text-xs text-muted-foreground">
            Calculado con la cotización de {quotedPrice.symbol}. Si pagaste otro precio, escribí lo que pagaste.
          </p>
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

      {canBeQuoted && (
        <div className="space-y-3 rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">Cotización automática (opcional)</p>
            <p className="text-xs text-muted-foreground">{quoteHelp[market]}</p>
          </div>
          <div className={isFund ? "grid grid-cols-1 gap-3" : "grid grid-cols-2 gap-2"}>
            <div className="space-y-2">
              <Label htmlFor="investment-symbol">{isFund ? "Fondo" : "Símbolo"}</Label>
              {isFund ? (
                <>
                  <Input
                    id="investment-symbol"
                    placeholder={symbolPlaceholders.MutualFund}
                    maxLength={FUND_NAME_MAX_LENGTH}
                    list={FUND_OPTIONS_ID}
                    autoComplete="off"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                  />
                  <datalist id={FUND_OPTIONS_ID}>
                    {fundOptions.map((option) => (
                      <option key={option.symbol} value={option.symbol} />
                    ))}
                  </datalist>
                </>
              ) : (
                <Input
                  id="investment-symbol"
                  placeholder={(type === "" ? undefined : symbolPlaceholders[type]) ?? "ej. AL30, YPFD, SPY"}
                  maxLength={SYMBOL_MAX_LENGTH}
                  pattern="[A-Za-z0-9]+"
                  title="Solo letras y números"
                  autoComplete="off"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="investment-quantity">{quantityLabel(type)}</Label>
              <Input
                id="investment-quantity"
                type="number"
                placeholder="0"
                step="any"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </div>

          {!isFund && hasValidSymbol && !currencyIsQuotable && (
            <p className="text-sm text-muted-foreground">
              {market === "Crypto"
                ? "Las criptomonedas se cotizan en pesos o en dólares: elegí ARS o USD para ver el precio."
                : "BYMA cotiza en pesos y en dólares: elegí ARS o USD para ver el precio."}
            </p>
          )}

          {quoteResult?.status === "loading" && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
              <Spinner />
              {isFund ? "Buscando fondos…" : `Buscando la cotización de ${normalizedSymbol}…`}
            </p>
          )}

          {quotedPrice && (
            <div className="space-y-1 rounded-md bg-muted/50 px-3 py-2 text-sm" aria-live="polite">
              <p>
                <span className="font-medium">{quotedPrice.symbol}</span>
                {quotedPrice.name && <span className="text-muted-foreground"> ({quotedPrice.name})</span>}{" "}
                {formatUnitPrice(quotedPrice.unitPrice, isFund ? currency : quotedPrice.currency)} {pricePerLabel(type)}
                <span className="text-muted-foreground"> · {pricedOnLabel(quotedPrice)}</span>
              </p>
              {marketValue !== null && (
                <p>
                  A este precio, {type !== "" && formatQuantity(parsedQuantity, type)}
                  {type === "Crypto" ? ` ${quotedPrice.symbol}` : ""} {parsedQuantity === 1 ? "vale" : "valen"}{" "}
                  <span className="font-semibold">{formatMoney(marketValue, currency)}</span>
                  {canUseMarketValue && (
                    <>
                      {" · "}
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-sm"
                        onClick={applyMarketValue}
                      >
                        Usar como capital invertido
                      </Button>
                    </>
                  )}
                </p>
              )}
              {fundCurrencyDiffers && (
                <p className="text-amber-700 dark:text-amber-300">
                  Por el nombre, este fondo parece estar en {currencyNames[quotedPrice.currency]}: revisá la moneda de la
                  inversión.
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
                ? "No encontramos fondos con ese nombre en ArgentinaDatos. Probá con otra parte del nombre."
                : market === "Crypto"
                  ? `No encontramos ${normalizedSymbol} en CoinGecko. Revisá el símbolo: BTC, ETH, USDT.`
                  : `No encontramos ${normalizedSymbol} en ${currencyNames[currency]} en BYMA. Revisá el símbolo o usá la variante de la moneda: AL30 en pesos, AL30D en dólares.`}
            </p>
          )}

          {quoteResult?.status === "unavailable" && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              No pudimos traer la cotización ahora. Podés guardar igual: la cotizamos con el cierre del día.
            </p>
          )}

          {trackingError && <p className="text-sm text-destructive">{trackingError}</p>}
        </div>
      )}

      <div className="flex gap-2 justify-end pt-4">
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
