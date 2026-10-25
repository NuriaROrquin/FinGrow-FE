"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Card, CardAction, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { PieChart, Pie, Cell } from "recharts"
import {
  TrendingUpIcon,
  TrendingDownIcon,
  PlusIcon,
  InfoIcon,
  RefreshCwIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SortableTableHead } from "@/components/ui/sortable-table-head"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AddInvestmentForm } from "@/components/investments/add-investment-form"
import { InvestmentRowActions } from "@/components/investments/investment-row-actions"
import { LearnByAssetTypeCard } from "@/components/investments/learn-by-asset-type-card"
import { PortfolioEvolutionCard } from "@/components/investments/portfolio-evolution-card"
import { RelatedEducationDialog } from "@/components/investments/related-education-dialog"
import {
  InvestmentFiltersBar,
  defaultInvestmentFilters,
  filtersError,
  hasActiveFilters,
  toListQuery,
  type InvestmentFilterValues,
} from "@/components/investments/investment-filters-bar"
import {
  createInvestment,
  deleteInvestment,
  getIntegration,
  getMepQuote,
  getPortfolioSummary,
  IOL_GRANT_EXPIRED,
  accruesInterest,
  isApiError,
  formatQuantity,
  listInvestments,
  syncIol,
  toastApiError,
  updateInvestment,
  type AllocationGroupDto,
  type CreateInvestmentPayload,
  type CurrencyPortfolioDto,
  type InvestmentDto,
  type InvestmentSortField,
  type InvestmentType,
  type MepQuoteDto,
  type PagedResultDto,
  type PortfolioSummaryDto,
} from "@/lib/api"
import type { Currency } from "@/lib/api/transactions"
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
  formatSignedMoney,
  formatSignedPercentage,
} from "@/lib/format"
import { useMessages, type Messages } from "@/lib/i18n"
import { toggleSort, type SortState } from "@/lib/sort"

const investmentTypeColors: Record<InvestmentType, string> = {
  Stock: "#3b5998",
  Cedear: "#0ea5e9",
  Etf: "#10b981",
  Bond: "#f59e0b",
  CorporateBond: "#f97316",
  TreasuryBill: "#84cc16",
  MutualFund: "#8b5cf6",
  FixedTermDeposit: "#64748b",
  Repo: "#14b8a6",
  RemuneratedAccount: "#ec4899",
  Crypto: "#ef4444",
}

const mepConvertibleCurrencies: Currency[] = ["ARS", "USD"]

const pageSizeOptions = [5, 10, 20, 50]

type AllocationSlice = {
  type: InvestmentType
  label: string
  value: number
  share: number
  color: string
}

interface Allocation {
  slices: AllocationSlice[]
  convertedCurrencies: Currency[]
  excludedCurrencies: Currency[]
}

interface ConsolidatedTotal {
  amount: number
  excludedCurrencies: Currency[]
}

type MepStatus = "loading" | "ready" | "unavailable"

interface LearningState {
  type: InvestmentType
  open: boolean
}

function listCurrencies(currencies: Currency[], t: Messages["investments"]): string {
  return currencies.join(t.listSeparator)
}

function isValuedAtMaturity(investment: InvestmentDto): boolean {
  return investment.maturesOn !== null && investment.valuedOn >= investment.maturesOn
}

function rateDetail(investment: InvestmentDto, t: Messages["investments"]): string | null {
  if (investment.annualRate === null) {
    return null
  }

  const rate = t.rate(formatNumber(investment.annualRate, { maximumFractionDigits: 2 }))

  if (investment.maturesOn === null) {
    return rate
  }

  return isValuedAtMaturity(investment)
    ? t.rateMatured(rate, formatDate(investment.maturesOn))
    : t.rateMatures(rate, formatDate(investment.maturesOn))
}

function unvaluedLabel(investment: InvestmentDto, t: Messages["investments"]): string {
  return accruesInterest(investment.type) && investment.annualRate === null ? t.missingRate : t.unquoted
}

