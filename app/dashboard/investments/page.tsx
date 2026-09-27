"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { toast } from "sonner"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid } from "recharts"
import { TrendingUpIcon, TrendingDownIcon, PlusIcon, ArrowUpIcon, ArrowDownIcon, LightbulbIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AddInvestmentForm } from "@/components/investments/add-investment-form"
import {
  createInvestment,
  investmentTypeLabels,
  listInvestments,
  toastApiError,
  type CreateInvestmentPayload,
  type InvestmentDto,
} from "@/lib/api"
import type { Currency } from "@/lib/api/transactions"

const performanceData = [
  { mes: "Ene", valor: 350000 },
  { mes: "Feb", valor: 362000 },
  { mes: "Mar", valor: 358000 },
  { mes: "Abr", valor: 375000 },
  { mes: "May", valor: 382000 },
  { mes: "Jun", valor: 435750.5 },
]

const allocationData = [
  { nombre: "Acciones", valor: 813500.5, color: "#3b5998" },
  { nombre: "ETFs", valor: 2226000, color: "#10b981" },
  { nombre: "Bonos", valor: 798000, color: "#f59e0b" },
  { nombre: "Fondos Comunes", valor: 520000, color: "#8b5cf6" },
]

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

const chartConfig = {
  valor: {
    label: "Valor del Portafolio",
    color: "#8b5cf6",
  },
}

const allocationChartConfig = {
  Acciones: {
    label: "Acciones",
    color: "#3b5998",
  },
  ETFs: {
    label: "ETFs",
    color: "#10b981",
  },
  Bonos: {
    label: "Bonos",
    color: "#f59e0b",
  },
  "Fondos Comunes": {
    label: "Fondos Comunes",
    color: "#8b5cf6",
  },
}

type TotalsByCurrency = Partial<Record<Currency, number>>

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

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<InvestmentDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
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

  const currentValueByCurrency = sumByCurrency(investments, (investment) => investment.currentValue)
  const investedByCurrency = sumByCurrency(investments, (investment) => investment.investedAmount)
  const returnByCurrency = sumByCurrency(investments, (investment) => investment.returnAmount)
  const currencies = Object.keys(investedByCurrency) as Currency[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Inversiones</h1>
          <p className="text-muted-foreground mt-1">Gestioná y seguí el rendimiento de tus inversiones</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="size-4" />
              Agregar Inversión
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nueva Inversión</DialogTitle>
              <DialogDescription>Registrá una nueva inversión en tu portafolio</DialogDescription>
            </DialogHeader>
            <AddInvestmentForm onAdd={handleAdd} onClose={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Valor Total del Portafolio</CardDescription>
            <CardTitle className="text-2xl">
              <MoneyByCurrency totals={currentValueByCurrency} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {currencies.length === 0 && (
              <p className="text-sm text-muted-foreground">Todavía no registraste inversiones</p>
            )}
            {currencies.map((currency) => {
              const gain = returnByCurrency[currency] ?? 0
              const invested = investedByCurrency[currency] ?? 0
              const gainPercent = invested === 0 ? 0 : (gain / invested) * 100

              return (
                <div
                  key={currency}
                  className={`flex items-center gap-1 text-sm ${gain >= 0 ? "text-success" : "text-destructive"}`}
                >
                  {gain >= 0 ? <ArrowUpIcon className="size-4" /> : <ArrowDownIcon className="size-4" />}
                  <span>
                    {formatSignedMoney(gain, currency)} ({formatPercentage(gainPercent)})
                  </span>
                </div>
              )
            })}
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
            <CardDescription>Cambio de Hoy</CardDescription>
            <CardTitle className="text-2xl text-success">+$342.50</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-success">
              <TrendingUpIcon className="size-4" />
              <span>+0.89%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Retorno Anual</CardDescription>
            <CardTitle className="text-2xl text-success">+12.4%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Año en curso</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento Histórico</CardTitle>
              <CardDescription>Evolución del valor de tu portafolio en los últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} cursor={{ stroke: "rgba(0, 0, 0, 0.2)" }} />
                  <Line type="monotone" dataKey="valor" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribución por Tipo de Activo</CardTitle>
              <CardDescription>Cómo está distribuido tu portafolio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <ChartContainer config={allocationChartConfig} className="h-[250px] w-full">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ nombre, percent }: { nombre?: string; percent?: number }) =>
                        `${nombre} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="valor"
                      nameKey="nombre"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent hideLabel indicator="dot" />} cursor={false} />
                  </PieChart>
                </ChartContainer>

                <div className="flex flex-col justify-center gap-3">
                  {allocationData.map((item) => (
                    <div key={item.nombre} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-medium">{item.nombre}</span>
                      </div>
                      <span className="text-sm font-semibold">${item.valor.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Cargando tus inversiones...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && investments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
