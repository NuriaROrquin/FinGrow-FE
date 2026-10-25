"use client"

import Image from "next/image"
import { useEffect, useRef, type ReactNode } from "react"
import { ShieldCheckIcon } from "lucide-react"
import { ReportExportProvider } from "@/components/reports/report-export-context"
import { formatDateTime } from "@/lib/format"
import { useMessages } from "@/lib/i18n"
import { exportReportPdf } from "@/lib/report-pdf"
import { CompanyEvolutionCharts, type CompanyMetricsState } from "./company-evolution-charts"
import type { CompanyInsightsState } from "./company-insights-state"
import { CompanyRecommendationsCard } from "./company-recommendations-card"
import { CompanyTrendsCard } from "./company-trends-card"
import { DepartmentMetricsSection } from "./department-metrics-section"
import { EducationMetricsCard } from "./education-metrics-card"
import { FinancialConcernsCard } from "./financial-concerns-card"
import { FinancialHealthCard } from "./financial-health-card"
import { ParticipationCards } from "./participation-cards"

const PDF_WIDTH_PX = 900

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
      <dd className="font-medium">{value}</dd>
    </>
  )
}

function dateStamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
}

interface CompanyReportPdfExportProps {
  generatedAt: Date
  companyName: string
  /** Lo que ya muestran las pestañas del panel: la IA no se vuelve a llamar. */
  insights: CompanyInsightsState
  /** Los meses que ya muestran los gráficos del panel. */
  metrics: CompanyMetricsState
  onComplete: () => void
  onError: (error: unknown) => void
}

/**
 * El Panel Empresarial tal como se ve, fuera de pantalla y de 900 px fijos, para que `lib/report-pdf.ts`
 * lo capture bloque por bloque (HU-65). Son los mismos componentes del panel: lo que muestra, lo que
 * oculta por anonimato y el período de cada tarjeta lo decide el backend, igual que en pantalla.
 */
export function CompanyReportPdfExport({
  generatedAt,
  companyName,
  insights,
  metrics,
  onComplete,
  onError,
}: CompanyReportPdfExportProps) {
  const texts = useMessages().companyReportPdf
  const rootRef = useRef<HTMLDivElement>(null)
  const fileName = `${texts.fileName}_${dateStamp(generatedAt)}.pdf`

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
      <ReportExportProvider value>
        <PdfBlock>
          <div className="flex items-center justify-between gap-6 border-b pb-4">
            <div className="flex items-center gap-3">
              <Image src="/9.png" alt="FinGrow" width={48} height={50} className="object-contain" unoptimized priority />
              <div>
                <p className="text-2xl font-bold text-secondary-foreground">FinGrow</p>
                <p className="text-muted-foreground">{texts.title}</p>
              </div>
            </div>
            <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-sm">
              <HeaderField label={texts.company} value={companyName} />
              <HeaderField label={texts.generatedAt} value={formatDateTime(generatedAt)} />
            </dl>
          </div>
        </PdfBlock>

        <PdfBlock>
          <SectionTitle>{texts.indicatorsTitle}</SectionTitle>
          <p className="text-sm text-muted-foreground">{texts.indicatorsNote}</p>
          <div className="grid grid-cols-2 gap-4">
            <ParticipationCards />
            <FinancialHealthCard />
            <EducationMetricsCard />
          </div>
        </PdfBlock>

        <PdfBlock>
          <SectionTitle>{texts.evolutionTitle}</SectionTitle>
          <CompanyEvolutionCharts {...metrics} />
        </PdfBlock>

        <PdfBlock>
          <SectionTitle>{texts.departmentsTitle}</SectionTitle>
          {/* El orden por columna es de la pantalla: en el PDF las flechas no significan nada. */}
          <div className="[&_th_svg]:hidden">
            <DepartmentMetricsSection />
          </div>
        </PdfBlock>

        <PdfBlock>
          <SectionTitle>{texts.concernsTitle}</SectionTitle>
          <FinancialConcernsCard {...insights} />
        </PdfBlock>

        <PdfBlock>
          <SectionTitle>{texts.insightsTitle}</SectionTitle>
          <CompanyTrendsCard />
          <CompanyRecommendationsCard {...insights} />
        </PdfBlock>

        <PdfBlock>
          <p className="flex items-start gap-2 border-t pt-3 text-xs text-muted-foreground">
            <ShieldCheckIcon className="mt-0.5 size-3.5 shrink-0" />
            <span>{texts.privacyNote}</span>
          </p>
        </PdfBlock>
      </ReportExportProvider>
    </div>
  )
}
