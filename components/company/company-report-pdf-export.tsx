"use client"

import Image from "next/image"
import { useEffect, useRef, type ReactNode } from "react"
import { ShieldCheckIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { CompanyMonthlyReportDto, CompanyReportIndicatorDto } from "@/lib/api"
import { formatDateText, formatDateTime } from "@/lib/format"
import { useMessages, type Messages } from "@/lib/i18n"
import { exportReportPdf } from "@/lib/report-pdf"
import { CompanyRecommendationsCard } from "./company-recommendations-card"
import type { CompanyInsightsState } from "./company-insights-state"
import { TrendsContent, formatTrendChange, formatTrendValue } from "./company-trends-card"
import { FinancialConcernsCard } from "./financial-concerns-card"

const PDF_WIDTH_PX = 900

type ReportTexts = Messages["companyReportPdf"]

function monthAndYear(period: string) {
  return formatDateText(period, { month: "long", year: "numeric" })
}

function PdfBlock({ children }: { children: ReactNode }) {
  return (
    <div data-pdf-block className="space-y-4">
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="border-b pb-2 text-xl font-semibold">{children}</h2>
}

function HeaderField({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium first-letter:uppercase">{value}</dd>
    </>
  )
}

function hiddenReason(indicator: CompanyReportIndicatorDto, minimum: number, texts: ReportTexts) {
  switch (indicator.status) {
    case "TooFewActiveEmployees":
    case "TooFewScoredEmployees":
      return texts.hiddenReasons[indicator.status](minimum)
    default:
      return null
  }
}

function comparisonText(indicator: CompanyReportIndicatorDto, report: CompanyMonthlyReportDto, texts: Messages) {
  const previousMonth = report.previousPeriod ? monthAndYear(report.previousPeriod) : ""
  const reportTexts = texts.companyReportPdf

  if (indicator.status !== "Visible") return null

  switch (indicator.previousStatus) {
    case "NoData":
      return reportTexts.previousReasons.NoData(previousMonth)
    case "TooFewActiveEmployees":
    case "TooFewScoredEmployees":
      return reportTexts.previousReasons[indicator.previousStatus](previousMonth, report.minimumGroupSize)
  }

  if (indicator.change === null) return null
  if (indicator.change === 0) return reportTexts.noChange(previousMonth)

  const change = texts.companyTrends.changes[indicator.unit](formatTrendChange(indicator.change, indicator.unit))
  return reportTexts.change(change, previousMonth)
}

function IndicatorCard({ indicator, report }: { indicator: CompanyReportIndicatorDto; report: CompanyMonthlyReportDto }) {
  const texts = useMessages()
  const reportTexts = texts.companyReportPdf
  const isVisible = indicator.status === "Visible" && indicator.value !== null
  const detail =
    !isVisible
      ? null
      : indicator.indicator === "ParticipationRate" && report.participatingEmployees !== null && report.activeEmployees !== null
        ? reportTexts.participants(report.participatingEmployees, report.activeEmployees)
        : indicator.indicator === "AverageFinancialHealthScore" && report.averageScoreBand
          ? reportTexts.band(reportTexts.bands[report.averageScoreBand])
          : null

  return (
    <Card data-testid={`report-indicator-${indicator.indicator}`}>
      <CardHeader>
        <CardDescription>{texts.companyTrends.indicators[indicator.indicator]}</CardDescription>
        <CardTitle className="text-3xl">
          {isVisible && indicator.value !== null
            ? texts.companyTrends.values[indicator.unit](formatTrendValue(indicator.value, indicator.unit))
            : reportTexts.hidden}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        {detail && <p>{detail}</p>}
        <p>{isVisible ? comparisonText(indicator, report, texts) : hiddenReason(indicator, report.minimumGroupSize, reportTexts)}</p>
      </CardContent>
    </Card>
  )
}

interface CompanyReportPdfExportProps {
  generatedAt: Date
  /** Siempre con `period`: sin mes cerrado no se exporta nada. */
  report: CompanyMonthlyReportDto
  /** Lo mismo que muestran las pestañas del panel: no se vuelve a llamar a la IA. */
  insights: CompanyInsightsState
  onComplete: () => void
  onError: (error: unknown) => void
}

/**
 * Versión del reporte de la empresa fuera de pantalla, de 900 px fijos, que `lib/report-pdf.ts`
 * captura bloque por bloque (HU-65). Todo lo que muestra ya viene agregado y anonimizado por el
 * backend: acá no se calcula ni se filtra nada.
 */
export function CompanyReportPdfExport({ generatedAt, report, insights, onComplete, onError }: CompanyReportPdfExportProps) {
  const texts = useMessages()
  const reportTexts = texts.companyReportPdf
  const rootRef = useRef<HTMLDivElement>(null)
  const period = report.period ?? ""
  const fileName = `${reportTexts.fileName}_${period.slice(0, 7).replace("-", "")}.pdf`

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const controller = new AbortController()

    exportReportPdf(root, fileName, controller.signal)
      .then(onComplete)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) onError(error)
      })

    return () => controller.abort()
  }, [fileName, onComplete, onError])

  return (
    <div
      ref={rootRef}
      data-pdf-root
      aria-hidden
      className="pointer-events-none text-foreground"
      style={{ position: "fixed", top: 0, left: -10000, width: PDF_WIDTH_PX }}
    >
      <PdfBlock>
        <div className="flex items-center justify-between gap-6 border-b pb-4">
          <div className="flex items-center gap-3">
            <Image src="/9.png" alt="FinGrow" width={48} height={50} className="object-contain" unoptimized priority />
            <div>
              <p className="text-2xl font-bold text-secondary-foreground">FinGrow</p>
              <p className="text-muted-foreground">{reportTexts.title}</p>
            </div>
          </div>
          <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-sm">
            <HeaderField label={reportTexts.company} value={report.companyName} />
            {report.period && <HeaderField label={reportTexts.period} value={monthAndYear(report.period)} />}
            {report.previousPeriod && (
              <HeaderField label={reportTexts.comparedWith} value={monthAndYear(report.previousPeriod)} />
            )}
            <HeaderField label={reportTexts.generatedAt} value={formatDateTime(generatedAt)} />
          </dl>
        </div>
      </PdfBlock>

      <PdfBlock>
        <SectionTitle>{reportTexts.summaryTitle}</SectionTitle>
        {report.isAnonymized && report.period && (
          <div className="flex items-start gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" />
            <span>{reportTexts.anonymized(monthAndYear(report.period), report.minimumGroupSize)}</span>
          </div>
        )}
        <div className="grid grid-cols-3 gap-4">
          {report.indicators.map((indicator) => (
            <IndicatorCard key={indicator.indicator} indicator={indicator} report={report} />
          ))}
        </div>
      </PdfBlock>

      <PdfBlock>
        <SectionTitle>{reportTexts.trendsTitle}</SectionTitle>
        <TrendsContent trends={report.trends} texts={texts.companyTrends} />
        <p className="text-xs text-muted-foreground">{texts.companyTrends.footer}</p>
      </PdfBlock>

      <PdfBlock>
        <FinancialConcernsCard {...insights} />
      </PdfBlock>

      <PdfBlock>
        <CompanyRecommendationsCard {...insights} />
      </PdfBlock>

      <PdfBlock>
        <p className="flex items-start gap-2 border-t pt-3 text-xs text-muted-foreground">
          <ShieldCheckIcon className="mt-0.5 size-3.5 shrink-0" />
          <span>{reportTexts.privacyNote(report.minimumGroupSize)}</span>
        </p>
      </PdfBlock>
    </div>
  )
}
