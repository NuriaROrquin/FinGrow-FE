import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import type { CompanyInsightsDto } from "@/lib/api"
import { CompanyRecommendationsCard } from "./company-recommendations-card"

function insights(overrides: Partial<CompanyInsightsDto> = {}): CompanyInsightsDto {
  return {
    period: "2026-09-01",
    isAnonymized: false,
    minimumGroupSize: 3,
    measuredEmployees: 12,
    concerns: [{ concern: "ThinCushion", affectedEmployees: 5, evaluatedEmployees: 12, percentage: 41.67 }],
    recommendations: [
      { kind: "Warning", title: "Reforzá el fondo de emergencia", body: "Un taller puede ayudar.", action: "None" },
      { kind: "Tip", title: "Acompañá los presupuestos", body: "Una charla breve.", action: "None" },
      { kind: "Positive", title: "La participación es alta", body: "Comunicalo.", action: "None" },
    ],
    recommendationsAvailable: true,
    ...overrides,
  }
}

describe("CompanyRecommendationsCard", () => {
  afterEach(cleanup)

  it("renders the loading state", () => {
    render(<CompanyRecommendationsCard insights={null} isLoading hasFailed={false} />)

    expect(screen.getByTestId("company-recommendations-loading")).not.toBeNull()
  })

  it("shows the recommendations without links and the disclaimer", () => {
    render(<CompanyRecommendationsCard insights={insights()} isLoading={false} hasFailed={false} />)

    expect(screen.getByText("Reforzá el fondo de emergencia")).not.toBeNull()
    expect(screen.getByText("Acompañá los presupuestos")).not.toBeNull()
    expect(screen.getByText("La participación es alta")).not.toBeNull()
    expect(screen.queryByRole("link")).toBeNull()
    expect(screen.getByText(/no constituyen asesoramiento financiero certificado/)).not.toBeNull()
    expect(screen.getByText(/anónimos de septiembre de 2026/)).not.toBeNull()
  })

  it("keeps the screen working when the AI is down", () => {
    render(
      <CompanyRecommendationsCard
        insights={insights({ recommendations: [], recommendationsAvailable: false })}
        isLoading={false}
        hasFailed={false}
      />,
    )

    expect(screen.getByText(/No pudimos generar recomendaciones ahora/)).not.toBeNull()
    expect(screen.queryByText(/asesoramiento financiero certificado/)).toBeNull()
  })

  it("hides the recommendations when too few employees were measured", () => {
    render(
      <CompanyRecommendationsCard
        insights={insights({ isAnonymized: true, measuredEmployees: null, recommendations: [], recommendationsAvailable: false })}
        isLoading={false}
        hasFailed={false}
      />,
    )

    expect(screen.getByText(/para no identificar a nadie/)).not.toBeNull()
  })

  it("explains that there are no closed months yet", () => {
    render(
      <CompanyRecommendationsCard
        insights={insights({ period: null, measuredEmployees: null, recommendations: [], recommendationsAvailable: false })}
        isLoading={false}
        hasFailed={false}
      />,
    )

    expect(screen.getByText("Todavía no hay meses cerrados para analizar.")).not.toBeNull()
  })

  it("shows an error when the request failed", () => {
    render(<CompanyRecommendationsCard insights={null} isLoading={false} hasFailed />)

    expect(screen.getByText("No se pudieron cargar las recomendaciones.")).not.toBeNull()
  })
})
