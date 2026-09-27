"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { toast } from "sonner"
import { Card, CardAction, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid } from "recharts"
import { TrendingUpIcon, TrendingDownIcon, PlusIcon, LightbulbIcon } from "lucide-react"
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
  createInvestment,
  deleteInvestment,
  investmentTypeLabels,
  listInvestments,
  toastApiError,
  updateInvestment,
  type CreateInvestmentPayload,
  type InvestmentDto,
  type InvestmentType,
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

const currencyColors: Record<Currency, string> = {
  ARS: "#8b5cf6",
  USD: "#10b981",
  EUR: "#3b5998",
  BRL: "#f59e0b",
}

const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

type TotalsByCurrency = Partial<Record<Currency, number>>

interface CapitalByMonth {
  mes: string
  capital: number
}

interface AllocationSlice {
  type: InvestmentType
  label: string
  value: number
  share: number
  color: string
}

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

function formatDate(isoDate: string): string {
  return format(parseISO(isoDate), "dd/MM/yyyy")
}

function monthOf(isoDate: string): string {
  return isoDate.slice(0, 7)
}

function monthLabel(month: string): string {
  const [year, monthNumber] = month.split("-")
  return `${monthNames[Number(monthNumber) - 1]} ${year.slice(2)}`
}

function nextMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number)
  return monthNumber === 12 ? `${year + 1}-01` : `${year}-${String(monthNumber + 1).padStart(2, "0")}`
}

function pickCurrency(options: Currency[], chosen: Currency | ""): Currency | undefined {
  return options.includes(chosen as Currency) ? (chosen as Currency) : options[0]
}

function sumByCurrency(investments: InvestmentDto[], pick: (investment: InvestmentDto) => number): TotalsByCurrency {
  return investments.reduce<TotalsByCurrency>((totals, investment) => {
    totals[investment.currency] = (totals[investment.currency] ?? 0) + pick(investment)
    return totals
  }, {})
}

function sortByPurchase(investments: InvestmentDto[]): InvestmentDto[] {
  return [...investments].sort(
    (first, second) =>
      second.purchasedOn.localeCompare(first.purchasedOn) || second.createdAt.localeCompare(first.createdAt),
  )
}

function investedCapitalByMonth(investments: InvestmentDto[], currency: Currency): CapitalByMonth[] {
  const inCurrency = investments.filter((investment) => investment.currency === currency)

  if (inCurrency.length === 0) {
    return []
  }

  const firstMonth = inCurrency.map((investment) => monthOf(investment.purchasedOn)).sort()[0]
  const lastMonth = format(new Date(), "yyyy-MM")
  const rows: CapitalByMonth[] = []

  for (let month = firstMonth; month <= lastMonth; month = nextMonth(month)) {
    rows.push({
      mes: monthLabel(month),
      capital: inCurrency
        .filter((investment) => monthOf(investment.purchasedOn) <= month)
        .reduce((total, investment) => total + investment.investedAmount, 0),
    })
  }

  return rows
}

function allocationByType(investments: InvestmentDto[], currency: Currency): AllocationSlice[] {
  const valueByType = new Map<InvestmentType, number>()

  for (const investment of investments) {
    if (investment.currency === currency) {
      valueByType.set(investment.type, (valueByType.get(investment.type) ?? 0) + investment.currentValue)
    }
  }

  const total = Array.from(valueByType.values()).reduce((sum, value) => sum + value, 0)

  return Array.from(valueByType.entries())
    .map(([type, value]) => ({
      type,
      label: investmentTypeLabels[type],
      value,
      share: total === 0 ? 0 : (value / total) * 100,
      color: investmentTypeColors[type],
    }))
    .sort((first, second) => second.value - first.value)
}

