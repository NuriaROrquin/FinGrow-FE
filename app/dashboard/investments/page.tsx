"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { toast } from "sonner"
import { Card, CardAction, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { PieChart, Pie, Cell } from "recharts"
import {
  TrendingUpIcon,
  TrendingDownIcon,
  PlusIcon,
  LightbulbIcon,
  InfoIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  getMepQuote,
  getPortfolioSummary,
  investmentTypeLabels,
  listInvestments,
  toastApiError,
  updateInvestment,
  type AllocationGroupDto,
  type CreateInvestmentPayload,
  type CurrencyPortfolioDto,
  type InvestmentDto,
  type InvestmentType,
  type MepQuoteDto,
  type PagedResultDto,
  type PortfolioSummaryDto,
} from "@/lib/api"
import type { Currency } from "@/lib/api/transactions"

const educationalTips = [
  {
    id: 1,
    titulo: "Cómo diversificar tu cartera",
    descripcion:
      "No pongas todos los huevos en la misma canasta. Distribuí tus inversiones entre diferentes tipos de activos para reducir el riesgo.",
    icon: LightbulbIcon,
  },
  {
    id: 2,
    titulo: "Qué es un fondo común de inversión",
    descripcion:
      "Los fondos comunes agrupan el dinero de muchos inversores para comprar una cartera diversificada de activos, gestionada por profesionales.",
    icon: LightbulbIcon,
  },
  {
    id: 3,
    titulo: "Inversión a largo plazo",
    descripcion:
      "El tiempo es tu aliado. Las inversiones a largo plazo tienden a generar mejores rendimientos y reducir el impacto de la volatilidad del mercado.",
    icon: LightbulbIcon,
  },
]

const investmentTypeColors: Record<InvestmentType, string> = {
  Stock: "#3b5998",
  Etf: "#10b981",
  Bond: "#f59e0b",
  MutualFund: "#8b5cf6",
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

function formatMoney(amount: number, currency: Currency): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency }).format(amount)
}

function formatSignedMoney(amount: number, currency: Currency): string {
  return `${amount < 0 ? "-" : "+"}${formatMoney(Math.abs(amount), currency)}`
}

