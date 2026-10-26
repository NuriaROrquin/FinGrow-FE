"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BuildingIcon, DownloadIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ParticipationCards } from "@/components/company/participation-cards"
import { DepartmentMetricsSection } from "@/components/company/department-metrics-section"
import { EducationMetricsCard } from "@/components/company/education-metrics-card"
import { FinancialHealthCard } from "@/components/company/financial-health-card"
import { FinancialConcernsCard } from "@/components/company/financial-concerns-card"
import { CompanyRecommendationsCard } from "@/components/company/company-recommendations-card"
import { CompanyTrendsCard } from "@/components/company/company-trends-card"
import { CompanyReportPdfExport } from "@/components/company/company-report-pdf-export"
import { CompanyEvolutionCharts, type CompanyMetricsState } from "@/components/company/company-evolution-charts"
import type { CompanyInsightsState } from "@/components/company/company-insights-state"
import {
  getCompanyMetrics,
  getCompanyMonthlyReport,
  isApiError,
  type CompanyMetricsDto,
  type CompanyMonthlyReportDto,
} from "@/lib/api"
import { getCompanyInsights } from "@/lib/api/company"
import { useMessages } from "@/lib/i18n"
import { useCallback, useEffect, useState } from "react"

export default function CompanyDashboardPage() {
  const messages = useMessages()
  const t = messages.companyPanel
  const reportTexts = messages.companyReportPdf
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

  // HU-65: el reporte se pide recién al exportar; preocupaciones y recomendaciones salen del mismo
  // pedido a /insights que ya muestran las pestañas, así el PDF dice lo mismo que la pantalla.
  const [isExporting, setIsExporting] = useState(false)
  const [pdfExport, setPdfExport] = useState<{ report: CompanyMonthlyReportDto; generatedAt: Date } | null>(null)

  const startExport = async () => {
    setIsExporting(true)

    try {
      const report = await getCompanyMonthlyReport()

      if (!report.period) {
        toast.info(reportTexts.noPeriod)
        setIsExporting(false)
        return
      }

      setPdfExport({ report, generatedAt: new Date() })
    } catch {
      toast.error(reportTexts.exportFailed)
      setIsExporting(false)
    }
  }

  const finishExport = useCallback(() => {
    setPdfExport(null)
    setIsExporting(false)
  }, [])

  const failExport = useCallback(() => {
    setPdfExport(null)
    setIsExporting(false)
    toast.error(reportTexts.exportFailed)
  }, [reportTexts.exportFailed])

  const metricsState: CompanyMetricsState = {
    metrics,
    error: comparisonError,
    isLoading: isComparisonLoading,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BuildingIcon className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-balance">{t.title}</h1>
            <p className="text-muted-foreground mt-1">{t.subtitle}</p>
          </div>
        </div>
        <Button onClick={startExport} disabled={insightsState.isLoading || isComparisonLoading || isExporting} className="self-start lg:self-auto">
          <DownloadIcon className="size-4" />
          {isExporting ? reportTexts.exporting : reportTexts.export}
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ParticipationCards />

        <FinancialHealthCard />

        <EducationMetricsCard />
      </div>

      {/* Charts */}
      <CompanyEvolutionCharts {...metricsState} />

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

      {pdfExport && (
        <CompanyReportPdfExport
          generatedAt={pdfExport.generatedAt}
          report={pdfExport.report}
          insights={insightsState}
          metrics={metricsState}
          onComplete={finishExport}
          onError={failExport}
        />
      )}
    </div>
  )
}
