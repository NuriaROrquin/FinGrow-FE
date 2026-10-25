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
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { EmptyContent } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  createTransaction,
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
import { GoalForm } from "@/components/goals/goal-form"
import { AddTransactionForm } from "@/components/transactions/add-transaction-form"
import { PeriodFilter, getCurrentMonthStart, getToday } from "@/components/period-filter"
import { formatDateText, formatMoney, formatNumber, formatSignedPercentage } from "@/lib/format"
import { useMessages, type Messages } from "@/lib/i18n"
import { usePreferences } from "@/lib/preferences-context"
import { OtherCurrencyNotice } from "@/components/transactions/other-currency-notice"

const categoryColors = ["#3b5998", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#ef4444", "#14b8a6"]

function formatMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number)
  if (!year || !monthNumber || monthNumber < 1 || monthNumber > 12) return month

  return formatDateText(new Date(year, monthNumber - 1, 1), { month: "short" }).replace(".", "")
}

function getCategoryLabel(category: string, categoryLabels: Record<string, string>): string {
  return categoryLabels[category] ?? category
}

function toCategoryChartData(items: ExpenseCategoryTotalDto[], labels: Messages["labels"]) {
  return items.map((item, index) => ({
    name: getCategoryLabel(item.category, labels.expenseCategories),
    value: item.totalExpense,
    color: categoryColors[index % categoryColors.length],
  }))
}

