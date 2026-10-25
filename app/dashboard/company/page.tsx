"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BuildingIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { ParticipationCards } from "@/components/company/participation-cards"
import { DepartmentMetricsSection } from "@/components/company/department-metrics-section"
import { EducationMetricsCard } from "@/components/company/education-metrics-card"
import { FinancialHealthCard } from "@/components/company/financial-health-card"
import { FinancialConcernsCard } from "@/components/company/financial-concerns-card"
import { CompanyRecommendationsCard } from "@/components/company/company-recommendations-card"
import { CompanyTrendsCard } from "@/components/company/company-trends-card"
import type { CompanyInsightsState } from "@/components/company/company-insights-state"
import {
  getCompanyMetrics,
  isApiError,
  type CompanyMetricsDto,
} from "@/lib/api"
import { getCompanyInsights } from "@/lib/api/company"
import { formatDateText, formatNumber } from "@/lib/format"
import { useMessages } from "@/lib/i18n"
import { useEffect, useState } from "react"

function formatPeriod(period: string): string {
  const label = formatDateText(period, { month: "short" })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatRate(rate: number): string {
  return `${formatNumber(rate, { maximumFractionDigits: 1 })}%`
}

export default function CompanyDashboardPage() {
  const t = useMessages().companyPanel
  const chartConfig = {
    active: { label: t.chartParticipationRate, color: "#8b5cf6" },
    enrolled: { label: t.chartParticipatingEmployees, color: "#a78bfa" },
    score: { label: t.chartHealthScore, color: "#8b5cf6" },
  }
  const [metrics, setMetrics] = useState<CompanyMetricsDto[]>([])
  const [comparisonError, setComparisonError] = useState<string | null>(null)
  const [isComparisonLoading, setIsComparisonLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    getCompanyMetrics({}, controller.signal)
      .then(setMetrics)
      .catch((error: unknown) => {
        if (controller.signal.aborted) return

        if (isApiError(error)) {
          if (error.status === 400) {
            setComparisonError(t.needTwoPeriods)
          } else if (error.status === 403) {
            setComparisonError(error.description || t.noPermission)
          } else if (error.status === 503) {
            setComparisonError(t.metricsAnonymized)
          } else {
            setComparisonError(error.description)
          }
        } else {
          setComparisonError(t.metricsLoadFailed)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsComparisonLoading(false)
      })

    return () => controller.abort()
  }, [t])

  // Preocupaciones (HU-61) y recomendaciones (HU-64) salen de un solo pedido: las dos tarjetas
  // muestran el mismo mes y la IA no se consulta dos veces.
  const [insightsState, setInsightsState] = useState<CompanyInsightsState>({
    insights: null,
    isLoading: true,
    hasFailed: false,
  })

  useEffect(() => {
    const controller = new AbortController()

    getCompanyInsights(controller.signal)
      .then((insights) => setInsightsState({ insights, isLoading: false, hasFailed: false }))
      .catch(() => {
        if (controller.signal.aborted) return
        setInsightsState({ insights: null, isLoading: false, hasFailed: true })
      })

    return () => controller.abort()
  }, [])

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BuildingIcon className="size-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-balance">{t.title}</h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ParticipationCards />

        <FinancialHealthCard />

        <EducationMetricsCard />
      </div>

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.participationTitle}</CardTitle>
            <CardDescription>{t.participationDescription}</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {isComparisonLoading ? (
              <Skeleton className="h-[300px] w-full min-w-[300px]" />
            ) : comparisonError ? (
              <p className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">{comparisonError}</p>
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
                  />
                  <Line
                    type="monotone"
                    dataKey="enrolled"
                    yAxisId="employees"
                    stroke={chartConfig.enrolled.color}
                    strokeWidth={2}
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
            {isComparisonLoading ? (
              <Skeleton className="h-[300px] w-full min-w-[300px]" />
            ) : comparisonError ? (
              <p className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">{comparisonError}</p>
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
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="departments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="departments">{t.tabDepartments}</TabsTrigger>
          <TabsTrigger value="concerns">{t.tabConcerns}</TabsTrigger>
          <TabsTrigger value="insights">{t.tabInsights}</TabsTrigger>
        </TabsList>

        {/* Departments Tab */}
        <TabsContent value="departments">
          <DepartmentMetricsSection />
        </TabsContent>

        {/* Top Concerns Tab */}
        <TabsContent value="concerns">
          <FinancialConcernsCard {...insightsState} />
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights">
          <div className="grid gap-4 md:grid-cols-2">
            <CompanyTrendsCard />

            <CompanyRecommendationsCard {...insightsState} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