function MoneyByCurrency({ totals }: { totals: TotalsByCurrency }) {
  const entries = Object.entries(totals) as [Currency, number][]

  if (entries.length === 0) {
    return <span>{formatMoney(0, "ARS")}</span>
  }

  return (
    <div className="space-y-1">
      {entries.map(([currency, amount], index) => (
        <div key={currency} className={index === 0 ? undefined : "text-base text-muted-foreground"}>
          {formatMoney(amount, currency)}
        </div>
      ))}
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
  const [investments, setInvestments] = useState<InvestmentDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingInvestment, setEditingInvestment] = useState<InvestmentDto | null>(null)
  const [investmentToDelete, setInvestmentToDelete] = useState<InvestmentDto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [capitalCurrency, setCapitalCurrency] = useState<Currency | "">("")
  const [allocationCurrency, setAllocationCurrency] = useState<Currency | "">("")
  const router = useRouter()

  useEffect(() => {
    const controller = new AbortController()

    listInvestments(controller.signal)
      .then(setInvestments)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        toastApiError(error, "No se pudieron cargar tus inversiones.")
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [])

  const handleAdd = async (payload: CreateInvestmentPayload) => {
    const created = await createInvestment(payload)
    setInvestments((current) => sortByPurchase([created, ...current]))
    toast.success(`Inversión "${created.assetName}" registrada`)
  }

  const handleSubmit = async (payload: CreateInvestmentPayload) => {
    if (!editingInvestment) {
      await handleAdd(payload)
      return
    }

    const updated = await updateInvestment(editingInvestment.id, payload)
    setInvestments((current) =>
      sortByPurchase(current.map((investment) => (investment.id === updated.id ? updated : investment))),
    )
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
      setInvestments((current) => current.filter((investment) => investment.id !== investmentToDelete.id))
      toast.success(`Inversión "${investmentToDelete.assetName}" eliminada`)
      setInvestmentToDelete(null)
    } catch (error) {
      toastApiError(error, "No se pudo eliminar la inversión.")
    } finally {
      setIsDeleting(false)
    }
  }

  const currentValueByCurrency = sumByCurrency(investments, (investment) => investment.currentValue)
  const investedByCurrency = sumByCurrency(investments, (investment) => investment.investedAmount)
  const returnByCurrency = sumByCurrency(investments, (investment) => investment.returnAmount)
  const currencies = Object.keys(investedByCurrency) as Currency[]
  const lastPurchase = investments[0]
  const latestValuedOn = investments.map((investment) => investment.valuedOn).sort().at(-1)
  const emptyHint = isLoading ? "Cargando..." : "Todavía no registraste inversiones"

  const selectedCapitalCurrency = pickCurrency(currencies, capitalCurrency)
  const capitalByMonth = selectedCapitalCurrency ? investedCapitalByMonth(investments, selectedCapitalCurrency) : []
  const capitalChartConfig: ChartConfig = selectedCapitalCurrency
    ? { capital: { label: `Capital en ${selectedCapitalCurrency}`, color: currencyColors[selectedCapitalCurrency] } }
    : {}
  const selectedAllocationCurrency = pickCurrency(currencies, allocationCurrency)
  const allocation = selectedAllocationCurrency ? allocationByType(investments, selectedAllocationCurrency) : []
  const allocationChartConfig: ChartConfig = Object.fromEntries(
    allocation.map((slice) => [slice.label, { label: slice.label, color: slice.color }]),
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
              <MoneyByCurrency totals={currentValueByCurrency} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {latestValuedOn ? `Valuado al ${formatDate(latestValuedOn)}` : emptyHint}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Invertido</CardDescription>
            <CardTitle className="text-2xl">
              <MoneyByCurrency totals={investedByCurrency} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {investments.length} {investments.length === 1 ? "activo" : "activos"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rendimiento</CardDescription>
            <CardTitle className="text-2xl">
              {currencies.length === 0 ? (
                <span>{formatMoney(0, "ARS")}</span>
              ) : (
                <div className="space-y-1">
                  {currencies.map((currency, index) => {
                    const gain = returnByCurrency[currency] ?? 0

                    return (
                      <div
                        key={currency}
                        className={`${index === 0 ? "" : "text-base"} ${gain >= 0 ? "text-success" : "text-destructive"}`}
                      >
                        {formatSignedMoney(gain, currency)}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {currencies.length === 0 && <p className="text-sm text-muted-foreground">{emptyHint}</p>}
            {currencies.map((currency) => {
              const gain = returnByCurrency[currency] ?? 0
              const invested = investedByCurrency[currency] ?? 0
              const gainPercent = invested === 0 ? 0 : (gain / invested) * 100

              return (
                <div
                  key={currency}
                  className={`flex items-center gap-1 text-sm ${gain >= 0 ? "text-success" : "text-destructive"}`}
                >
                  {gain >= 0 ? <TrendingUpIcon className="size-4" /> : <TrendingDownIcon className="size-4" />}
                  <span>
                    {formatPercentage(gainPercent)} en {currency}
                  </span>
                </div>
              )
            })}
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
              <CardTitle>Evolución del Capital Invertido</CardTitle>
              <CardDescription>Cuánto capital fuiste acumulando en tu portafolio, mes a mes</CardDescription>
              {selectedCapitalCurrency && (
                <CurrencyPicker currencies={currencies} value={selectedCapitalCurrency} onChange={setCapitalCurrency} />
              )}
            </CardHeader>
            <CardContent>
              {capitalByMonth.length === 0 ? (
                <p className="text-sm text-muted-foreground">{emptyHint}</p>
              ) : (
                <ChartContainer config={capitalChartConfig} className="h-[300px] w-full">
                  <LineChart data={capitalByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} cursor={{ stroke: "rgba(0, 0, 0, 0.2)" }} />
                    <Line type="monotone" dataKey="capital" stroke="var(--color-capital)" strokeWidth={2} />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribución por Tipo de Activo</CardTitle>
              <CardDescription>Cómo se reparte tu portafolio según el valor actual de cada activo</CardDescription>
              {selectedAllocationCurrency && (
                <CurrencyPicker
                  currencies={currencies}
                  value={selectedAllocationCurrency}
                  onChange={setAllocationCurrency}
                />
              )}
            </CardHeader>
            <CardContent>
              {allocation.length === 0 || !selectedAllocationCurrency ? (
                <p className="text-sm text-muted-foreground">{emptyHint}</p>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <ChartContainer config={allocationChartConfig} className="h-[250px] w-full">
                    <PieChart>
                      <Pie
                        data={allocation}
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
                        {allocation.map((slice) => (
                          <Cell key={slice.type} fill={slice.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent hideLabel indicator="dot" />} cursor={false} />
                    </PieChart>
                  </ChartContainer>

                  <div className="flex flex-col justify-center gap-3">
                    {allocation.map((slice) => (
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
          <Table>
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
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Cargando tus inversiones...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && investments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Todavía no registraste ninguna inversión. Agregá la primera con el botón de arriba.
                  </TableCell>
                </TableRow>
              )}
              {investments.map((investment) => (
                <TableRow key={investment.id}>
                  <TableCell className="font-medium">{investment.assetName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {investmentTypeLabels[investment.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(investment.purchasedOn)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatMoney(investment.investedAmount, investment.currency)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatMoney(investment.currentValue, investment.currency)}
                  </TableCell>
                  <TableCell className="text-right">
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
        </CardContent>
      </Card>
    </div>
  )
}
