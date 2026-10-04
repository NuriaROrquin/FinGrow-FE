"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid } from "recharts"
import {
  ArrowUpIcon,
  PlusIcon,
  TrendingUpIcon,
  WalletIcon,
  PiggyBankIcon,
  CreditCardIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { EmptyContent } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  createTransaction,
  expenseCategoryLabels,
  listTransactions,
  type Currency,
  type TransactionDto,
} from "@/lib/api/transactions"
import {
  getDashboardSummary,
  getExpensesByCategory,
  getIncomeVsExpenses,
  getMonthlyExpenses,
  type DashboardSummaryDto,
  type ExpenseCategoryTotalDto,
} from "@/lib/api"
import { AddTransactionForm } from "@/components/transactions/add-transaction-form"
import { PeriodFilter, getCurrentMonthStart, getToday } from "@/components/period-filter"

const categoryColors = ["#3b5998", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#ef4444", "#14b8a6"]

const chartConfig = {
  amount: {
    label: "Monto",
    color: "#8b5cf6",
  },
  income: {
    label: "Ingresos",
    color: "#a78bfa",
  },
  expense: {
    label: "Gastos",
    color: "#8b5cf6",
  },
}

const categoryChartConfig = {
  value: {
    label: "Gastos",
    color: "#8b5cf6",
  },
}

function formatMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number)
  if (!year || !monthNumber || monthNumber < 1 || monthNumber > 12) return month

  return new Intl.DateTimeFormat("es-AR", { month: "short" })
    .format(new Date(year, monthNumber - 1, 1))
    .replace(".", "")
}

function getCategoryLabel(category: string): string {
  return expenseCategoryLabels[category as keyof typeof expenseCategoryLabels] ?? category
}

function toCategoryChartData(items: ExpenseCategoryTotalDto[]) {
  return items.map((item, index) => ({
    name: getCategoryLabel(item.category),
    value: item.totalExpense,
    color: categoryColors[index % categoryColors.length],
  }))
}

function formatCurrency(value: number, currency: Currency): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency }).format(value)
}

function ChartEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Empty className="min-h-[300px] border">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [openTransaction, setOpenTransaction] = useState(false)
  const [openSavings, setOpenSavings] = useState(false)
  const [recentTransactions, setRecentTransactions] = useState<TransactionDto[]>([])
  const [recentTransactionsRefreshKey, setRecentTransactionsRefreshKey] = useState(0)
  const [monthlySpendingData, setMonthlySpendingData] = useState<{ month: string; amount: number }[]>([])
  const [incomeVsExpenseData, setIncomeVsExpenseData] = useState<{ month: string; income: number; expense: number }[]>([])
  const [categoryData, setCategoryData] = useState<{ name: string; value: number; color: string }[]>([])
  const [isLoadingCharts, setIsLoadingCharts] = useState(true)
  const [chartsError, setChartsError] = useState<string | null>(null)
  const [chartsRefreshKey, setChartsRefreshKey] = useState(0)
  const [currency, setCurrency] = useState<"ARS" | "USD">("ARS")
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummaryDto | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(true)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState(() => getCurrentMonthStart())
  const [dateTo, setDateTo] = useState(() => getToday())
  const [summaryRefreshKey, setSummaryRefreshKey] = useState(0)

  const refreshRecentTransactions = () => {
    setRecentTransactionsRefreshKey((current) => current + 1)
    setChartsRefreshKey((current) => current + 1)
  }

  useEffect(() => {
    const controller = new AbortController()

    setIsLoadingSummary(true)
    setSummaryError(null)

    getDashboardSummary({
      currency,
      dateFrom,
      dateTo,
      signal: controller.signal,
    })
      .then(setDashboardSummary)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setDashboardSummary(null)
        setSummaryError(error instanceof Error ? error.message : "No se pudo cargar el resumen financiero.")
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingSummary(false)
      })

    return () => controller.abort()
  }, [currency, dateFrom, dateTo, summaryRefreshKey])

  useEffect(() => {
    listTransactions(1, 5)
      .then((response) => {
        setRecentTransactions(response.items.slice(0, 5))
      })
      .catch((error: unknown) => {
        toast({
          title: "No se pudo cargar las transacciones recientes",
          description: error instanceof Error ? error.message : "Intenta de nuevo en unos segundos.",
          variant: "destructive",
        })
      })
  }, [recentTransactionsRefreshKey, toast])

  useEffect(() => {
    const controller = new AbortController()
    setIsLoadingCharts(true)
    setChartsError(null)
    setMonthlySpendingData([])
    setIncomeVsExpenseData([])
    setCategoryData([])

    Promise.all([
      getMonthlyExpenses({ currency, signal: controller.signal }),
      getIncomeVsExpenses({ currency, signal: controller.signal }),
      getExpensesByCategory({ dateFrom, dateTo, currency, signal: controller.signal }),
    ])
      .then(([monthlyExpenses, incomeVsExpenses, expensesByCategory]) => {
        setMonthlySpendingData(
          monthlyExpenses.items.map((item) => ({ month: formatMonth(item.month), amount: item.totalExpense })),
        )
        setIncomeVsExpenseData(
          incomeVsExpenses.items.map((item) => ({
            month: formatMonth(item.month),
            income: item.totalIncome,
            expense: item.totalExpense,
          })),
        )
        setCategoryData(toCategoryChartData(expensesByCategory.items.filter((item) => item.totalExpense > 0)))
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return

        setChartsError(error instanceof Error ? error.message : "No se pudieron cargar los datos de los gráficos.")
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingCharts(false)
      })

    return () => controller.abort()
  }, [chartsRefreshKey, currency, dateFrom, dateTo])

  const formatRelativeDate = (value: string) => {
    const transactionDate = new Date(value)
    if (Number.isNaN(transactionDate.getTime())) return "Fecha inválida"

    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const startOfTransactionDate = new Date(
      transactionDate.getFullYear(),
      transactionDate.getMonth(),
      transactionDate.getDate(),
    )

    const diffInDays = Math.round(
      (startOfToday.getTime() - startOfTransactionDate.getTime()) / (1000 * 60 * 60 * 24),
    )

    if (diffInDays === 0) return "Hoy"
    if (diffInDays === 1) return "Ayer"
    if (diffInDays > 1) return `Hace ${diffInDays} días`

    return `En ${Math.abs(diffInDays)} días`
  }

  const hasMonthlySpendingData = monthlySpendingData.some((entry) => entry.amount > 0)
  const hasIncomeVsExpenseData = incomeVsExpenseData.some((entry) => entry.income > 0 || entry.expense > 0)
  const formatMetric = (value: number | null | undefined) =>
    value === null || value === undefined ? "—" : formatCurrency(value, dashboardSummary?.currency ?? currency)
  const savingsRateVariation =
    dashboardSummary?.savingsRate !== null &&
    dashboardSummary?.savingsRate !== undefined &&
    dashboardSummary.previousPeriodSavingsRate !== null &&
    dashboardSummary.previousPeriodSavingsRate !== undefined &&
    dashboardSummary.previousPeriodSavingsRate !== 0
      ? ((dashboardSummary.savingsRate - dashboardSummary.previousPeriodSavingsRate) /
          Math.abs(dashboardSummary.previousPeriodSavingsRate)) *
        100
      : null

  const formatPercentageVariation = (value: number | null) => {
    if (value === null) return null
    const sign = value > 0 ? "+" : ""
    return `${sign}${value.toFixed(2)}%`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">Resumen Financiero</h1>
        <p className="text-muted-foreground mt-1">Monitorea tu salud financiera y progreso</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PeriodFilter
          dateFrom={dateFrom}
          dateTo={dateTo}
          onChange={({ dateFrom: nextDateFrom, dateTo: nextDateTo }) => {
            setDateFrom(nextDateFrom)
            setDateTo(nextDateTo)
          }}
        />
        <Tabs value={currency} onValueChange={(value) => setCurrency(value as "ARS" | "USD")} className="w-fit">
          <TabsList>
            <TabsTrigger value="ARS">Pesos (ARS)</TabsTrigger>
            <TabsTrigger value="USD">Dólares (USD)</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Saldo Total</CardDescription>
            <CardTitle className="text-2xl">
              {isLoadingSummary ? <Skeleton className="h-8 w-36" /> : formatMetric(dashboardSummary?.balance)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Saldo acumulado hasta el período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ingresos Mensuales</CardDescription>
            <CardTitle className="text-2xl">
              {isLoadingSummary ? <Skeleton className="h-8 w-36" /> : formatMetric(dashboardSummary?.income)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">En el período seleccionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gastos Mensuales</CardDescription>
            <CardTitle className="text-2xl">
              {isLoadingSummary ? <Skeleton className="h-8 w-36" /> : formatMetric(dashboardSummary?.expenses === null || dashboardSummary?.expenses === undefined ? null : -dashboardSummary.expenses)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">En el período seleccionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tasa de Ahorro</CardDescription>
            <CardTitle className="text-2xl">
              {isLoadingSummary ? <Skeleton className="h-8 w-24" /> : dashboardSummary?.savingsRate === null || dashboardSummary?.savingsRate === undefined ? "—" : `${dashboardSummary.savingsRate}%`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {savingsRateVariation === null
                ? "Sin variación calculable"
                : `${formatPercentageVariation(savingsRateVariation)} vs período anterior`}
            </p>
          </CardContent>
        </Card>
      </div>

      {summaryError && (
        <div className="flex items-center justify-between gap-4 rounded-md border border-destructive/30 p-3 text-sm">
          <span className="text-destructive">{summaryError}</span>
          <Button variant="outline" size="sm" onClick={() => setSummaryRefreshKey((current) => current + 1)}>
            Reintentar
          </Button>
        </div>
      )}

      {!isLoadingSummary && !summaryError && dashboardSummary && !dashboardSummary.hasMovements && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Todavía no hay movimientos</EmptyTitle>
            <EmptyDescription>Cargá tu primer ingreso o gasto para ver tu resumen financiero.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setOpenTransaction(true)}>
              <PlusIcon className="size-4" />
              Cargar primer movimiento
            </Button>
          </EmptyContent>
        </Empty>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Gestiona tus finanzas rápidamente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Dialog open={openTransaction} onOpenChange={setOpenTransaction}>
              <DialogTrigger asChild>
                <Button className="h-auto flex-col gap-2 py-4">
                  <PlusIcon className="size-5" />
                  <span>Agregar Transacción</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva Transacción</DialogTitle>
                  <DialogDescription>Registra un nuevo ingreso o gasto</DialogDescription>
                </DialogHeader>
                <AddTransactionForm
                  onSubmit={async (payload) => {
                    await createTransaction(payload)
                    refreshRecentTransactions()
                    toast({
                      title: "Transacción guardada",
                      description: "La transacción ha sido agregada exitosamente",
                    })
                  }}
                  onClose={() => setOpenTransaction(false)}
                />
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 bg-transparent"
              onClick={() => router.push("/dashboard/budgets")}
            >
              <WalletIcon className="size-5" />
              <span>Ver Presupuestos</span>
            </Button>

            <Dialog open={openSavings} onOpenChange={setOpenSavings}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent">
                  <PiggyBankIcon className="size-5" />
                  <span>Crear Meta de Ahorro</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva Meta de Ahorro</DialogTitle>
                  <DialogDescription>Define tu objetivo de ahorro</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="goal-name">Nombre de la Meta</Label>
                    <Input id="goal-name" placeholder="Ej: Vacaciones" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal-amount">Monto Objetivo</Label>
                    <Input id="goal-amount" type="number" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal-current">Monto Actual</Label>
                    <Input id="goal-current" type="number" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal-deadline">Fecha Límite</Label>
                    <Input id="goal-deadline" type="date" />
                  </div>
                  <Button className="w-full" onClick={() => setOpenSavings(false)}>
                    Crear Meta
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 bg-transparent"
              onClick={() => router.push("/dashboard/investments")}
            >
              <TrendingUpIcon className="size-5" />
              <span>Seguir Inversiones</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="spending" className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <TabsList>
            <TabsTrigger value="spending">Tendencias de Gasto</TabsTrigger>
            <TabsTrigger value="income-expense">Ingresos vs Gastos</TabsTrigger>
            <TabsTrigger value="categories">Categorías</TabsTrigger>
          </TabsList>

        </div>

        {isLoadingCharts && <p className="text-sm text-muted-foreground">Cargando datos de los gráficos...</p>}
        {chartsError && (
          <div className="flex items-center justify-between gap-4 rounded-md border border-destructive/30 p-3 text-sm">
            <span className="text-destructive">{chartsError}</span>
            <Button variant="outline" size="sm" onClick={() => setChartsRefreshKey((current) => current + 1)}>
              Reintentar
            </Button>
          </div>
        )}

        <TabsContent value="spending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gastos Mensuales</CardTitle>
              <CardDescription>Tus gastos durante los últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              {!hasMonthlySpendingData && !isLoadingCharts ? (
                <ChartEmptyState
                  title="Todavía no hay gastos mensuales"
                  description={`Este gráfico mostrará tus gastos confirmados en ${currency} durante los últimos seis meses.`}
                />
              ) : (
                <ChartContainer config={chartConfig} className="h-[350px] w-full">
                  <BarChart data={monthlySpendingData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      axisLine={{ stroke: "#e5e7eb" }}
                    />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      cursor={{ fill: "rgba(139, 92, 246, 0.1)" }}
                    />
                    <Bar
                      dataKey="amount"
                      fill="#8b5cf6"
                      radius={[8, 8, 0, 0]}
                      animationDuration={800}
                      animationBegin={0}
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income-expense" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos vs Gastos</CardTitle>
              <CardDescription>Compara tus ingresos y gastos a lo largo del tiempo</CardDescription>
            </CardHeader>
            <CardContent>
              {!hasIncomeVsExpenseData && !isLoadingCharts ? (
                <ChartEmptyState
                  title="Todavía no hay ingresos o gastos"
                  description={`Este gráfico comparará tus movimientos confirmados en ${currency} por mes.`}
                />
              ) : (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <LineChart data={incomeVsExpenseData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} cursor={{ stroke: "rgba(0, 0, 0, 0.2)" }} />
                    <Line type="monotone" dataKey="income" stroke="#a78bfa" strokeWidth={2} />
                    <Line type="monotone" dataKey="expense" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gastos por Categoría</CardTitle>
              <CardDescription>Desglose de tus gastos por categoría</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData.length === 0 && !isLoadingCharts ? (
                <ChartEmptyState
                  title="Todavía no hay gastos por categoría"
                  description={`Este gráfico mostrará cómo se distribuyen tus gastos confirmados en ${currency}.`}
                />
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <ChartContainer config={categoryChartConfig} className="h-[300px] w-full">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: { name?: string; percent?: number }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent hideLabel indicator="dot" />} cursor={false} />
                    </PieChart>
                  </ChartContainer>

                  <div className="flex flex-col justify-center gap-3">
                    {categoryData.map((category) => (
                      <div key={category.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="size-3 rounded-full" style={{ backgroundColor: category.color }} />
                          <span className="text-sm font-medium">{category.name}</span>
                        </div>
                        <span className="text-sm font-semibold">{formatCurrency(category.value, currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
          <CardDescription>Tus últimas actividades financieras</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay transacciones recientes.</p>
            ) : (
              recentTransactions.map((transaction) => {
                const isIncome = transaction.type === "Income"
                const transactionDate = formatRelativeDate(transaction.occurredOn)

                return (
                  <div key={transaction.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-10 items-center justify-center rounded-full ${isIncome ? "bg-success/10 text-success" : "bg-muted"}`}
                      >
                        {isIncome ? <ArrowUpIcon className="size-5" /> : <CreditCardIcon className="size-5" />}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {transactionDate} • {transaction.category}
                        </p>
                      </div>
                    </div>
                    <span className={`font-semibold ${isIncome ? "text-success" : "text-foreground"}`}>
                      {isIncome ? "+" : "-"}${Math.abs(transaction.amount).toFixed(2)} {transaction.currency}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