function convertWithMep(amount: number, from: Currency, to: Currency, quote: MepQuoteDto | null): number | null {
  if (from === to) {
    return amount
  }

  if (!quote || !mepConvertibleCurrencies.includes(from) || !mepConvertibleCurrencies.includes(to)) {
    return null
  }

  return from === "ARS" ? amount / quote.sell : amount * quote.sell
}

function pickCurrency(options: Currency[], chosen: Currency | ""): Currency | undefined {
  return options.includes(chosen as Currency) ? (chosen as Currency) : options[0]
}

function consolidateInDollars(currencies: CurrencyPortfolioDto[], quote: MepQuoteDto | null): ConsolidatedTotal | null {
  const convertible = currencies.filter((entry) => mepConvertibleCurrencies.includes(entry.currency))

  if (!quote || convertible.length < 2) {
    return null
  }

  return {
    amount: convertible.reduce(
      (total, entry) => total + (convertWithMep(entry.currentValue, entry.currency, "USD", quote) ?? 0),
      0,
    ),
    excludedCurrencies: currencies
      .filter((entry) => !mepConvertibleCurrencies.includes(entry.currency))
      .map((entry) => entry.currency),
  }
}

function valuationStatus(summary: PortfolioSummaryDto, t: Messages["investments"]): string {
  if (summary.unquotedCount === summary.investmentCount) {
    return t.noQuotesYet
  }

  const valuedOn = summary.oldestQuotedOn ? t.valuedOn(formatDate(summary.oldestQuotedOn)) : t.valuedAtMaturity

  if (summary.unquotedCount > 0) {
    return t.partlyUnquoted(t.assets(summary.unquotedCount), valuedOn)
  }

  return `${valuedOn.charAt(0).toUpperCase()}${valuedOn.slice(1)}`
}

function heldTypesOf(groups: AllocationGroupDto[], slices: AllocationSlice[]): InvestmentType[] {
  const byValue = slices.map((slice) => slice.type)
  const rest = groups.map((group) => group.type).filter((type) => !byValue.includes(type))

  return Array.from(new Set([...byValue, ...rest]))
}

function allocationByType(
  groups: AllocationGroupDto[],
  currency: Currency,
  quote: MepQuoteDto | null,
  typeLabels: Messages["labels"]["investmentTypes"],
): Allocation {
  const valueByType = new Map<InvestmentType, number>()
  const convertedCurrencies = new Set<Currency>()
  const excludedCurrencies = new Set<Currency>()

  for (const group of groups) {
    const value = convertWithMep(group.currentValue, group.currency, currency, quote)

    if (value === null) {
      excludedCurrencies.add(group.currency)
      continue
    }

    if (group.currency !== currency) {
      convertedCurrencies.add(group.currency)
    }

    valueByType.set(group.type, (valueByType.get(group.type) ?? 0) + value)
  }

  const total = Array.from(valueByType.values()).reduce((sum, value) => sum + value, 0)

  const slices = Array.from(valueByType.entries())
    .map(([type, value]) => ({
      type,
      label: typeLabels[type],
      value: Math.round(value * 100) / 100,
      share: total === 0 ? 0 : (value / total) * 100,
      color: investmentTypeColors[type],
    }))
    .sort((first, second) => second.value - first.value)

  return {
    slices,
    convertedCurrencies: Array.from(convertedCurrencies),
    excludedCurrencies: Array.from(excludedCurrencies),
  }
}

function MoneyByCurrency({ amounts }: { amounts: [Currency, number][] }) {
  if (amounts.length === 0) {
    return <span>{formatMoney(0, "ARS")}</span>
  }

  return (
    <div className="space-y-1">
      {amounts.map(([currency, amount], index) => (
        <div key={currency} className={index === 0 ? undefined : "text-base text-muted-foreground"}>
          {formatMoney(amount, currency)}
        </div>
      ))}
    </div>
  )
}

