"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { addDays, format, parseISO } from "date-fns"
import { Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { SecurityCombobox, type SecurityOption } from "@/components/investments/security-combobox"
import {
  ANNUAL_RATE_MAX,
  ASSET_NAME_MAX_LENGTH,
  FUND_NAME_MAX_LENGTH,
  SYMBOL_MAX_LENGTH,
  TERM_DAYS_MAX,
  accruesInterest,
  canQuoteIn,
  formatQuantity,
  getSecurityPrice,
  hasTerm,
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
import { useMessages, type Messages } from "@/lib/i18n"
import type { Currency } from "@/lib/api/transactions"
import { formatDate, formatDateText, formatMoney } from "@/lib/format"

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

function todayForDateInput(): string {
  return format(new Date(), "yyyy-MM-dd")
}

const DAYS_PER_YEAR = 365

const DAYS_PER_MONTH = 30

function accrualPreview(
  type: InvestmentType,
  capital: number,
  annualRate: number,
  termDays: number,
  purchasedOn: string,
  currency: Currency,
  t: Messages["investmentForm"],
): string | null {
  if (!(capital > 0) || !(annualRate > 0)) {
    return null
  }

  const dailyRate = annualRate / 100 / DAYS_PER_YEAR

  if (!hasTerm(type)) {
    const monthlyInterest = capital * ((1 + dailyRate) ** DAYS_PER_MONTH - 1)

    return t.accrualMonthly(formatMoney(capital, currency), formatMoney(monthlyInterest, currency))
  }

  if (!Number.isInteger(termDays) || termDays < 1 || purchasedOn === "") {
    return null
  }

  const interest = roundToCents(capital * dailyRate * termDays)
  const maturesOn = addDays(parseISO(purchasedOn), termDays)

  return t.accrualTerm(formatDate(maturesOn), formatMoney(capital + interest, currency), formatMoney(interest, currency))
}

function quantityLabel(type: InvestmentType | "", symbol: string, t: Messages["investmentForm"]): string {
  if (type !== "" && isPricedPerNominal(type)) {
    return t.nominals
  }

  if (type === "MutualFund") {
    return t.fundShares
  }

  if (type === "Crypto") {
    return symbol === "" ? t.quantity : t.quantityOf(symbol)
  }

  return t.units
}

function pricePerLabel(type: InvestmentType | "", t: Messages["investmentForm"]): string {
  if (type !== "" && isPricedPerNominal(type)) {
    return t.perNominal
  }

  return type === "MutualFund" ? t.perFundShare : t.perUnit
}

function normalizeSymbol(symbol: string, market: QuoteMarket | null): string {
  return market === "MutualFund" ? symbol.trim().replace(/\s+/g, " ") : symbol.trim().toUpperCase()
}


function formatUnitPrice(amount: number, currency: Currency): string {
  const digits = amount >= 1 ? { minimumFractionDigits: 2, maximumFractionDigits: 6 } : { maximumSignificantDigits: 6 }

  return formatMoney(amount, currency, digits)
}

function pricedOnLabel(price: SecurityPriceDto, t: Messages["investmentForm"]): string {
  return price.pricedOn === todayForDateInput()
    ? t.pricedToday(price.source)
    : t.pricedOn(price.source, formatDateText(price.pricedOn, { day: "2-digit", month: "2-digit" }))
}

function quotedOnText(price: SecurityPriceDto, t: Messages["investmentForm"]): string {
  return price.pricedOn === todayForDateInput()
    ? t.quotedToday
    : t.quotedOn(formatDateText(price.pricedOn, { day: "2-digit", month: "2-digit" }))
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
  const messages = useMessages()
  const labels = messages.labels
  const t = messages.investmentForm
  const isEditing = Boolean(initialInvestment)
  const isImported = initialInvestment?.source === "Iol"
  const [type, setType] = useState<InvestmentType | "">(initialInvestment?.type ?? "")
  const [assetName, setAssetName] = useState(initialInvestment?.assetName ?? "")
  const [assetNameTouched, setAssetNameTouched] = useState(isEditing)
  const [investedAmount, setInvestedAmount] = useState(initialInvestment ? String(initialInvestment.investedAmount) : "")
  const [investedAmountTouched, setInvestedAmountTouched] = useState(isEditing)
  const [currency, setCurrency] = useState<Currency>(initialInvestment?.currency ?? "ARS")
  const [purchasedOn, setPurchasedOn] = useState(initialInvestment?.purchasedOn ?? todayForDateInput())
  const [symbol, setSymbol] = useState(initialInvestment?.symbol ?? "")
  const [quantity, setQuantity] = useState(initialInvestment?.quantity != null ? String(initialInvestment.quantity) : "")
  const [annualRate, setAnnualRate] = useState(
    initialInvestment?.annualRate != null ? String(initialInvestment.annualRate) : "",
  )
  const [termDays, setTermDays] = useState(initialInvestment?.termDays != null ? String(initialInvestment.termDays) : "")
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
  const accrues = type !== "" && accruesInterest(type)
  const withTerm = type !== "" && hasTerm(type)

  const quoteKeyFor = (tickerSymbol: string) => `${market}:${tickerSymbol}:${currency}`
  const quoteKey =
    !isImported && canBeQuoted && !isFund && isValidTicker && currencyIsQuotable ? quoteKeyFor(normalizedSymbol) : null

  const searchScope = !isImported && canBeQuoted && currencyIsQuotable ? `${market}:${isFund ? "" : currency}` : null
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
        isFund ? t.fundTrackingError : t.symbolTrackingError,
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
        annualRate: accrues ? Number(annualRate) : null,
        termDays: withTerm ? Number(termDays) : null,
      })
      onClose()
    } catch (error) {
      toastApiError(error, isEditing ? t.updateFailed : t.createFailed)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="investment-type">{t.type}</Label>
          <Select
            value={type}
            onValueChange={(value) => handleTypeChange(value as InvestmentType)}
            disabled={isImported}
            required
          >
            <SelectTrigger id="investment-type" className="w-full">
              <SelectValue placeholder={t.typePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(labels.investmentTypes).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="investment-currency">{t.currency}</Label>
          <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)} disabled={isImported}>
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

      {isImported ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {type !== "" && symbol !== "" && quantity !== "" && (
              <p className="font-medium text-foreground">
                {symbol} · {formatQuantity(Number(quantity), type)}
              </p>
            )}
            <p>{t.importedNote}</p>
          </AlertDescription>
        </Alert>
      ) : canBeQuoted && (
        <section aria-labelledby="investment-quote-title" className="space-y-3 rounded-md border p-3">
          <div>
            <p id="investment-quote-title" className="text-sm font-medium">
              {t.autoQuote}
            </p>
            <p className="text-xs text-muted-foreground">{t.quoteHelp[market]}</p>
          </div>

          <div className={isFund ? "grid grid-cols-1 gap-3" : "grid grid-cols-5 gap-2"}>
            <div className={isFund ? "space-y-2" : "col-span-3 space-y-2"}>
              <Label htmlFor="investment-symbol">{isFund ? t.fund : t.symbol}</Label>
              <SecurityCombobox
                id="investment-symbol"
                value={symbol}
                options={comboboxOptions}
                isSearching={isSearching}
                placeholder={(type === "" ? undefined : t.symbolPlaceholders[type]) ?? t.defaultSymbolPlaceholder}
                maxLength={isFund ? FUND_NAME_MAX_LENGTH : SYMBOL_MAX_LENGTH}
                onValueChange={(value) => setSymbol(isFund ? value : value.toUpperCase())}
                onSelect={handleSymbolSelect}
              />
            </div>
            <div className={isFund ? "space-y-2" : "col-span-2 space-y-2"}>
              <Label htmlFor="investment-quantity">{quantityLabel(type, isValidTicker ? normalizedSymbol : "", t)}</Label>
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
              {market === "Crypto" ? t.cryptoCurrencyHint : t.bymaCurrencyHint}
            </p>
          )}

          {!isFund && quoteResult?.status === "loading" && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
              <Spinner />
              {t.searchingQuote(normalizedSymbol)}
            </p>
          )}

          {quotedPrice && (
            <div className="space-y-1 rounded-md bg-muted/50 p-3" aria-live="polite">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <p className="min-w-0 truncate" title={quotedPrice.name ?? quotedPrice.symbol}>
                  <span className="font-medium">{quotedPrice.symbol}</span>
                  {quotedPrice.name && <span className="text-muted-foreground"> · {quotedPrice.name}</span>}
                </p>
                <p className="shrink-0 text-xs text-muted-foreground">{pricedOnLabel(quotedPrice, t)}</p>
              </div>
              {marketValue !== null ? (
                <>
                  <p className="text-2xl font-semibold tabular-nums">{formatMoney(marketValue, currency)}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {quantityText} × {formatUnitPrice(quotedPrice.unitPrice, priceCurrency)} {pricePerLabel(type, t)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-semibold tabular-nums">
                    {formatUnitPrice(quotedPrice.unitPrice, priceCurrency)}{" "}
                    <span className="text-sm font-normal text-muted-foreground">{pricePerLabel(type, t)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isFund ? t.enterFundShares : t.enterQuantity}
                  </p>
                </>
              )}
              {fundCurrencyDiffers && (
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {t.fundCurrencyDiffers(t.currencyNames[quotedPrice.currency])}
                </p>
              )}
            </div>
          )}

          {quoteResult?.status === "choose" && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {t.chooseFund}
            </p>
          )}

          {quoteResult?.status === "missing" && (
            <p className="text-sm text-amber-700 dark:text-amber-300" aria-live="polite">
              {isFund
                ? t.fundNotFound
                : market === "Crypto"
                  ? t.cryptoNotFound(normalizedSymbol)
                  : t.bymaNotFound(normalizedSymbol, t.currencyNames[currency])}
            </p>
          )}

          {quoteResult?.status === "unavailable" && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {t.quoteUnavailable}
            </p>
          )}

          {trackingError && <p className="text-sm text-destructive">{trackingError}</p>}
        </section>
      )}

      {!isImported && accrues && (
        <section aria-labelledby="investment-rate-title" className="space-y-3 rounded-md border p-3">
          <div>
            <p id="investment-rate-title" className="text-sm font-medium">
              {t.agreedRate}
            </p>
            <p className="text-xs text-muted-foreground">
              {withTerm ? t.rateHintTerm : t.rateHint}
            </p>
          </div>

          <div className={withTerm ? "grid grid-cols-2 gap-2" : "grid grid-cols-1 gap-3"}>
            <div className="space-y-2">
              <Label htmlFor="investment-rate">{t.rate}</Label>
              <Input
                id="investment-rate"
                type="number"
                inputMode="decimal"
                placeholder={t.ratePlaceholder}
                step="0.01"
                min="0.01"
                max={ANNUAL_RATE_MAX}
                value={annualRate}
                onChange={(e) => setAnnualRate(e.target.value)}
                required
              />
            </div>
            {withTerm && (
              <div className="space-y-2">
                <Label htmlFor="investment-term">{t.term}</Label>
                <Input
                  id="investment-term"
                  type="number"
                  inputMode="numeric"
                  placeholder={t.termPlaceholder}
                  step="1"
                  min="1"
                  max={TERM_DAYS_MAX}
                  value={termDays}
                  onChange={(e) => setTermDays(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground" aria-live="polite">
            {accrualPreview(
              type,
              Number(effectiveInvestedAmount),
              Number(annualRate),
              Number(termDays),
              purchasedOn,
              currency,
              t,
            ) ?? (withTerm ? t.enterRateAndTerm : t.enterRate)}
          </p>
        </section>
      )}

      <div className="space-y-2">
        <Label htmlFor="investment-asset">{t.assetName}</Label>
        <Input
          id="investment-asset"
          placeholder={t.assetNamePlaceholder}
          maxLength={ASSET_NAME_MAX_LENGTH}
          value={effectiveAssetName}
          onChange={(e) => handleAssetNameChange(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="investment-amount">{t.invested}</Label>
        <Input
          id="investment-amount"
          type="number"
          inputMode="decimal"
          placeholder="0.00"
          step="0.01"
          min="0.01"
          value={effectiveInvestedAmount}
          onChange={(e) => handleInvestedAmountChange(e.target.value)}
          disabled={isImported}
          required
        />
        {isAmountCalculated && quotedPrice && (
          <p className="text-xs text-muted-foreground">
            {t.calculatedWithQuote(quotedOnText(quotedPrice, t))}
          </p>
        )}
        {canUseMarketValue && quotedPrice && (
          <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={applyMarketValue}>
            {t.useMarketValue(quotedOnText(quotedPrice, t), formatMoney(marketValue, currency))}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="investment-date">{accrues ? t.startDate : t.purchaseDate}</Label>
        <Input
          id="investment-date"
          type="date"
          max={todayForDateInput()}
          value={purchasedOn}
          onChange={(e) => setPurchasedOn(e.target.value)}
          disabled={isImported}
          required
        />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          {messages.common.cancel}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t.saving : isEditing ? t.saveChanges : t.add}
        </Button>
      </div>
    </form>
  )
}
