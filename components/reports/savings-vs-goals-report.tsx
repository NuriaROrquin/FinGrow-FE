"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
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
import { formatDateInput, formatPeriodLabel } from "@/components/period-filter"
import type { SavingsVsGoalsDto } from "@/lib/api"
import type { Currency } from "@/lib/api/transactions"
import { formatMoney } from "@/lib/format"
import { useMessages } from "@/lib/i18n"
import { useIsReportExport } from "./report-export-context"

const currencies: Currency[] = ["ARS", "USD", "EUR", "BRL"]

const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

const chartConfig = {
  committed: { label: "Objetivo", color: "#c084fc" },
  contributed: { label: "Aportado", color: "#a78bfa" },
} satisfies ChartConfig

function toMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`
}

function shownPeriodNote(
  report: SavingsVsGoalsDto | null,
  dateFrom: string,
  dateTo: string,
  periodNote: (count: number, range: string) => string,
): string | null {
  const first = report?.months[0]
  const last = report?.months.at(-1)
  if (!report || !first || !last) return null

  const followsPeriod =
    toMonthKey(first.year, first.month) === dateFrom.slice(0, 7) && toMonthKey(last.year, last.month) === dateTo.slice(0, 7)
  if (followsPeriod) return null

  const range = formatPeriodLabel(
    formatDateInput(new Date(first.year, first.month - 1, 1)),
    formatDateInput(new Date(last.year, last.month - 1, 1)),
  )
  return periodNote(report.months.length, range)
}

interface SavingsVsGoalsReportProps {
  report: SavingsVsGoalsDto | null
  isLoading: boolean
  currency: Currency
  onCurrencyChange: (currency: Currency) => void
  dateFrom: string
  dateTo: string
}

export function SavingsVsGoalsReport({
  report,
  isLoading,
  currency,
  onCurrencyChange,
  dateFrom,
  dateTo,
}: SavingsVsGoalsReportProps) {
  const t = useMessages().savingsReport
  const isExport = useIsReportExport()
  const periodNote = shownPeriodNote(report, dateFrom, dateTo, t.periodNote)

  const spansSeveralYears = new Set(report?.months.map((month) => month.year)).size > 1
  const chartData =
    report?.months.map((month) => ({
      label: `${monthLabels[month.month - 1]}${spansSeveralYears ? ` ${String(month.year).slice(2)}` : ""}`,
      committed: month.committed,
      contributed: month.contributed,
    })) ?? []

  const successRate =
    report && report.monthsWithCommitment > 0 ? (report.monthsOnTarget / report.monthsWithCommitment) * 100 : null

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Rendimiento de Ahorros</CardTitle>
            <CardDescription>Lo que tus metas te pedían aportar cada mes vs lo que aportaste</CardDescription>
          </div>
          {isExport ? (
            <Badge variant="outline">{currency}</Badge>
          ) : (
            <Select value={currency} onValueChange={(value) => onCurrencyChange(value as Currency)}>
              <SelectTrigger className="w-[100px]" aria-label="Moneda del reporte">
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
          )}
        </CardHeader>
        <CardContent>
          {isLoading && !report ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <>
              {periodNote && (
                <p className="mb-4 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">{periodNote}</p>
              )}
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
                    isAnimationActive={!isExport}
                  />
                  <Line
                    type="monotone"
                    dataKey="contributed"
                    stroke="var(--color-contributed)"
                    strokeWidth={2}
                    isAnimationActive={!isExport}
                  />
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
              {report && report.monthsWithCommitment > 0 ? `${report.monthsOnTarget}/${report.monthsWithCommitment}` : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {successRate !== null
                ? `${successRate.toFixed(0)}% de éxito`
                : report?.hasGoals
                  ? "El mes en curso cuenta cuando llegues a la cuota"
                  : "Sin metas en el período"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aportado vs Objetivo</CardDescription>
            <CardTitle className="text-2xl">{report ? formatMoney(report.totalContributed, currency) : "—"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Objetivo: {report ? formatMoney(report.totalCommitted, currency) : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cumplimiento</CardDescription>
            <CardTitle className="text-2xl text-success">
              {report?.completionRate != null ? `${report.completionRate}%` : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {report?.completionRate != null ? "Del objetivo del período" : "Sin metas en el período"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