function AllocationNotice({
  allocation,
  currency,
  quote,
  mepStatus,
}: {
  allocation: Allocation
  currency: Currency
  quote: MepQuoteDto | null
  mepStatus: MepStatus
}) {
  const t = useMessages().investments
  const messages: string[] = []
  const missingMep = allocation.excludedCurrencies.filter((excluded) => mepConvertibleCurrencies.includes(excluded))
  const notConvertible = allocation.excludedCurrencies.filter(
    (excluded) => !mepConvertibleCurrencies.includes(excluded),
  )

  if (quote && allocation.convertedCurrencies.length > 0) {
    messages.push(
      t.convertedWithMep(
        listCurrencies(allocation.convertedCurrencies, t),
        currency,
        formatMoney(quote.sell, "ARS"),
        formatDateTime(quote.updatedAt),
      ),
    )
  }

  if (mepStatus === "unavailable" && missingMep.length > 0) {
    messages.push(
      t.mepUnavailable(listCurrencies(missingMep, t)),
    )
  }

  if (notConvertible.length > 0) {
    messages.push(
      t.notConvertible(listCurrencies(notConvertible, t)),
    )
  }

  if (messages.length === 0) {
    return null
  }

  return (
    <div className="mt-4 flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
      <InfoIcon className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-1">
        {messages.map((message) => (
          <p key={message}>{message}</p>
        ))}
      </div>
    </div>
  )
}

function CurrencyPicker({
  currencies,
  value,
  onChange,
}: {
  currencies: Currency[]
  value: Currency
  onChange: (currency: Currency) => void
}) {
  if (currencies.length < 2) {
    return null
  }

  return (
    <CardAction>
      <Select value={value} onValueChange={(selected) => onChange(selected as Currency)}>
        <SelectTrigger className="w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {currencies.map((currency) => (
            <SelectItem key={currency} value={currency}>
              {currency}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </CardAction>
  )
}

