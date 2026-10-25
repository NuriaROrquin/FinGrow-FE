import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { es } from "@/lib/i18n/es"
import type { CompanyInsightsDto } from "@/lib/api"
import type { CompanyMetricsState } from "./company-evolution-charts"
import { CompanyReportPdfExport } from "./company-report-pdf-export"

const pdf = vi.hoisted(() => ({ exportReportPdf: vi.fn() }))
const i18n = vi.hoisted(() => ({ useMessages: vi.fn() }))

vi.mock("@/lib/report-pdf", () => pdf)
vi.mock("@/lib/i18n", () => ({ useMessages: i18n.useMessages }))
vi.mock("next/image", () => ({ default: () => null }))

// Las tarjetas que piden sus datos por su cuenta tienen sus propios tests: acá solo importa que estén.
vi.mock("./participation-cards", async () => {
  const { createElement } = await import("react")
  return { ParticipationCards: () => createElement("div", null, "Tarjetas de participación") }
})
vi.mock("./financial-health-card", async () => {
  const { createElement } = await import("react")
  return { FinancialHealthCard: () => createElement("div", null, "Tarjeta de salud financiera") }
})
vi.mock("./education-metrics-card", async () => {
  const { createElement } = await import("react")
  return { EducationMetricsCard: () => createElement("div", null, "Tarjeta de cursos") }
})
vi.mock("./department-metrics-section", async () => {
  const { createElement } = await import("react")
  return { DepartmentMetricsSection: () => createElement("div", null, "Tabla por departamento") }
})
vi.mock("./company-trends-card", async () => {
  const { createElement } = await import("react")
  return { CompanyTrendsCard: () => createElement("div", null, "Tarjeta de tendencias") }
})

const insights: CompanyInsightsDto = {
  period: "2026-09-01",
  isAnonymized: false,
  minimumGroupSize: 3,
  measuredEmployees: 8,
  concerns: [{ concern: "LowSavings", affectedEmployees: 4, evaluatedEmployees: 8, percentage: 50 }],
  recommendations: [],
  recommendationsAvailable: false,
}

const noMetrics: CompanyMetricsState = { metrics: [], error: null, isLoading: false }

function renderExport({
  onComplete = vi.fn(),
  onError = vi.fn(),
  metrics = noMetrics,
}: { onComplete?: () => void; onError?: (error: unknown) => void; metrics?: CompanyMetricsState } = {}) {
  render(
    <CompanyReportPdfExport
      generatedAt={new Date(2026, 9, 25, 15, 30)}
      companyName="Acme S.A."
      insights={{ insights, isLoading: false, hasFailed: false }}
      metrics={metrics}
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

  it("puts the company and the generation date in the header", () => {
    renderExport()

    expect(screen.getByText("Reporte de Bienestar Financiero")).not.toBeNull()
    expect(screen.getByText("Acme S.A.")).not.toBeNull()
    expect(screen.getByText("Generado el")).not.toBeNull()
  })

  it("has the same sections as the panel, in the same order", () => {
    renderExport()

    const titles = screen.getAllByRole("heading", { level: 2, hidden: true }).map((heading) => heading.textContent)
    expect(titles).toEqual(["Indicadores", "Evolución", "Por Departamento", "Principales Preocupaciones", "Análisis"])
    expect(screen.getByText("Tarjetas de participación")).not.toBeNull()
    expect(screen.getByText("Tarjeta de salud financiera")).not.toBeNull()
    expect(screen.getByText("Tarjeta de cursos")).not.toBeNull()
    expect(screen.getByText("Tabla por departamento")).not.toBeNull()
    expect(screen.getByText("Tarjeta de tendencias")).not.toBeNull()
  })

  it("explains which period each indicator card looks at", () => {
    renderExport()

    expect(screen.getByText(/la participación es la del mes en curso \(todavía parcial\)/)).not.toBeNull()
    expect(screen.getByText(/la salud financiera es la del último mes cerrado/)).not.toBeNull()
  })

  it("shows the concerns the panel already loaded and the charts with what the panel shows", () => {
    const message = "Las métricas no están disponibles para preservar el anonimato de grupos pequeños."
    renderExport({ metrics: { metrics: [], error: message, isLoading: false } })

    expect(screen.getByText("Ahorro bajo")).not.toBeNull()
    expect(screen.getByText("Participación de Empleados")).not.toBeNull()
    expect(screen.getAllByText(message)).toHaveLength(2)
    expect(screen.getByText(/ningún dato identifica a un empleado/)).not.toBeNull()
  })

  it("exports the PDF named after the generation date and reports when it finished", async () => {
    const onComplete = vi.fn()
    renderExport({ onComplete })

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1))
    expect(pdf.exportReportPdf).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      "reporte-empresa_20261025.pdf",
      expect.any(AbortSignal),
    )
  })

  it("reports a failure to generate the PDF", async () => {
    const onError = vi.fn()
    pdf.exportReportPdf.mockRejectedValue(new Error("canvas"))
    renderExport({ onError })

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1))
  })
})
