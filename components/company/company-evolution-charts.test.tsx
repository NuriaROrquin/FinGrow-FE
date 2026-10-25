import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { CompanyMetricsDto } from "@/lib/api"
import { CompanyEvolutionCharts } from "./company-evolution-charts"

function month(overrides: Partial<CompanyMetricsDto> = {}): CompanyMetricsDto {
  return {
    period: "2026-09-01",
    fiscalYear: 2026,
    activeEmployees: 10,
    participatingEmployees: 8,
    participationRate: 80,
    confirmedTransactions: 120,
    employeesWithBudget: 2,
    employeesWithActiveGoal: 3,
    goalsAchieved: 4,
    employeesWithIntegration: 3,
    averageFinancialHealthScore: null,
    financialHealthBand: null,
    isMetricsHidden: false,
    minimumGroupSize: 3,
    hiddenReason: null,
    ...overrides,
  }
}

describe("CompanyEvolutionCharts", () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it("shows the error of the request in both charts", () => {
    render(<CompanyEvolutionCharts metrics={[]} error="No se pudieron cargar las métricas." isLoading={false} />)

    expect(screen.getAllByText("No se pudieron cargar las métricas.")).toHaveLength(2)
  })

  it("says there are no periods when there is no photographed month", () => {
    render(<CompanyEvolutionCharts metrics={[]} error={null} isLoading={false} />)

    expect(screen.getAllByText("No hay períodos para mostrar.")).toHaveLength(2)
  })

  it("explains that the score is hidden when no month can show it", () => {
    // El gráfico de participación sí se dibuja, y recharts necesita ResizeObserver, que jsdom no trae.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
    render(
      <CompanyEvolutionCharts
        metrics={[month({ period: "2026-08-01", isMetricsHidden: true, participationRate: null }), month()]}
        error={null}
        isLoading={false}
      />,
    )

    expect(screen.getByText(/El puntaje se oculta en los meses con pocos empleados/)).not.toBeNull()
  })
})
