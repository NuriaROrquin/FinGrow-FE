"use client"

import Image from "next/image"
import { useEffect, useRef, type ReactNode } from "react"
import { formatPeriodLabel } from "@/components/period-filter"
import type { ExpenseBreakdownDto, FinancialInsightsDto, MonthlySummaryDto, SavingsVsGoalsDto } from "@/lib/api"
import type { Currency } from "@/lib/api/transactions"
import { useAuth } from "@/lib/auth-context"
import { formatDateTime } from "@/lib/format"
import { useMessages } from "@/lib/i18n"
import { exportReportPdf } from "@/lib/report-pdf"
import { ExpenseBreakdownSection } from "./expense-breakdown-section"
import { FinancialInsightsSection } from "./financial-insights-section"
import { MonthlyEvolutionChart } from "./monthly-evolution-chart"
import { MonthlyHighlightsCard } from "./monthly-highlights-card"
import { ReportExportProvider } from "./report-export-context"
import { ReportSummaryCards } from "./report-summary-cards"
import { SavingsVsGoalsReport } from "./savings-vs-goals-report"

const PDF_WIDTH_PX = 900

const ignoreChange = () => {}

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

interface ReportPdfExportProps {
  generatedAt: Date
  dateFrom: string
  dateTo: string
  currency: Currency
  savingsCurrency: Currency
  summary: MonthlySummaryDto | null
  breakdown: ExpenseBreakdownDto | null
  insights: FinancialInsightsDto | null
  savings: SavingsVsGoalsDto | null
  isComparingExpenses: boolean
  onComplete: () => void
  onError: (error: unknown) => void
}

export function ReportPdfExport({
  generatedAt,
  dateFrom,
  dateTo,
  currency,
  savingsCurrency,
  summary,
  breakdown,
  insights,
  savings,
  isComparingExpenses,
  onComplete,
  onError,
}: ReportPdfExportProps) {
  const t = useMessages().reportPdf
  const { userName } = useAuth()
  const rootRef = useRef<HTMLDivElement>(null)
  const fileName = `${t.fileName}_${dateFrom.replaceAll("-", "")}_${dateTo.replaceAll("-", "")}.pdf`

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
                <p className="text-muted-foreground">{t.title}</p>
              </div>
            </div>
            <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-sm">
              <HeaderField label={t.employee} value={userName} />
              <HeaderField label={t.period} value={formatPeriodLabel(dateFrom, dateTo)} />
              <HeaderField label={t.currency} value={currency} />
              <HeaderField label={t.generatedAt} value={formatDateTime(generatedAt)} />
            </dl>
          </div>
        </PdfBlock>

        <PdfBlock>
          <ReportSummaryCards summary={summary} isLoading={false} />
        </PdfBlock>

        <PdfBlock>
          <SectionTitle>{t.overview}</SectionTitle>
          <MonthlyEvolutionChart summary={summary} isLoading={false} />
          <MonthlyHighlightsCard summary={summary} isLoading={false} />
        </PdfBlock>

        <PdfBlock>
          <FinancialInsightsSection insights={insights} isLoading={false} />
        </PdfBlock>

        <PdfBlock>
          <SectionTitle>{t.spending}</SectionTitle>
          <ExpenseBreakdownSection
            breakdown={breakdown}
            isLoading={false}
            isComparing={isComparingExpenses}
            onComparingChange={ignoreChange}
          />
        </PdfBlock>

        <PdfBlock>
          <SectionTitle>{t.savings}</SectionTitle>
          <SavingsVsGoalsReport
            report={savings}
            isLoading={false}
            currency={savingsCurrency}
            onCurrencyChange={ignoreChange}
            dateFrom={dateFrom}
            dateTo={dateTo}
          />
        </PdfBlock>
      </ReportExportProvider>
    </div>
  )
}
