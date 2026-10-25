import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { es } from "@/lib/i18n/es"
import type { CompanyTrendsDto } from "@/lib/api"
import { CompanyTrendsCard } from "./company-trends-card"

const api = vi.hoisted(() => ({
  getCompanyTrends: vi.fn(),
}))
const i18n = vi.hoisted(() => ({
  useMessages: vi.fn(),
}))

vi.mock("@/lib/api", () => api)
vi.mock("@/lib/i18n", () => ({ useMessages: i18n.useMessages }))

function trends(overrides: Partial<CompanyTrendsDto> = {}): CompanyTrendsDto {
  return {
    period: "2026-09-01",
    previousPeriod: "2026-08-01",
    isAnonymized: false,
    minimumGroupSize: 3,
    positiveTrends: [
      { indicator: "ParticipationRate", unit: "Percentage", previousValue: 50, currentValue: 80, change: 30 },
      { indicator: "LowSavings", unit: "Percentage", previousValue: 75, currentValue: 60, change: -15 },
      { indicator: "AverageFinancialHealthScore", unit: "Points", previousValue: 60, currentValue: 72.25, change: 12.25 },
      { indicator: "CompletedCourses", unit: "Count", previousValue: 2, currentValue: 6, change: 4 },
    ],
    opportunities: [{ indicator: "GoalAdoption", unit: "Percentage", previousValue: 40, currentValue: 30, change: -10 }],
    ...overrides,
  }
}

describe("CompanyTrendsCard", () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    i18n.useMessages.mockReturnValue(es)
  })

  it("renders the loading state", () => {
    api.getCompanyTrends.mockReturnValue(new Promise(() => undefined))
    render(<CompanyTrendsCard />)

    expect(screen.getByTestId("company-trends-loading")).not.toBeNull()
  })

  it("splits the trends into positive ones and opportunities, with the months compared", async () => {
    api.getCompanyTrends.mockResolvedValue(trends())
    render(<CompanyTrendsCard />)

    const positive = await screen.findByRole("region", { name: "Tendencias positivas" })
    const opportunities = screen.getByRole("region", { name: "Oportunidades de mejora" })

    expect(screen.getByText("septiembre de 2026 comparado con agosto de 2026")).not.toBeNull()
    expect(within(positive).getByText("Participación")).not.toBeNull()
    expect(within(positive).getByText("+30 p.p.")).not.toBeNull()
    expect(within(positive).getByText("De 50% a 80%")).not.toBeNull()
    expect(within(positive).getByText("Empleados con ahorro bajo")).not.toBeNull()
    expect(within(positive).getByText("-15 p.p.")).not.toBeNull()
    expect(within(positive).getByText("+12,25 puntos")).not.toBeNull()
    expect(within(positive).getByText("De 60/100 a 72,25/100")).not.toBeNull()
    expect(within(positive).getByText("De 2 a 6")).not.toBeNull()
    expect(within(opportunities).getByText("Empleados con metas activas")).not.toBeNull()
    expect(within(opportunities).getByText("-10 p.p.")).not.toBeNull()
    expect(screen.getByText(/Un cambio menor a 2 puntos se considera estable/)).not.toBeNull()
  })

  it("keeps the order sent by the backend", async () => {
    api.getCompanyTrends.mockResolvedValue(trends())
    render(<CompanyTrendsCard />)

    const positive = await screen.findByRole("region", { name: "Tendencias positivas" })
    const labels = within(positive)
      .getAllByRole("listitem")
      .map((item) => item.querySelector("p")?.textContent)

    expect(labels).toEqual(["Participación", "Empleados con ahorro bajo", "Salud financiera promedio", "Cursos completados"])
  })

  it("says so when only one side has trends", async () => {
    api.getCompanyTrends.mockResolvedValue(trends({ opportunities: [] }))
    render(<CompanyTrendsCard />)

    expect(await screen.findByText("Ningún indicador empeoró de forma significativa.")).not.toBeNull()
  })

  it("says there were no significant changes when both lists are empty", async () => {
    api.getCompanyTrends.mockResolvedValue(trends({ positiveTrends: [], opportunities: [] }))
    render(<CompanyTrendsCard />)

    expect(await screen.findByText("Sin cambios significativos entre agosto de 2026 y septiembre de 2026.")).not.toBeNull()
  })

  it("asks for a second month when there is only one", async () => {
    api.getCompanyTrends.mockResolvedValue(trends({ previousPeriod: null, positiveTrends: [], opportunities: [] }))
    render(<CompanyTrendsCard />)

    expect(await screen.findByText(/Por ahora solo está septiembre de 2026/)).not.toBeNull()
    expect(screen.queryByText(/se considera estable/)).toBeNull()
  })

  it("explains that there are no closed months yet", async () => {
    api.getCompanyTrends.mockResolvedValue(
      trends({ period: null, previousPeriod: null, positiveTrends: [], opportunities: [] }),
    )
    render(<CompanyTrendsCard />)

    expect(await screen.findByText("Todavía no hay meses cerrados para analizar.")).not.toBeNull()
  })

  it("hides the trends when a month is too small to stay anonymous", async () => {
    api.getCompanyTrends.mockResolvedValue(trends({ isAnonymized: true, positiveTrends: [], opportunities: [] }))
    render(<CompanyTrendsCard />)

    expect(await screen.findByText(/menos de 3 empleados activos/)).not.toBeNull()
    expect(screen.queryByRole("region", { name: "Tendencias positivas" })).toBeNull()
  })

  it("shows an error when the trends cannot be loaded", async () => {
    api.getCompanyTrends.mockRejectedValue(new Error("boom"))
    render(<CompanyTrendsCard />)

    expect(await screen.findByText("No se pudieron cargar las tendencias.")).not.toBeNull()
  })
})
