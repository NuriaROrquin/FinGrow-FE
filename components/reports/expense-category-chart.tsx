"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import type { ExpenseBreakdownDto } from "@/lib/api"
import { expenseCategoryLabels } from "@/lib/api/transactions"
import { formatMoney, formatNumber } from "@/lib/format"
import { useMessages } from "@/lib/i18n"
import { formatShare } from "./expense-variation"

const BAR_HEIGHT = 44
const MIN_CHART_HEIGHT = 160

interface ExpenseCategoryChartProps {
  breakdown: ExpenseBreakdownDto
}

export function ExpenseCategoryChart({ breakdown }: ExpenseCategoryChartProps) {
  const t = useMessages().expenseBreakdown
  const chartConfig = { amount: { label: t.chartAmount, color: "var(--destructive)" } } satisfies ChartConfig
  const chartData = breakdown.categories
    .filter((category) => category.amount > 0)
    .map((category) => ({
      label: expenseCategoryLabels[category.category],
      amount: category.amount,
      percentage: category.percentage,
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.chartTitle}</CardTitle>
        <CardDescription>{t.chartDescription(breakdown.currency)}</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">{t.chartEmpty}</p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="w-full"
            style={{ height: Math.max(MIN_CHART_HEIGHT, chartData.length * BAR_HEIGHT) }}
          >
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 24, left: 4, bottom: 5 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickFormatter={(amount: number) => formatNumber(amount, { notation: "compact", maximumFractionDigits: 1 })}
              />
              <YAxis dataKey="label" type="category" width={110} tickLine={false} axisLine={false} />
              <ChartTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                content={
                  <ChartTooltipContent
                    className="min-w-[12rem]"
                    formatter={(amount, _name, item) => (
                      <div className="flex w-full items-center justify-between gap-3">
                        <span className="font-mono font-medium tabular-nums">
                          {formatMoney(Number(amount), breakdown.currency)}
                        </span>
                        <span className="text-muted-foreground">{formatShare(Number(item.payload?.percentage ?? 0))}</span>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="amount" fill="var(--color-amount)" radius={[0, 4, 4, 0]} maxBarSize={28} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
