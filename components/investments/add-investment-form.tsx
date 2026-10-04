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
  SYMBOL_MAX_LENGTH,
  getSecurityPrice,
  investmentTypeLabels,
  isApiError,
  isPricedPerNominal,
  isQuotedCurrency,
  isQuotedOnExchange,
  toastApiError,
  type CreateInvestmentPayload,
  type InvestmentDto,
  type InvestmentType,
  type SecurityPriceDto,
} from "@/lib/api"
import type { Currency } from "@/lib/api/transactions"

const QUOTE_DEBOUNCE_MS = 400

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
  | { status: "missing" }
  | { status: "unavailable" }

function todayForDateInput(): string {
  return format(new Date(), "yyyy-MM-dd")
}

const symbolPlaceholders: Partial<Record<InvestmentType, string>> = {
  Stock: "ej. YPFD, GGAL",
  Cedear: "ej. AAPL, MELI",
  Etf: "ej. SPY, QQQ",
  Bond: "ej. AL30, GD30",
  CorporateBond: "ej. YMCXO",
  TreasuryBill: "ej. S30N6",
}

function isPerNominal(type: InvestmentType | ""): boolean {
  return type !== "" && isPricedPerNominal(type)
}

function quantityLabel(type: InvestmentType | ""): string {
  return isPerNominal(type) ? "Cantidad de nominales" : "Cantidad de unidades"
}

function formatMoney(amount: number, currency: Currency): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency }).format(amount)
}

function formatUnitPrice(amount: number, currency: Currency): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(amount)
}

function formatQuantity(quantity: number, type: InvestmentType | ""): string {
  const unit = isPerNominal(type) ? (quantity === 1 ? "nominal" : "nominales") : quantity === 1 ? "unidad" : "unidades"
  return `${quantity.toLocaleString("es-AR", { maximumFractionDigits: 6 })} ${unit}`
}

function pricePerLabel(type: InvestmentType | ""): string {
  return isPerNominal(type) ? "por nominal" : "por unidad"
}

function pricedOnLabel(price: SecurityPriceDto): string {
  return price.pricedOn === todayForDateInput()
    ? `${price.source}, hoy`
    : `cierre de ${price.source} del ${format(parseISO(price.pricedOn), "dd/MM")}`
}

function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100
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
  const [trackingError, setTrackingError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canBeQuoted = type !== "" && isQuotedOnExchange(type)
  const normalizedSymbol = symbol.trim().toUpperCase()
  const hasValidSymbol = normalizedSymbol.length <= SYMBOL_MAX_LENGTH && SYMBOL_PATTERN.test(normalizedSymbol)
  const quoteKey = canBeQuoted && hasValidSymbol && isQuotedCurrency(currency) ? `${normalizedSymbol}:${currency}` : null

  useEffect(() => {
    if (quoteKey === null) {
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      getSecurityPrice(normalizedSymbol, currency, controller.signal)
        .then((price) => setQuote({ key: quoteKey, result: { status: "found", price } }))
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return
          const status = isApiError(error) && error.status === 404 ? "missing" : "unavailable"
          setQuote({ key: quoteKey, result: { status } })
        })
    }, QUOTE_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [quoteKey, normalizedSymbol, currency])

  const quoteResult: QuoteResult | null =
    quoteKey === null ? null : quote?.key === quoteKey ? quote.result : { status: "loading" }
  const quotedPrice = quoteResult?.status === "found" ? quoteResult.price : null
  const parsedQuantity = Number(quantity)
  const hasQuantity = quantity.trim() !== "" && Number.isFinite(parsedQuantity) && parsedQuantity > 0
  const marketValue = quotedPrice !== null && hasQuantity ? roundToCents(quotedPrice.unitPrice * parsedQuantity) : null
  const isAmountCalculated = marketValue !== null && !investedAmountTouched
  const effectiveInvestedAmount = isAmountCalculated ? marketValue.toFixed(2) : investedAmount
  const canUseMarketValue = marketValue !== null && investedAmountTouched && Number(investedAmount) !== marketValue

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
      setTrackingError("Para cotizar la inversión completá el símbolo y la cantidad, o dejá los dos vacíos.")
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
            <p className="text-xs text-muted-foreground">
              Con el símbolo y la cantidad te mostramos el precio de BYMA y calculamos el capital; después la cotizamos
              todos los días hábiles con el cierre. Usá la variante de la moneda de la inversión: AL30 en pesos, AL30D
              en dólares.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="investment-symbol">Símbolo</Label>
              <Input
                id="investment-symbol"
                placeholder={symbolPlaceholders[type] ?? "ej. AL30, YPFD, SPY"}
                maxLength={SYMBOL_MAX_LENGTH}
                pattern="[A-Za-z0-9]+"
                title="Solo letras y números"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              />
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

          {hasValidSymbol && !isQuotedCurrency(currency) && (
            <p className="text-sm text-muted-foreground">
              BYMA cotiza en pesos y en dólares: elegí ARS o USD para ver el precio.
            </p>
          )}

          {quoteResult?.status === "loading" && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
              <Spinner />
              Buscando la cotización de {normalizedSymbol}…
            </p>
          )}

          {quotedPrice && (
            <div className="space-y-1 rounded-md bg-muted/50 px-3 py-2 text-sm" aria-live="polite">
              <p>
                <span className="font-medium">{quotedPrice.symbol}</span>{" "}
                {formatUnitPrice(quotedPrice.unitPrice, quotedPrice.currency)} {pricePerLabel(type)}
                <span className="text-muted-foreground"> · {pricedOnLabel(quotedPrice)}</span>
              </p>
              {marketValue !== null && (
                <p>
                  A este precio, {formatQuantity(parsedQuantity, type)} {parsedQuantity === 1 ? "vale" : "valen"}{" "}
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
            </div>
          )}

          {quoteResult?.status === "missing" && (
            <p className="text-sm text-amber-700 dark:text-amber-300" aria-live="polite">
              No encontramos {normalizedSymbol} en {currencyNames[currency]} en BYMA. Revisá el símbolo o usá la variante
              de la moneda: AL30 en pesos, AL30D en dólares.
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
