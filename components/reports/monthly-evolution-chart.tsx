"use client"

import { Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import type { MonthlySummaryDto } from "@/lib/api"
import { formatDateText, formatMoney, formatNumber } from "@/lib/format"
import { useMessages } from "@/lib/i18n"
import { useIsReportExport } from "./report-export-context"

function monthLabel(year: number, month: number, spansSeveralYears: boolean): string {
  return formatDateText(new Date(year, month - 1, 1), spansSeveralYears ? { month: "short", year: "2-digit" } : { month: "short" })
}

interface MonthlyEvolutionChartProps {
  summary: MonthlySummaryDto | null
  isLoading: boolean
}

export function MonthlyEvolutionChart({ summary, isLoading }: MonthlyEvolutionChartProps) {
  const t = useMessages().reports
  const isExport = useIsReportExport()
  // Los tokens --chart-* del tema son todos violetas: acá cada serie lleva el color que ya usan las cards
  // de arriba (ingresos en verde, gastos en rojo, ahorro en el primario), y el ahorro va como línea para
  // que no dependa solo del color.
  const chartConfig = {
    income: { label: t.income, color: "var(--success)" },
    expenses: { label: t.expenses, color: "var(--destructive)" },
    savings: { label: t.savings, color: "var(--primary)" },
  } satisfies ChartConfig
  const months = summary?.months ?? []
  const currency = summary?.currency ?? "ARS"
  const spansSeveralYears = new Set(months.map((month) => month.year)).size > 1
  const chartData = months.map((month) => ({
    label: monthLabel(month.year, month.month, spansSeveralYears),
    longLabel: formatDateText(new Date(month.year, month.month - 1, 1), { month: "long", year: "numeric" }),
    income: month.income,
    expenses: month.expenses,
    savings: month.savings,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.evolutionTitle}</CardTitle>
        <CardDescription>
          {summary ? t.evolutionDescriptionIn(summary.currency) : t.evolutionDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && !summary ? (
          <Skeleton className="h-[400px] w-full" />
        ) : !summary ? (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            {t.evolutionLoadFailed}
          </p>
        ) : months.length === 0 ? (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            {t.noMovements(summary.currency)}
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <ComposedChart data={chartData} margin={{ top: 20, right: 12, left: 4, bottom: 5 }} barGap={2}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis
                width={56}
                tickLine={false}
                axisLine={false}
                tickFormatter={(amount: number) => formatNumber(amount, { notation: "compact", maximumFractionDigits: 1 })}
              />
              <ReferenceLine y={0} stroke="var(--border)" />
              <ChartTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                content={
                  <ChartTooltipContent
                    className="min-w-[12rem]"
                    labelFormatter={(_label, payload) => {
                      const longLabel = payload[0]?.payload?.longLabel
                      return typeof longLabel === "string" ? <span className="first-letter:uppercase">{longLabel}</span> : null
                    }}
                    formatter={(amount, name, item) => (
                      <div className="flex w-full items-center gap-2">
                        <span className="size-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
                        <span className="flex-1 text-muted-foreground">
                          {chartConfig[name as keyof typeof chartConfig]?.label}
                        </span>
                        <span className="font-mono font-medium tabular-nums">
                          {formatMoney(Number(amount), currency)}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="income"
                fill="var(--color-income)"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
                isAnimationActive={!isExport}
              />
              <Bar
                dataKey="expenses"
                fill="var(--color-expenses)"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
                isAnimationActive={!isExport}
              />
              <Line
                type="monotone"
                dataKey="savings"
                stroke="var(--color-savings)"
                strokeWidth={2}
                dot={{ r: 4, fill: "var(--color-savings)", stroke: "var(--card)", strokeWidth: 2 }}
                activeDot={{ r: 5 }}
                isAnimationActive={!isExport}
              />
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