export default function InvestmentsPage() {
  const messages = useMessages()
  const t = messages.investments
  const [page, setPage] = useState<PagedResultDto<InvestmentDto> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filterValues, setFilterValues] = useState<InvestmentFilterValues>(defaultInvestmentFilters)
  const [appliedFilters, setAppliedFilters] = useState<InvestmentFilterValues>(defaultInvestmentFilters)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [listVersion, setListVersion] = useState(0)
  const [summary, setSummary] = useState<PortfolioSummaryDto | null>(null)
  const [summaryVersion, setSummaryVersion] = useState(0)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingInvestment, setEditingInvestment] = useState<InvestmentDto | null>(null)
  const [investmentToDelete, setInvestmentToDelete] = useState<InvestmentDto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [allocationCurrency, setAllocationCurrency] = useState<Currency | "">("")
  const [mepQuote, setMepQuote] = useState<MepQuoteDto | null>(null)
  const [mepStatus, setMepStatus] = useState<MepStatus>("loading")
  const [learning, setLearning] = useState<LearningState | null>(null)
  const [iolLinked, setIolLinked] = useState(false)
  const [isSyncingIol, setIsSyncingIol] = useState(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setAppliedFilters(filterValues), 300)

    return () => window.clearTimeout(timeoutId)
  }, [filterValues])

  useEffect(() => {
    if (filtersError(appliedFilters)) return

    const controller = new AbortController()
    setIsLoading(true)

    listInvestments(toListQuery(appliedFilters, pageNumber, pageSize), controller.signal)
      .then(setPage)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        toastApiError(error, t.loadFailed)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [appliedFilters, pageNumber, pageSize, listVersion, t])

  useEffect(() => {
    const controller = new AbortController()

    getPortfolioSummary(controller.signal)
      .then(setSummary)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        toastApiError(error, t.summaryLoadFailed)
      })

    return () => controller.abort()
  }, [summaryVersion, t])

  useEffect(() => {
    const controller = new AbortController()

    getMepQuote(controller.signal)
      .then((quote) => {
        setMepQuote(quote)
        setMepStatus("ready")
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setMepStatus("unavailable")
      })

    return () => controller.abort()
  }, [])

  // Sin IOL vinculado el botón de sincronizar no se muestra; si no se puede consultar, tampoco.
  useEffect(() => {
    const controller = new AbortController()

    getIntegration("iol", controller.signal)
      .then((integration) => setIolLinked(integration.linked))
      .catch(() => setIolLinked(false))

    return () => controller.abort()
  }, [])

  const refreshSummary = () => setSummaryVersion((version) => version + 1)

  const syncIolPortfolio = async () => {
    setIsSyncingIol(true)
    try {
      const result = await syncIol()
      refreshList()
      refreshSummary()
      toast.success(messages.iol.synced, {
        description: messages.iol.syncDetail(result.imported, result.updated, result.ignored),
      })
    } catch (error) {
      const reason = isApiError(error)
        ? error.code === IOL_GRANT_EXPIRED
          ? messages.iol.relinkInSettings
          : messages.iol.linkErrors[error.code]
        : undefined
      if (reason) {
        toast.error(messages.iol.syncFailed, { description: reason })
      } else {
        toastApiError(error, messages.iol.syncFailed)
      }
    } finally {
      setIsSyncingIol(false)
    }
  }

  const openLearning = (type: InvestmentType) => setLearning({ type, open: true })

  const refreshList = () => setListVersion((version) => version + 1)

  const handleFiltersChange = (values: InvestmentFilterValues) => {
    setFilterValues(values)
    setPageNumber(1)
  }

  const sort: SortState<InvestmentSortField> = {
    field: filterValues.sortBy,
    direction: filterValues.sortDirection === "Ascending" ? "asc" : "desc",
  }

  const handleSort = (field: InvestmentSortField) => {
    const next = toggleSort(sort, field, ["PurchasedOn", "InvestedAmount", "CurrentValue", "ReturnPercentage"])

    handleFiltersChange({
      ...filterValues,
      sortBy: next.field,
      sortDirection: next.direction === "asc" ? "Ascending" : "Descending",
    })
  }

  const clearFilters = () =>
    handleFiltersChange({
      ...defaultInvestmentFilters,
      sortBy: filterValues.sortBy,
      sortDirection: filterValues.sortDirection,
    })

  const handleAdd = async (payload: CreateInvestmentPayload) => {
    const created = await createInvestment(payload)
    refreshList()
    refreshSummary()
    toast.success(t.created(created.assetName))
  }

  const handleSubmit = async (payload: CreateInvestmentPayload) => {
    if (!editingInvestment) {
      await handleAdd(payload)
      return
    }

    const updated = await updateInvestment(editingInvestment.id, payload)
    refreshList()
    refreshSummary()
    toast.success(t.updated(updated.assetName))
  }

  const handleDialogChange = (open: boolean) => {
    setIsAddDialogOpen(open)
    if (!open) setEditingInvestment(null)
  }

  const openEditDialog = (investment: InvestmentDto) => {
    setEditingInvestment(investment)
    setIsAddDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!investmentToDelete) return

    setIsDeleting(true)
    try {
      await deleteInvestment(investmentToDelete.id)
      if (page && page.items.length === 1 && pageNumber > 1) {
        setPageNumber((current) => current - 1)
      } else {
        refreshList()
      }
      refreshSummary()
      toast.success(t.deleted(investmentToDelete.assetName))
      setInvestmentToDelete(null)
    } catch (error) {
      toastApiError(error, t.deleteFailed)
    } finally {
      setIsDeleting(false)
    }
  }

  const rows = page?.items ?? []
  const visibleStart = page && page.totalCount > 0 ? (page.pageNumber - 1) * page.pageSize + 1 : 0
  const visibleEnd = page ? Math.min(page.pageNumber * page.pageSize, page.totalCount) : 0

  const portfolioCurrencies = summary?.currencies ?? []
  const currencies = portfolioCurrencies.map((entry) => entry.currency)
  const quotedCurrencies = portfolioCurrencies.filter((entry) => entry.quotedCount > 0)
  const investmentCount = summary?.investmentCount ?? 0
  const lastPurchase = summary?.lastPurchase ?? null
  const consolidated = consolidateInDollars(portfolioCurrencies, mepQuote)
  const emptyHint = summary === null ? t.loading : t.noInvestments

  const allocationCurrencies =
    mepQuote && currencies.some((currency) => mepConvertibleCurrencies.includes(currency))
      ? [...currencies, ...mepConvertibleCurrencies.filter((currency) => !currencies.includes(currency))]
      : currencies
  const selectedAllocationCurrency = pickCurrency(allocationCurrencies, allocationCurrency)
  const allocation: Allocation = selectedAllocationCurrency
    ? allocationByType(summary?.allocation ?? [], selectedAllocationCurrency, mepQuote, messages.labels.investmentTypes)
    : { slices: [], convertedCurrencies: [], excludedCurrencies: [] }
  const allocationChartConfig: ChartConfig = Object.fromEntries(
    allocation.slices.map((slice) => [slice.label, { label: slice.label, color: slice.color }]),
  )
  const heldTypes = summary ? heldTypesOf(summary.allocation, allocation.slices) : null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-balance">{t.title}</h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {iolLinked && (
            <Button variant="outline" onClick={syncIolPortfolio} disabled={isSyncingIol}>
              {isSyncingIol ? <Spinner /> : <RefreshCwIcon className="size-4" />}
              {messages.iol.syncInvestments}
            </Button>
          )}
          <Dialog open={isAddDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="size-4" />
                {t.add}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingInvestment ? t.editTitle : t.addTitle}</DialogTitle>
                <DialogDescription>
                  {editingInvestment ? t.editDescription : t.addDescription}
                </DialogDescription>
              </DialogHeader>
              <AddInvestmentForm
                key={editingInvestment?.id ?? "new"}
                initialInvestment={editingInvestment}
                onSubmit={handleSubmit}
                onClose={() => handleDialogChange(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <AlertDialog
          open={investmentToDelete !== null}
          onOpenChange={(open) => {
            if (!open && !isDeleting) setInvestmentToDelete(null)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.deleteTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {investmentToDelete
                  ? t.deleteWarning(
                      investmentToDelete.assetName,
                      formatMoney(investmentToDelete.investedAmount, investmentToDelete.currency),
                    )
                  : ""}
                {investmentToDelete?.source === "Iol" && t.deleteIolNote}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>{messages.common.cancel}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
                onClick={(event) => {
                  event.preventDefault()
                  void handleDelete()
                }}
              >
                {isDeleting ? t.deleting : t.delete}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.totalValue}</CardDescription>
            <CardTitle className="text-2xl">
              <MoneyByCurrency amounts={portfolioCurrencies.map((entry) => [entry.currency, entry.currentValue])} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {consolidated && (
              <p className="text-sm font-medium">
                {t.consolidated(formatMoney(consolidated.amount, "USD"))}
                {consolidated.excludedCurrencies.length > 0 &&
                  t.consolidatedExcluding(listCurrencies(consolidated.excludedCurrencies, t))}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {summary && investmentCount > 0 ? valuationStatus(summary, t) : emptyHint}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.totalInvested}</CardDescription>
            <CardTitle className="text-2xl">
              <MoneyByCurrency amounts={portfolioCurrencies.map((entry) => [entry.currency, entry.investedAmount])} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t.assets(investmentCount)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.performance}</CardDescription>
            <CardTitle className="text-2xl">
              {quotedCurrencies.length === 0 ? (
                <span className="text-muted-foreground">{t.unquoted}</span>
              ) : (
                <div className="space-y-1">
                  {quotedCurrencies.map((entry, index) => (
                    <div
                      key={entry.currency}
                      className={`${index === 0 ? "" : "text-base"} ${entry.quotedReturnAmount >= 0 ? "text-success" : "text-destructive"}`}
                    >
                      {formatSignedMoney(entry.quotedReturnAmount, entry.currency)}
                    </div>
                  ))}
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {quotedCurrencies.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {investmentCount === 0 ? emptyHint : t.performancePending}
              </p>
            )}
            {quotedCurrencies.map((entry) => (
              <div
                key={entry.currency}
                className={`flex items-center gap-1 text-sm ${entry.quotedReturnAmount >= 0 ? "text-success" : "text-destructive"}`}
              >
                {entry.quotedReturnAmount >= 0 ? (
                  <TrendingUpIcon className="size-4" />
                ) : (
                  <TrendingDownIcon className="size-4" />
                )}
                <span>{t.returnIn(formatSignedPercentage(entry.quotedReturnPercentage), entry.currency)}</span>
              </div>
            ))}
            {quotedCurrencies.length > 0 && summary && summary.unquotedCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {t.excludesUnquoted(t.assets(summary.unquotedCount))}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.lastPurchase}</CardDescription>
            <CardTitle className="text-2xl truncate">{lastPurchase ? lastPurchase.assetName : t.noPurchases}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {lastPurchase
                ? `${messages.labels.investmentTypes[lastPurchase.type]} · ${formatDate(lastPurchase.purchasedOn)}`
                : emptyHint}
            </p>
          </CardContent>
        </Card>
      </div>

      <PortfolioEvolutionCard currencies={summary ? currencies : null} refreshKey={summaryVersion} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>{t.allocationTitle}</CardTitle>
              <CardDescription>{t.allocationDescription}</CardDescription>
              {selectedAllocationCurrency && (
                <CurrencyPicker
                  currencies={allocationCurrencies}
                  value={selectedAllocationCurrency}
                  onChange={setAllocationCurrency}
                />
              )}
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-center">
              {allocation.slices.length === 0 || !selectedAllocationCurrency ? (
                <p className="text-sm text-muted-foreground">{emptyHint}</p>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <ChartContainer config={allocationChartConfig} className="h-[250px] w-full">
                    <PieChart>
                      <Pie
                        data={allocation.slices}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: { name?: string; percent?: number }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                        outerRadius={90}
                        dataKey="value"
                        nameKey="label"
                      >
                        {allocation.slices.map((slice) => (
                          <Cell key={slice.type} fill={slice.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent hideLabel indicator="dot" />} cursor={false} />
                    </PieChart>
                  </ChartContainer>

                  <div className="flex flex-col justify-center gap-3">
                    {allocation.slices.map((slice) => (
                      <div key={slice.type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="size-3 rounded-full" style={{ backgroundColor: slice.color }} />
                          <span className="text-sm font-medium">{slice.label}</span>
                        </div>
                        <span className="text-sm font-semibold">
                          {formatMoney(slice.value, selectedAllocationCurrency)} ·{" "}
                          {formatNumber(slice.share, { maximumFractionDigits: 0 })}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedAllocationCurrency && (
                <AllocationNotice
                  allocation={allocation}
                  currency={selectedAllocationCurrency}
                  quote={mepQuote}
                  mepStatus={mepStatus}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <LearnByAssetTypeCard heldTypes={heldTypes} onOpen={openLearning} />
        </div>
      </div>

      <RelatedEducationDialog
        type={learning?.type ?? null}
        open={learning?.open ?? false}
        onOpenChange={(open) => setLearning((current) => (current ? { ...current, open } : null))}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t.portfolioTitle}</CardTitle>
          <CardDescription>{t.portfolioDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <InvestmentFiltersBar
            values={filterValues}
            onChange={handleFiltersChange}
            onClear={clearFilters}
            error={filtersError(filterValues)}
          />
          <Table className={isLoading && rows.length > 0 ? "opacity-60" : undefined}>
            <TableHeader>
              <TableRow>
                <SortableTableHead label={t.columnAsset} field="AssetName" sort={sort} onSort={handleSort} />
                <SortableTableHead label={t.columnType} field="AssetType" sort={sort} onSort={handleSort} />
                <SortableTableHead label={t.columnPurchasedOn} field="PurchasedOn" sort={sort} onSort={handleSort} />
                <SortableTableHead
                  label={t.columnInvested}
                  field="InvestedAmount"
                  sort={sort}
                  onSort={handleSort}
                  align="right"
                />
                <SortableTableHead label={t.columnCurrentValue} field="CurrentValue" sort={sort} onSort={handleSort} align="right" />
                <SortableTableHead
                  label={t.columnReturn}
                  field="ReturnPercentage"
                  sort={sort}
                  onSort={handleSort}
                  align="right"
                />
                <TableHead className="text-right">{t.columnActions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {t.loadingList}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && page && page.totalCount === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {hasActiveFilters(appliedFilters) ? (
                      <div className="space-y-2 py-2">
                        <p>{t.noMatches}</p>
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                          {t.clearFilters}
                        </Button>
                      </div>
                    ) : (
                      t.emptyList
                    )}
                  </TableCell>
                </TableRow>
              )}
              {rows.map((investment) => (
                <TableRow key={investment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{investment.assetName}</span>
                      {investment.source === "Iol" && (
                        <Badge variant="secondary" className="text-xs" title={t.importedFromIol}>
                          IOL
                        </Badge>
                      )}
                    </div>
                    {investment.symbol && investment.quantity != null && (
                      <div className="text-xs text-muted-foreground">
                        {investment.symbol} · {formatQuantity(investment.quantity, investment.type)}
                      </div>
                    )}
                    {rateDetail(investment, t) && (
                      <div className="text-xs text-muted-foreground">{rateDetail(investment, t)}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {messages.labels.investmentTypes[investment.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(investment.purchasedOn)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatMoney(investment.investedAmount, investment.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-semibold">{formatMoney(investment.currentValue, investment.currency)}</div>
                    {!investment.hasMarketValuation && (
                      <div className="text-xs text-muted-foreground">{t.atCost}</div>
                    )}
                    {isValuedAtMaturity(investment) && (
                      <div className="text-xs text-muted-foreground">{t.atMaturity}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {investment.hasMarketValuation ? (
                      <div
                        className={`flex items-center justify-end gap-1 ${investment.returnAmount >= 0 ? "text-success" : "text-destructive"}`}
                      >
                        {investment.returnAmount >= 0 ? (
                          <TrendingUpIcon className="size-4" />
                        ) : (
                          <TrendingDownIcon className="size-4" />
                        )}
                        <span className="font-semibold">
                          {formatSignedMoney(investment.returnAmount, investment.currency)} (
                          {formatSignedPercentage(investment.returnPercentage)})
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">{unvaluedLabel(investment, t)}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <InvestmentRowActions
                      investment={investment}
                      onLearn={openLearning}
                      onEdit={openEditDialog}
                      onDelete={setInvestmentToDelete}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {page && page.totalCount > 0 && (
            <div className="mt-4 flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-foreground">
                  {t.count(page.totalCount)}
                </span>
                <span>{t.showing(visibleStart, visibleEnd, page.totalCount)}</span>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    setPageSize(Number(value))
                    setPageNumber(1)
                  }}
                >
                  <SelectTrigger className="h-9 w-full sm:w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {t.perPage(size)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={t.previousPage}
                  disabled={page.pageNumber <= 1 || isLoading}
                  onClick={() => setPageNumber((current) => current - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="min-w-[84px] text-center">
                  {t.pageOf(page.pageNumber, Math.max(page.totalPages, 1))}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={t.nextPage}
                  disabled={page.pageNumber >= page.totalPages || isLoading}
                  onClick={() => setPageNumber((current) => current + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
