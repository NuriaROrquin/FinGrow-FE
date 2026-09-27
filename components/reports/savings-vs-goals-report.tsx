"use client"

import { useEffect, useState } from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { getSavingsVsGoals, toastApiError, type SavingsVsGoalsDto } from "@/lib/api"
import type { Currency } from "@/lib/api/transactions"

const currencies: Currency[] = ["ARS", "USD", "EUR", "BRL"]

const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

const chartConfig = {
  committed: { label: "Objetivo", color: "#c084fc" },
  actualSavings: { label: "Ahorro real", color: "#a78bfa" },
} satisfies ChartConfig

function formatMoney(amount: number): string {
  return `$${amount.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`
}

export function SavingsVsGoalsReport({ months }: { months: number | null }) {
  const [currency, setCurrency] = useState<Currency>("ARS")
  const [report, setReport] = useState<SavingsVsGoalsDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)

    getSavingsVsGoals(currency, months, controller.signal)
      .then(setReport)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        toastApiError(error, "No se pudo cargar el reporte de ahorros.")
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [currency, months])

  const spansSeveralYears = new Set(report?.months.map((month) => month.year)).size > 1
  const chartData =
    report?.months.map((month) => ({
      label: `${monthLabels[month.month - 1]}${spansSeveralYears ? ` ${String(month.year).slice(2)}` : ""}`,
      committed: month.committed,
      actualSavings: month.actualSavings,
    })) ?? []

  const successRate =
    report && report.monthsWithCommitment > 0 ? (report.monthsOnTarget / report.monthsWithCommitment) * 100 : null

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Rendimiento de Ahorros</CardTitle>
            <CardDescription>Objetivo de tus metas vs ahorro real (ingresos − gastos) de cada mes</CardDescription>
          </div>
          <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
            <SelectTrigger className="w-[100px] no-print" aria-label="Moneda del reporte">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading && !report ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <>
              {report && !report.hasGoals && (
                <p className="mb-4 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                  No tenés metas de ahorro en {currency}, así que no hay un objetivo contra el cual comparar. Creá
                  una desde Presupuestos y Ahorros para ver la línea de objetivo.
                </p>
              )}
              <ChartContainer config={chartConfig} className="h-[400px] w-full">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} cursor={{ stroke: "rgba(0, 0, 0, 0.2)" }} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="committed"
                    stroke="var(--color-committed)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  <Line type="monotone" dataKey="actualSavings" stroke="var(--color-actualSavings)" strokeWidth={2} />
                </LineChart>
              </ChartContainer>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Meses Sobre el Objetivo</CardDescription>
            <CardTitle className="text-2xl text-success">
              {report ? `${report.monthsOnTarget}/${report.monthsWithCommitment}` : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {successRate === null ? "Sin metas en el período" : `${successRate.toFixed(0)}% de éxito`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Ahorrado vs Objetivo</CardDescription>
            <CardTitle className="text-2xl">{report ? formatMoney(report.totalActualSavings) : "—"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Objetivo: {report ? formatMoney(report.totalCommitted) : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tasa de Ahorro</CardDescription>
            <CardTitle className="text-2xl text-success">
              {report?.savingsRate != null ? `${report.savingsRate}%` : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {report?.savingsRate != null ? "Del ingreso total" : "Sin ingresos en el período"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
