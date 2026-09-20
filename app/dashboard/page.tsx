"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid } from "recharts"
import {
  ArrowUpIcon,
  ArrowDownIcon,
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
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { createTransaction, listTransactions, type TransactionDto } from "@/lib/api/transactions"
import { AddTransactionForm } from "@/components/transactions/add-transaction-form"

const monthlySpendingData = [
  { month: "Ene", amount: 240000 },
  { month: "Feb", amount: 139800 },
  { month: "Mar", amount: 380000 },
  { month: "Abr", amount: 390800 },
  { month: "May", amount: 480000 },
  { month: "Jun", amount: 380000 },
]

const incomeVsExpenseData = [
  { month: "Ene", income: 500000, expense: 240000 },
  { month: "Feb", income: 500000, expense: 139800 },
  { month: "Mar", income: 520000, expense: 380000 },
  { month: "Abr", income: 520000, expense: 390800 },
  { month: "May", income: 550000, expense: 480000 },
  { month: "Jun", income: 550000, expense: 380000 },
]

const categoryData = [
  { name: "Comida", value: 120000, color: "#3b5998" },
  { name: "Transporte", value: 80000, color: "#10b981" },
  { name: "Entretenimiento", value: 60000, color: "#f59e0b" },
  { name: "Servicios", value: 140000, color: "#8b5cf6" },
  { name: "Otros", value: 50000, color: "#ec4899" },
]

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
  Comida: {
    label: "Comida",
    color: "#3b5998",
  },
  Transporte: {
    label: "Transporte",
    color: "#10b981",
  },
  Entretenimiento: {
    label: "Entretenimiento",
    color: "#f59e0b",
  },
  Servicios: {
    label: "Servicios",
    color: "#8b5cf6",
  },
  Otros: {
    label: "Otros",
    color: "#ec4899",
  },
}

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [openTransaction, setOpenTransaction] = useState(false)
  const [openSavings, setOpenSavings] = useState(false)
  const [recentTransactions, setRecentTransactions] = useState<TransactionDto[]>([])
  const [recentTransactionsRefreshKey, setRecentTransactionsRefreshKey] = useState(0)

  const refreshRecentTransactions = () => setRecentTransactionsRefreshKey((current) => current + 1)

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">Resumen Financiero</h1>
        <p className="text-muted-foreground mt-1">Monitorea tu salud financiera y progreso</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Saldo Total</CardDescription>
            <CardTitle className="text-2xl">$1,245,000.00</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-success">
              <ArrowUpIcon className="size-4" />
              <span>+12.5% desde el mes pasado</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ingresos Mensuales</CardDescription>
            <CardTitle className="text-2xl">$550,000.00</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-success">
              <ArrowUpIcon className="size-4" />
              <span>+5.8% desde el mes pasado</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gastos Mensuales</CardDescription>
            <CardTitle className="text-2xl">$380,000.00</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-destructive">
              <ArrowDownIcon className="size-4" />
              <span>-2.3% desde el mes pasado</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tasa de Ahorro</CardDescription>
            <CardTitle className="text-2xl">31%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-success">
              <ArrowUpIcon className="size-4" />
              <span>+3.2% desde el mes pasado</span>
            </div>
          </CardContent>
        </Card>
      </div>

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
                  onAdd={async (payload) => {
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
        <TabsList>
          <TabsTrigger value="spending">Tendencias de Gasto</TabsTrigger>
          <TabsTrigger value="income-expense">Ingresos vs Gastos</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
        </TabsList>

        <TabsContent value="spending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gastos Mensuales</CardTitle>
              <CardDescription>Tus gastos durante los últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <BarChart data={monthlySpendingData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <YAxis
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
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
                      <span className="text-sm font-semibold">${category.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
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