function formatCurrency(value: number, currency: Currency): string {
  return formatMoney(value, currency)
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
  const messages = useMessages()
  const t = messages.dashboard
  const [openTransaction, setOpenTransaction] = useState(false)
  const [openSavings, setOpenSavings] = useState(false)
  const [recentTransactions, setRecentTransactions] = useState<TransactionDto[]>([])
  const [recentTransactionsRefreshKey, setRecentTransactionsRefreshKey] = useState(0)
  const [monthlySpendingData, setMonthlySpendingData] = useState<{ month: string; amount: number }[]>([])
  const [incomeVsExpenseData, setIncomeVsExpenseData] = useState<{ month: string; income: number; expense: number }[]>([])
  const [categoryItems, setCategoryItems] = useState<ExpenseCategoryTotalDto[]>([])
  const categoryData = toCategoryChartData(categoryItems, messages.labels)
  const [isLoadingCharts, setIsLoadingCharts] = useState(true)
  const [chartsError, setChartsError] = useState<string | null>(null)
  const [chartsRefreshKey, setChartsRefreshKey] = useState(0)
  const { preferences } = usePreferences()
  // El resumen solo se calcula en pesos o dólares: otra moneda preferida arranca en pesos.
  const [currency, setCurrency] = useState<"ARS" | "USD">(preferences.currency === "USD" ? "USD" : "ARS")
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummaryDto | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(true)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState(() => getCurrentMonthStart())
  const [dateTo, setDateTo] = useState(() => getToday())
  const [summaryRefreshKey, setSummaryRefreshKey] = useState(0)

  const chartConfig = {
    amount: { label: t.chartAmount, color: "#8b5cf6" },
    income: { label: t.chartIncome, color: "#a78bfa" },
    expense: { label: t.chartExpenses, color: "#8b5cf6" },
  }
  const categoryChartConfig = { value: { label: t.chartExpenses, color: "#8b5cf6" } }

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
        setSummaryError(error instanceof Error ? error.message : t.summaryLoadFailed)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingSummary(false)
      })

    return () => controller.abort()
  }, [currency, dateFrom, dateTo, summaryRefreshKey, t])

  useEffect(() => {
    listTransactions(1, 5)
      .then((response) => {
        setRecentTransactions(response.items.slice(0, 5))
      })
      .catch((error: unknown) => {
        toast({
          title: t.recentLoadFailed,
          description: error instanceof Error ? error.message : t.tryAgainShortly,
          variant: "destructive",
        })
      })
  }, [recentTransactionsRefreshKey, toast, t])

  useEffect(() => {
    const controller = new AbortController()
    setIsLoadingCharts(true)
    setChartsError(null)
    setMonthlySpendingData([])
    setIncomeVsExpenseData([])
    setCategoryItems([])

    Promise.all([
      getMonthlyExpenses({ currency, dateTo, signal: controller.signal }),
      getIncomeVsExpenses({ currency, dateTo, signal: controller.signal }),
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
        setCategoryItems(expensesByCategory.items.filter((item) => item.totalExpense > 0))
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return

        setChartsError(error instanceof Error ? error.message : t.chartsLoadFailed)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingCharts(false)
      })

    return () => controller.abort()
  }, [chartsRefreshKey, currency, dateFrom, dateTo, t])

  const formatRelativeDate = (value: string) => {
    const transactionDate = new Date(value)
    if (Number.isNaN(transactionDate.getTime())) return t.invalidDate

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

    if (diffInDays === 0) return t.today
    if (diffInDays === 1) return t.yesterday
    if (diffInDays > 1) return t.daysAgo(diffInDays)

    return t.inDays(Math.abs(diffInDays))
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">{t.title}</h1>
        <p className="text-muted-foreground mt-1">{t.subtitle}</p>
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
            <TabsTrigger value="ARS">{t.currencyArs}</TabsTrigger>
            <TabsTrigger value="USD">{t.currencyUsd}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <OtherCurrencyNotice currencies={dashboardSummary?.otherCurrencies ?? []} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.balance}</CardDescription>
            <CardTitle className="text-2xl">
              {isLoadingSummary ? <Skeleton className="h-8 w-36" /> : formatMetric(dashboardSummary?.balance)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t.balanceHint}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.income}</CardDescription>
            <CardTitle className="text-2xl">
              {isLoadingSummary ? <Skeleton className="h-8 w-36" /> : formatMetric(dashboardSummary?.income)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t.inSelectedPeriod}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.expenses}</CardDescription>
            <CardTitle className="text-2xl">
              {isLoadingSummary ? <Skeleton className="h-8 w-36" /> : formatMetric(dashboardSummary?.expenses === null || dashboardSummary?.expenses === undefined ? null : -dashboardSummary.expenses)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t.inSelectedPeriod}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.savingsRate}</CardDescription>
            <CardTitle className="text-2xl">
              {isLoadingSummary ? <Skeleton className="h-8 w-24" /> : dashboardSummary?.savingsRate === null || dashboardSummary?.savingsRate === undefined ? "—" : `${formatNumber(dashboardSummary.savingsRate, { maximumFractionDigits: 2 })}%`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {savingsRateVariation === null
                ? t.noVariation
                : t.vsPreviousPeriod(formatSignedPercentage(savingsRateVariation))}
            </p>
          </CardContent>
        </Card>
      </div>

      {summaryError && (
        <div className="flex items-center justify-between gap-4 rounded-md border border-destructive/30 p-3 text-sm">
          <span className="text-destructive">{summaryError}</span>
          <Button variant="outline" size="sm" onClick={() => setSummaryRefreshKey((current) => current + 1)}>
            {t.retry}
          </Button>
        </div>
      )}

      {!isLoadingSummary && !summaryError && dashboardSummary && !dashboardSummary.hasMovements && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>{t.noMovementsTitle}</EmptyTitle>
            <EmptyDescription>{t.noMovementsDescription}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setOpenTransaction(true)}>
              <PlusIcon className="size-4" />
              {t.firstMovement}
            </Button>
          </EmptyContent>
        </Empty>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t.quickActions}</CardTitle>
          <CardDescription>{t.quickActionsDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Dialog open={openTransaction} onOpenChange={setOpenTransaction}>
              <DialogTrigger asChild>
                <Button className="h-auto flex-col gap-2 py-4">
                  <PlusIcon className="size-5" />
                  <span>{t.addTransaction}</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.newTransaction}</DialogTitle>
                  <DialogDescription>{t.newTransactionDescription}</DialogDescription>
                </DialogHeader>
                <AddTransactionForm
                  onSubmit={async (payload) => {
                    await createTransaction(payload)
                    refreshRecentTransactions()
                    toast({
                      title: t.transactionSaved,
                      description: t.transactionSavedDescription,
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
              <span>{t.viewBudgets}</span>
            </Button>

            <Dialog open={openSavings} onOpenChange={setOpenSavings}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent">
                  <PiggyBankIcon className="size-5" />
                  <span>{t.createGoal}</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.createGoal}</DialogTitle>
                  <DialogDescription>{t.createGoalDescription}</DialogDescription>
                </DialogHeader>
                <GoalForm onClose={() => setOpenSavings(false)} />
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 bg-transparent"
              onClick={() => router.push("/dashboard/investments")}
            >
              <TrendingUpIcon className="size-5" />
              <span>{t.trackInvestments}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="spending" className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <TabsList>
            <TabsTrigger value="spending">{t.tabSpending}</TabsTrigger>
            <TabsTrigger value="income-expense">{t.tabIncomeExpense}</TabsTrigger>
            <TabsTrigger value="categories">{t.tabCategories}</TabsTrigger>
          </TabsList>

        </div>

        {isLoadingCharts && <p className="text-sm text-muted-foreground">{t.loadingCharts}</p>}
        {chartsError && (
          <div className="flex items-center justify-between gap-4 rounded-md border border-destructive/30 p-3 text-sm">
            <span className="text-destructive">{chartsError}</span>
            <Button variant="outline" size="sm" onClick={() => setChartsRefreshKey((current) => current + 1)}>
              {t.retry}
            </Button>
          </div>
        )}

        <TabsContent value="spending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.monthlyExpensesTitle}</CardTitle>
              <CardDescription>{t.monthlyExpensesDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              {!hasMonthlySpendingData && !isLoadingCharts ? (
                <ChartEmptyState
                  title={t.monthlyExpensesEmptyTitle}
                  description={t.monthlyExpensesEmpty(currency)}
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
              <CardTitle>{t.incomeVsExpensesTitle}</CardTitle>
              <CardDescription>{t.incomeVsExpensesDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              {!hasIncomeVsExpenseData && !isLoadingCharts ? (
                <ChartEmptyState
                  title={t.incomeVsExpensesEmptyTitle}
                  description={t.incomeVsExpensesEmpty(currency)}
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
              <CardTitle>{t.byCategoryTitle}</CardTitle>
              <CardDescription>{t.byCategoryDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData.length === 0 && !isLoadingCharts ? (
                <ChartEmptyState
                  title={t.byCategoryEmptyTitle}
                  description={t.byCategoryEmpty(currency)}
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
          <CardTitle>{t.recentTitle}</CardTitle>
          <CardDescription>{t.recentDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.recentEmpty}</p>
            ) : (
              recentTransactions.map((transaction) => {
                const isIncome = transaction.type === "Income"
                const transactionDate = formatRelativeDate(transaction.occurredOn)
                const categoryLabels = isIncome ? messages.labels.incomeCategories : messages.labels.expenseCategories

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
                          {transactionDate} • {getCategoryLabel(transaction.category, categoryLabels)}
                        </p>
                      </div>
                    </div>
                    <span className={`font-semibold ${isIncome ? "text-success" : "text-foreground"}`}>
                      {isIncome ? "+" : "-"}{formatMoney(Math.abs(transaction.amount), transaction.currency)}
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
