import { cleanup, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { es } from "@/lib/i18n/es"
import type { CompanyInsightsDto, CompanyMonthlyReportDto, CompanyReportIndicatorDto } from "@/lib/api"
import { CompanyReportPdfExport } from "./company-report-pdf-export"

const pdf = vi.hoisted(() => ({ exportReportPdf: vi.fn() }))
const i18n = vi.hoisted(() => ({ useMessages: vi.fn() }))

vi.mock("@/lib/report-pdf", () => pdf)
vi.mock("@/lib/i18n", () => ({ useMessages: i18n.useMessages }))
vi.mock("next/image", () => ({ default: () => null }))

function report(overrides: Partial<CompanyMonthlyReportDto> = {}): CompanyMonthlyReportDto {
  return {
    companyName: "Acme S.A.",
    period: "2026-09-01",
    previousPeriod: "2026-08-01",
    minimumGroupSize: 3,
    isAnonymized: false,
    activeEmployees: 10,
    participatingEmployees: 8,
    averageScoreBand: "Stable",
    indicators: [
      {
        indicator: "ParticipationRate",
        unit: "Percentage",
        status: "Visible",
        value: 80,
        previousStatus: "Visible",
        previousValue: 50,
        change: 30,
      },
      {
        indicator: "AverageFinancialHealthScore",
        unit: "Points",
        status: "Visible",
        value: 70,
        previousStatus: "TooFewScoredEmployees",
        previousValue: null,
        change: null,
      },
      {
        indicator: "CompletedCourses",
        unit: "Count",
        status: "Visible",
        value: 6,
        previousStatus: "Visible",
        previousValue: 6,
        change: 0,
      },
    ],
    trends: {
      period: "2026-09-01",
      previousPeriod: "2026-08-01",
      isAnonymized: false,
      minimumGroupSize: 3,
      positiveTrends: [
        { indicator: "ParticipationRate", unit: "Percentage", previousValue: 50, currentValue: 80, change: 30 },
      ],
      opportunities: [],
    },
    ...overrides,
  }
}

const insights: CompanyInsightsDto = {
  period: "2026-09-01",
  isAnonymized: false,
  minimumGroupSize: 3,
  measuredEmployees: 8,
  concerns: [{ concern: "LowSavings", affectedEmployees: 4, evaluatedEmployees: 8, percentage: 50 }],
  recommendations: [],
  recommendationsAvailable: false,
}

function renderExport(value: CompanyMonthlyReportDto, onComplete = vi.fn(), onError = vi.fn()) {
  render(
    <CompanyReportPdfExport
      generatedAt={new Date(2026, 9, 25, 15, 30)}
      report={value}
      insights={{ insights, isLoading: false, hasFailed: false }}
      onComplete={onComplete}
      onError={onError}
    />,
  )
}

describe("CompanyReportPdfExport", () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    i18n.useMessages.mockReturnValue(es)
    pdf.exportReportPdf.mockResolvedValue(undefined)
  })

  it("puts the company and the compared months in the header", () => {
    renderExport(report())

    expect(screen.getByText("Acme S.A.")).not.toBeNull()
    expect(screen.getByText("septiembre de 2026")).not.toBeNull()
    expect(screen.getByText("agosto de 2026")).not.toBeNull()
    expect(screen.getByText("Reporte de Bienestar Financiero")).not.toBeNull()
  })

  it("shows each indicator with its comparison, or why there is no comparison", () => {
    renderExport(report())

    const participation = screen.getByTestId("report-indicator-ParticipationRate")
    expect(within(participation).getByText("80%")).not.toBeNull()
    expect(within(participation).getByText("8 de 10 empleados activos participaron")).not.toBeNull()
    expect(within(participation).getByText("+30 p.p. respecto de agosto de 2026")).not.toBeNull()

    const score = screen.getByTestId("report-indicator-AverageFinancialHealthScore")
    expect(within(score).getByText("70/100")).not.toBeNull()
    expect(within(score).getByText("Nivel: Estable")).not.toBeNull()
    expect(
      within(score).getByText("Sin comparación: en agosto de 2026 hubo menos de 3 empleados con puntaje."),
    ).not.toBeNull()

    const courses = screen.getByTestId("report-indicator-CompletedCourses")
    expect(within(courses).getByText("Sin cambios respecto de agosto de 2026")).not.toBeNull()
  })

  it("explains why the indicators are hidden in a small month, without showing any value", () => {
    renderExport(
      report({
        isAnonymized: true,
        participatingEmployees: null,
        averageScoreBand: null,
        indicators: report().indicators.map((indicator): CompanyReportIndicatorDto => ({
          ...indicator,
          status: "TooFewActiveEmployees",
          value: null,
          change: null,
        })),
        trends: { ...report().trends, isAnonymized: true, positiveTrends: [] },
      }),
    )

    expect(screen.getByText(/En septiembre de 2026 hubo menos de 3 empleados activos/)).not.toBeNull()
    expect(screen.getAllByText("Oculto")).toHaveLength(3)
    expect(screen.getAllByText("Menos de 3 empleados activos en el mes.")).toHaveLength(3)
    expect(screen.queryByText("80%")).toBeNull()
    expect(screen.queryByText(/empleados activos participaron/)).toBeNull()
  })

  it("includes the trends, the concerns and the privacy note", () => {
    renderExport(report())

    expect(screen.getByText("Tendencias positivas")).not.toBeNull()
    expect(screen.getByText("Ahorro bajo")).not.toBeNull()
    expect(screen.getByText(/ningún dato identifica a un empleado/)).not.toBeNull()
  })

  it("exports the PDF named after the month and reports when it finished", async () => {
    const onComplete = vi.fn()
    renderExport(report(), onComplete)

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
    expect(pdf.exportReportPdf).toHaveBeenCalledWith(expect.any(HTMLElement), "reporte-empresa_202609.pdf", expect.any(AbortSignal))
  })

  it("reports a failure to generate the PDF", async () => {
    const onError = vi.fn()
    pdf.exportReportPdf.mockRejectedValue(new Error("canvas"))
    renderExport(report(), vi.fn(), onError)

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1))
  })
})
