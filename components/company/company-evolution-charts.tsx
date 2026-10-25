"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { useIsReportExport } from "@/components/reports/report-export-context"
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"
import type { CompanyMetricsDto } from "@/lib/api"
import { formatDateText, formatNumber } from "@/lib/format"
import { useMessages } from "@/lib/i18n"

/** Lo que la página pide una sola vez a `GET /api/company/metrics` y comparten el panel y el PDF (HU-65). */
export interface CompanyMetricsState {
  metrics: CompanyMetricsDto[]
  error: string | null
  isLoading: boolean
}

function formatPeriod(period: string): string {
  const label = formatDateText(period, { month: "short" })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatRate(rate: number): string {
  return `${formatNumber(rate, { maximumFractionDigits: 1 })}%`
}

/**
 * Gráficos de participación y de salud financiera de todos los meses con foto. Los meses que no
 * llegan al umbral de anonimato vienen marcados por el backend y quedan en blanco. En el PDF
 * (`ReportExportProvider`) van uno debajo del otro y sin animación, para que se capturen completos.
 */
export function CompanyEvolutionCharts({ metrics, error, isLoading }: CompanyMetricsState) {
  const t = useMessages().companyPanel
  const isExport = useIsReportExport()
  const chartConfig = {
    active: { label: t.chartParticipationRate, color: "#8b5cf6" },
    enrolled: { label: t.chartParticipatingEmployees, color: "#a78bfa" },
    score: { label: t.chartHealthScore, color: "#8b5cf6" },
  }
  const periods = metrics
  const participationChartData = periods.map((metric) => ({
    month: formatPeriod(metric.period),
    active: metric.isMetricsHidden ? null : metric.participationRate,
    enrolled: metric.isMetricsHidden ? null : metric.participatingEmployees,
  }))
  const financialHealthChartData = periods.map((metric) => ({
    month: formatPeriod(metric.period),
    score: metric.isMetricsHidden ? null : metric.averageFinancialHealthScore,
  }))

  return (
    <div className={isExport ? "grid gap-4" : "grid gap-4 grid-cols-1 md:grid-cols-2"}>
      <Card>
        <CardHeader>
          <CardTitle>{t.participationTitle}</CardTitle>
          <CardDescription>{t.participationDescription}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <Skeleton className="h-[300px] w-full min-w-[300px]" />
          ) : error ? (
            <p className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">{error}</p>
          ) : periods.length === 0 ? (
            <p className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              {t.noPeriods}
            </p>
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full min-w-[300px]">
              <LineChart data={participationChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="rate" tickFormatter={(value: number) => formatRate(value)} />
                <YAxis yAxisId="employees" orientation="right" />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => {
                        if (typeof value !== "number") return "—"
                        return name === chartConfig.enrolled.label ? formatNumber(value) : formatRate(value)
                      }}
                    />
                  }
                  cursor={{ stroke: "rgba(0, 0, 0, 0.2)" }}
                />
                <Line
                  type="monotone"
                  dataKey="active"
                  yAxisId="rate"
                  stroke={chartConfig.active.color}
                  strokeWidth={2}
                  isAnimationActive={!isExport}
                />
                <Line
                  type="monotone"
                  dataKey="enrolled"
                  yAxisId="employees"
                  stroke={chartConfig.enrolled.color}
                  strokeWidth={2}
                  isAnimationActive={!isExport}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t.healthTrendTitle}</CardTitle>
          <CardDescription>{t.healthTrendDescription}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <Skeleton className="h-[300px] w-full min-w-[300px]" />
          ) : error ? (
            <p className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">{error}</p>
          ) : periods.length === 0 ? (
            <p className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              {t.noPeriods}
            </p>
          ) : financialHealthChartData.every(({ score }) => score === null) ? (
            <p className="flex h-[300px] items-center justify-center text-center text-sm text-muted-foreground">
              {t.scoreHiddenAll}
            </p>
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full min-w-[300px]">
              <LineChart data={financialHealthChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) =>
                        typeof value === "number" ? `${formatNumber(value, { maximumFractionDigits: 2 })}/100` : t.hidden
                      }
                    />
                  }
                  cursor={{ stroke: "rgba(0, 0, 0, 0.2)" }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={chartConfig.score.color}
                  strokeWidth={2}
                  isAnimationActive={!isExport}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
