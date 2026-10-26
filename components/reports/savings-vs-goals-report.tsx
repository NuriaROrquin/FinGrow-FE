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
import { formatDateText, formatMoney, formatNumber } from "@/lib/format"
import { useMessages } from "@/lib/i18n"
import { useIsReportExport } from "./report-export-context"

const currencies: Currency[] = ["ARS", "USD", "EUR", "BRL"]

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
  const messages = useMessages()
  const t = messages.reports
  const isExport = useIsReportExport()
  const periodNote = shownPeriodNote(report, dateFrom, dateTo, messages.savingsReport.periodNote)
  const chartConfig = {
    committed: { label: t.committed, color: "#c084fc" },
    contributed: { label: t.contributed, color: "#a78bfa" },
  } satisfies ChartConfig

  const spansSeveralYears = new Set(report?.months.map((month) => month.year)).size > 1
  const chartData =
    report?.months.map((month) => ({
      label: formatDateText(
        new Date(month.year, month.month - 1, 1),
        spansSeveralYears ? { month: "short", year: "2-digit" } : { month: "short" },
      ),
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
            <CardTitle>{t.savingsTitle}</CardTitle>
            <CardDescription>{t.savingsDescription}</CardDescription>
          </div>
          {isExport ? (
            <Badge variant="outline">{currency}</Badge>
          ) : (
            <Select value={currency} onValueChange={(value) => onCurrencyChange(value as Currency)}>
              <SelectTrigger className="w-[100px]" aria-label={t.currencyAria}>
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
                  {t.noGoalsIn(currency)}
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
            <CardDescription>{t.monthsOnTarget}</CardDescription>
            <CardTitle className="text-2xl text-success">
              {report && report.monthsWithCommitment > 0 ? `${report.monthsOnTarget}/${report.monthsWithCommitment}` : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {successRate !== null
                ? t.successRate(formatNumber(successRate, { maximumFractionDigits: 0 }))
                : report?.hasGoals
                  ? t.currentMonthCounts
                  : t.noGoalsInPeriod}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.contributedVsTarget}</CardDescription>
            <CardTitle className="text-2xl">{report ? formatMoney(report.totalContributed, currency) : "—"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t.target(report ? formatMoney(report.totalCommitted, currency) : "—")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.completion}</CardDescription>
            <CardTitle className="text-2xl text-success">
              {report?.completionRate != null ? `${report.completionRate}%` : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {report?.completionRate != null ? t.ofPeriodTarget : t.noGoalsInPeriod}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
