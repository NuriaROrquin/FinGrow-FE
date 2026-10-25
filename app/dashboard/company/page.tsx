"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { TrendingUpIcon, CheckCircleIcon, GraduationCapIcon, BuildingIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { ParticipationCards } from "@/components/company/participation-cards"
import { DepartmentMetricsSection } from "@/components/company/department-metrics-section"
import { EducationMetricsCard } from "@/components/company/education-metrics-card"
import { FinancialHealthCard } from "@/components/company/financial-health-card"
import { FinancialConcernsCard } from "@/components/company/financial-concerns-card"
import { CompanyRecommendationsCard } from "@/components/company/company-recommendations-card"
import type { CompanyInsightsState } from "@/components/company/company-insights-state"
import {
  getCompanyInsights,
  getCompanyMetricsComparison,
  isApiError,
  type CompanyMetricsComparisonDto,
} from "@/lib/api"
import { useEffect, useState } from "react"

const chartConfig = {
  active: {
    label: "Usuarios Activos",
    color: "#8b5cf6",
  },
  enrolled: {
    label: "Inscritos",
    color: "#a78bfa",
  },
  score: {
    label: "Puntaje de Salud",
    color: "#8b5cf6",
  },
}

function formatPeriod(period: string): string {
  const [year, month, day] = period.split("-").map(Number)
  const label = new Intl.DateTimeFormat("es-AR", { month: "short" }).format(new Date(year, month - 1, day))
  return label.charAt(0).toLocaleUpperCase("es-AR") + label.slice(1)
}

function formatRate(rate: number): string {
  return `${rate.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`
}

export default function CompanyDashboardPage() {
  const [comparison, setComparison] = useState<CompanyMetricsComparisonDto | null>(null)
  const [comparisonError, setComparisonError] = useState<string | null>(null)
  const [isComparisonLoading, setIsComparisonLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    getCompanyMetricsComparison(controller.signal)
      .then(setComparison)
      .catch((error: unknown) => {
        if (controller.signal.aborted) return

        if (isApiError(error)) {
          if (error.status === 400) {
            setComparisonError("Se necesitan al menos dos períodos con datos para mostrar la evolución.")
          } else if (error.status === 403) {
            setComparisonError(error.description || "No tenés permiso para consultar estas métricas.")
          } else if (error.status === 503) {
            setComparisonError("Las métricas no están disponibles para preservar el anonimato de grupos pequeños.")
          } else {
            setComparisonError(error.description)
          }
        } else {
          setComparisonError("No se pudieron cargar las métricas de participación y bienestar.")
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsComparisonLoading(false)
      })

    return () => controller.abort()
  }, [])

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

  const periods = comparison?.periods ?? []
  const participationChartData = periods.map(({ period, participationRate }) => ({
    month: formatPeriod(period),
    active: participationRate,
    enrolled: null,
  }))
  const financialHealthChartData = periods.map(({ period, averageFinancialHealthScore }) => ({
    month: formatPeriod(period),
    score: averageFinancialHealthScore,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BuildingIcon className="size-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-balance">Panel Empresarial</h1>
          <p className="text-muted-foreground mt-1">Resumen de bienestar financiero de empleados</p>
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
            <CardTitle>Participación de Empleados</CardTitle>
            <CardDescription>Usuarios activos vs empleados inscritos en el tiempo</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {isComparisonLoading ? (
              <Skeleton className="h-[300px] w-full min-w-[300px]" />
            ) : comparisonError ? (
              <p className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">{comparisonError}</p>
            ) : periods.length === 0 ? (
              <p className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No hay períodos para mostrar.
              </p>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full min-w-[300px]">
                <LineChart data={participationChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value: number) => formatRate(value)} />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => typeof value === "number" ? formatRate(value) : "—"} />}
                    cursor={{ stroke: "rgba(0, 0, 0, 0.2)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="active"
                    stroke={chartConfig.active.color}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="enrolled"
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
            <CardTitle>Tendencia de Salud Financiera</CardTitle>
            <CardDescription>Puntaje promedio de salud financiera de empleados</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {isComparisonLoading ? (
              <Skeleton className="h-[300px] w-full min-w-[300px]" />
            ) : comparisonError ? (
              <p className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">{comparisonError}</p>
            ) : periods.length === 0 ? (
              <p className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No hay períodos para mostrar.
              </p>
            ) : financialHealthChartData.every(({ score }) => score === null) ? (
              <p className="flex h-[300px] items-center justify-center text-center text-sm text-muted-foreground">
                El puntaje se oculta en los meses con pocos empleados con actividad, para no identificar a nadie.
              </p>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full min-w-[300px]">
                <LineChart data={financialHealthChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => typeof value === "number" ? `${value.toLocaleString("es-AR", { maximumFractionDigits: 2 })}/100` : "Oculto"} />}
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
          <TabsTrigger value="departments">Por Departamento</TabsTrigger>
          <TabsTrigger value="concerns">Principales Preocupaciones</TabsTrigger>
          <TabsTrigger value="insights">Análisis</TabsTrigger>
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
            <Card>
              <CardHeader>
                <CardTitle>Tendencias Positivas</CardTitle>
                <CardDescription>Áreas que muestran mejora</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                    <CheckCircleIcon className="size-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium">Mayor Participación</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        La participación de empleados ha crecido un 23% en los últimos 6 meses
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                    <TrendingUpIcon className="size-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium">Mejor Salud Financiera</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        El puntaje promedio de salud financiera aumentó de 62 a 73
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                    <GraduationCapIcon className="size-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium">Alta Finalización de Cursos</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        342 cursos completados con 87% de satisfacción
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <CompanyRecommendationsCard {...insightsState} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