function formatPercentage(value: number): string {
  const formatted = value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${value < 0 ? "" : "+"}${formatted}%`
}

function formatQuantity(quantity: number): string {
  return quantity.toLocaleString("es-AR", { maximumFractionDigits: 6 })
}

function formatDate(isoDate: string): string {
  return format(parseISO(isoDate), "dd/MM/yyyy")
}

function formatDateTime(isoDateTime: string): string {
  return format(parseISO(isoDateTime), "dd/MM/yyyy HH:mm")
}

function listCurrencies(currencies: Currency[]): string {
  return currencies.join(" y ")
}

function pluralizeAssets(count: number): string {
  return `${count} ${count === 1 ? "activo" : "activos"}`
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

function valuationStatus(summary: PortfolioSummaryDto): string {
  if (summary.unquotedCount === summary.investmentCount) {
    return "Sin cotizaciones de mercado todavía: se muestra el capital invertido."
  }

  const oldest = summary.oldestQuotedOn ? formatDate(summary.oldestQuotedOn) : ""

  if (summary.unquotedCount > 0) {
    return `${pluralizeAssets(summary.unquotedCount)} sin cotizar, al costo. El resto, valuado al ${oldest}.`
  }

  return `Valuado al ${oldest}`
}

function allocationByType(groups: AllocationGroupDto[], currency: Currency, quote: MepQuoteDto | null): Allocation {
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
      label: investmentTypeLabels[type],
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
  const messages: string[] = []
  const missingMep = allocation.excludedCurrencies.filter((excluded) => mepConvertibleCurrencies.includes(excluded))
  const notConvertible = allocation.excludedCurrencies.filter(
    (excluded) => !mepConvertibleCurrencies.includes(excluded),
  )

  if (quote && allocation.convertedCurrencies.length > 0) {
    messages.push(
      `Los activos en ${listCurrencies(allocation.convertedCurrencies)} se muestran en ${currency} con el dólar MEP a ${formatMoney(quote.sell, "ARS")} (venta), actualizado el ${formatDateTime(quote.updatedAt)}.`,
    )
  }

  if (mepStatus === "unavailable" && missingMep.length > 0) {
    messages.push(
      `No pudimos obtener la cotización del dólar MEP, así que no se incluyen los activos en ${listCurrencies(missingMep)}.`,
    )
  }

  if (notConvertible.length > 0) {
    messages.push(
      `No se incluyen los activos en ${listCurrencies(notConvertible)}: el dólar MEP solo convierte entre pesos y dólares.`,
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
  const router = useRouter()

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
        toastApiError(error, "No se pudieron cargar tus inversiones.")
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [appliedFilters, pageNumber, pageSize, listVersion])

  useEffect(() => {
    const controller = new AbortController()

    getPortfolioSummary(controller.signal)
      .then(setSummary)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        toastApiError(error, "No se pudo cargar el resumen de tu portafolio.")
      })

    return () => controller.abort()
  }, [summaryVersion])

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

  const refreshSummary = () => setSummaryVersion((version) => version + 1)

  const refreshList = () => setListVersion((version) => version + 1)

  const handleFiltersChange = (values: InvestmentFilterValues) => {
    setFilterValues(values)
    setPageNumber(1)
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
    toast.success(`Inversión "${created.assetName}" registrada`)
  }

  const handleSubmit = async (payload: CreateInvestmentPayload) => {
    if (!editingInvestment) {
      await handleAdd(payload)
      return
    }

    const updated = await updateInvestment(editingInvestment.id, payload)
    refreshList()
    refreshSummary()
    toast.success(`Inversión "${updated.assetName}" actualizada`)
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
      toast.success(`Inversión "${investmentToDelete.assetName}" eliminada`)
      setInvestmentToDelete(null)
    } catch (error) {
      toastApiError(error, "No se pudo eliminar la inversión.")
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
  const emptyHint = summary === null ? "Cargando..." : "Todavía no registraste inversiones"

  const allocationCurrencies =
    mepQuote && currencies.some((currency) => mepConvertibleCurrencies.includes(currency))
      ? [...currencies, ...mepConvertibleCurrencies.filter((currency) => !currencies.includes(currency))]
      : currencies
  const selectedAllocationCurrency = pickCurrency(allocationCurrencies, allocationCurrency)
  const allocation: Allocation = selectedAllocationCurrency
    ? allocationByType(summary?.allocation ?? [], selectedAllocationCurrency, mepQuote)
    : { slices: [], convertedCurrencies: [], excludedCurrencies: [] }
  const allocationChartConfig: ChartConfig = Object.fromEntries(
    allocation.slices.map((slice) => [slice.label, { label: slice.label, color: slice.color }]),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Inversiones</h1>
          <p className="text-muted-foreground mt-1">Gestioná y seguí el rendimiento de tus inversiones</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="size-4" />
              Agregar Inversión
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingInvestment ? "Editar inversión" : "Agregar Nueva Inversión"}</DialogTitle>
              <DialogDescription>
                {editingInvestment
                  ? "Corregí los datos de la inversión seleccionada"
                  : "Registrá una nueva inversión en tu portafolio"}
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

        <AlertDialog
          open={investmentToDelete !== null}
          onOpenChange={(open) => {
            if (!open && !isDeleting) setInvestmentToDelete(null)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar inversión?</AlertDialogTitle>
              <AlertDialogDescription>
                {investmentToDelete
                  ? `Vas a eliminar "${investmentToDelete.assetName}" por ${formatMoney(investmentToDelete.investedAmount, investmentToDelete.currency)} invertidos. Esta acción no se puede deshacer.`
                  : ""}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
                onClick={(event) => {
                  event.preventDefault()
                  void handleDelete()
                }}
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Valor Total del Portafolio</CardDescription>
            <CardTitle className="text-2xl">
              <MoneyByCurrency amounts={portfolioCurrencies.map((entry) => [entry.currency, entry.currentValue])} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {consolidated && (
              <p className="text-sm font-medium">
                ≈ {formatMoney(consolidated.amount, "USD")} en total al dólar MEP
                {consolidated.excludedCurrencies.length > 0 &&
                  ` (sin ${listCurrencies(consolidated.excludedCurrencies)})`}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {summary && investmentCount > 0 ? valuationStatus(summary) : emptyHint}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Invertido</CardDescription>
            <CardTitle className="text-2xl">
              <MoneyByCurrency amounts={portfolioCurrencies.map((entry) => [entry.currency, entry.investedAmount])} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{pluralizeAssets(investmentCount)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rendimiento</CardDescription>
            <CardTitle className="text-2xl">
              {quotedCurrencies.length === 0 ? (
                <span className="text-muted-foreground">Sin cotizar</span>
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
                {investmentCount === 0
                  ? emptyHint
                  : "El rendimiento aparece cuando el mercado cotice tus activos."}
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
                <span>
                  {formatPercentage(entry.quotedReturnPercentage)} en {entry.currency}
                </span>
              </div>
            ))}
            {quotedCurrencies.length > 0 && summary && summary.unquotedCount > 0 && (
              <p className="text-xs text-muted-foreground">
                No incluye {pluralizeAssets(summary.unquotedCount)} sin cotizar.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Última compra</CardDescription>
            <CardTitle className="text-2xl truncate">{lastPurchase ? lastPurchase.assetName : "Sin compras"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {lastPurchase
                ? `${investmentTypeLabels[lastPurchase.type]} · ${formatDate(lastPurchase.purchasedOn)}`
                : emptyHint}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Tipo de Activo</CardTitle>
              <CardDescription>Cómo se reparte tu portafolio según el valor actual de cada activo</CardDescription>
              {selectedAllocationCurrency && (
                <CurrencyPicker
                  currencies={allocationCurrencies}
                  value={selectedAllocationCurrency}
                  onChange={setAllocationCurrency}
                />
              )}
            </CardHeader>
            <CardContent>
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
                          {formatMoney(slice.value, selectedAllocationCurrency)} · {slice.share.toFixed(0)}%
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

        <div className="space-y-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LightbulbIcon className="size-5 text-primary" />
                Tips Educativos
              </CardTitle>
              <CardDescription>Aprendé más sobre inversiones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {educationalTips.map((tip) => (
                <div key={tip.id} className="p-3 rounded-lg bg-background border">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <tip.icon className="size-4 text-primary" />
                    {tip.titulo}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tip.descripcion}</p>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full bg-transparent"
                size="sm"
                onClick={() => router.push("/dashboard/education")}
              >
                Ver más recursos educativos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tu Cartera de Inversiones</CardTitle>
          <CardDescription>Detalle completo de tus activos</CardDescription>
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
                <TableHead>Activo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha de compra</TableHead>
                <TableHead className="text-right">Capital invertido</TableHead>
                <TableHead className="text-right">Valor actual</TableHead>
                <TableHead className="text-right">Rendimiento</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Cargando tus inversiones...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && page && page.totalCount === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {hasActiveFilters(appliedFilters) ? (
                      <div className="space-y-2 py-2">
                        <p>Ninguna inversión coincide con los filtros.</p>
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                          Limpiar filtros
                        </Button>
                      </div>
                    ) : (
                      "Todavía no registraste ninguna inversión. Agregá la primera con el botón de arriba."
                    )}
                  </TableCell>
                </TableRow>
              )}
              {rows.map((investment) => (
                <TableRow key={investment.id}>
                  <TableCell>
                    <div className="font-medium">{investment.assetName}</div>
                    {investment.symbol && investment.quantity != null && (
                      <div className="text-xs text-muted-foreground">
                        {investment.symbol} · {formatQuantity(investment.quantity)}{" "}
                        {investment.type === "Bond" ? "nominales" : "unidades"}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {investmentTypeLabels[investment.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(investment.purchasedOn)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatMoney(investment.investedAmount, investment.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-semibold">{formatMoney(investment.currentValue, investment.currency)}</div>
                    {!investment.hasMarketValuation && (
                      <div className="text-xs text-muted-foreground">al costo</div>
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
                          {formatPercentage(investment.returnPercentage)})
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sin cotizar</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <InvestmentRowActions
                      investment={investment}
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
                  {page.totalCount} {page.totalCount === 1 ? "inversión" : "inversiones"}
                </span>
                <span>
                  Mostrando {visibleStart}-{visibleEnd} de {page.totalCount}
                </span>
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
                        {size} por página
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Página anterior"
                  disabled={page.pageNumber <= 1 || isLoading}
                  onClick={() => setPageNumber((current) => current - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="min-w-[84px] text-center">
                  Página {page.pageNumber} de {Math.max(page.totalPages, 1)}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Página siguiente"
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
