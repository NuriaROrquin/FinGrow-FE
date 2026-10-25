import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import type { CompanyInsightsDto } from "@/lib/api"
import { FinancialConcernsCard } from "./financial-concerns-card"

function insights(overrides: Partial<CompanyInsightsDto> = {}): CompanyInsightsDto {
  return {
    period: "2026-09-01",
    isAnonymized: false,
    minimumGroupSize: 3,
    measuredEmployees: 12,
    concerns: [
      { concern: "BudgetOverruns", affectedEmployees: 6, evaluatedEmployees: 8, percentage: 75 },
      { concern: "ThinCushion", affectedEmployees: 5, evaluatedEmployees: 12, percentage: 41.67 },
    ],
    recommendations: [],
    recommendationsAvailable: false,
    ...overrides,
  }
}

describe("FinancialConcernsCard", () => {
  afterEach(cleanup)

  it("renders the loading state", () => {
    render(<FinancialConcernsCard insights={null} isLoading hasFailed={false} />)

    expect(screen.getByTestId("financial-concerns-loading")).not.toBeNull()
  })

  it("lists the concerns in the order sent by the backend, with who was measured", () => {
    render(<FinancialConcernsCard insights={insights()} isLoading={false} hasFailed={false} />)

    const items = within(screen.getByRole("list")).getAllByRole("listitem")
    expect(items).toHaveLength(2)
    expect(within(items[0]).getByText("Presupuestos excedidos")).not.toBeNull()
    expect(within(items[0]).getByText("75%")).not.toBeNull()
    expect(within(items[0]).getByText("6 de 8 empleados con presupuesto")).not.toBeNull()
    expect(within(items[1]).getByText("Fondo de emergencia insuficiente")).not.toBeNull()
    expect(within(items[1]).getByText("41,7%")).not.toBeNull()
    expect(within(items[1]).getByText("5 de 12 empleados medidos")).not.toBeNull()
    expect(screen.getByText("septiembre de 2026 · 12 empleados medidos")).not.toBeNull()
    expect(screen.getByText(/afectan al menos a 3 empleados/)).not.toBeNull()
  })

  it("explains that there are no concerns that affect enough employees", () => {
    render(<FinancialConcernsCard insights={insights({ concerns: [] })} isLoading={false} hasFailed={false} />)

    expect(screen.getByText(/no hubo preocupaciones que afecten a 3 empleados o más/)).not.toBeNull()
  })

  it("hides everything when too few employees were measured", () => {
    render(
      <FinancialConcernsCard
        insights={insights({ isAnonymized: true, measuredEmployees: null, concerns: [] })}
        isLoading={false}
        hasFailed={false}
      />,
    )

    expect(screen.getByText(/para no identificar a nadie/)).not.toBeNull()
    expect(screen.queryByRole("list")).toBeNull()
  })

  it("explains that there are no closed months yet", () => {
    render(
      <FinancialConcernsCard
        insights={insights({ period: null, measuredEmployees: null, concerns: [] })}
        isLoading={false}
        hasFailed={false}
      />,
    )

    expect(screen.getByText("Todavía no hay meses cerrados para analizar.")).not.toBeNull()
  })

  it("shows an error when the request failed", () => {
    render(<FinancialConcernsCard insights={null} isLoading={false} hasFailed />)

    expect(screen.getByText("No se pudieron cargar las preocupaciones financieras.")).not.toBeNull()
  })
})
