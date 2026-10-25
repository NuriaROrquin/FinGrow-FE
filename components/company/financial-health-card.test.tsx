import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { CompanyMetricsDto } from "@/lib/api"
import { FinancialHealthCard } from "./financial-health-card"

const api = vi.hoisted(() => ({
  getCompanyMetrics: vi.fn(),
  isApiError: vi.fn((error: unknown) => typeof error === "object" && error !== null && "code" in error),
  toastApiError: vi.fn(),
}))

vi.mock("@/lib/api", () => api)

function month(period: string, averageFinancialHealthScore: number | null): CompanyMetricsDto {
  return {
    period,
    fiscalYear: 2026,
    activeEmployees: 8,
    participatingEmployees: 6,
    participationRate: 75,
    confirmedTransactions: 120,
    employeesWithBudget: 5,
    employeesWithActiveGoal: 4,
    goalsAchieved: 1,
    employeesWithIntegration: 3,
    averageFinancialHealthScore,
    financialHealthBand: averageFinancialHealthScore === null ? null : "Stable",
    isMetricsHidden: averageFinancialHealthScore === null,
    minimumGroupSize: 3,
    hiddenReason: averageFinancialHealthScore === null ? "hidden" : null,
  }
}

describe("FinancialHealthCard", () => {
  afterEach(cleanup)
  beforeEach(() => vi.clearAllMocks())

  it("shows the score of the latest closed month and its change against the previous one", async () => {
    api.getCompanyMetrics.mockResolvedValue([month("2026-09-01", 72.25), month("2026-08-01", 68.75)])
    render(<FinancialHealthCard />)

    expect(await screen.findByText("72,25/100")).not.toBeNull()
    expect(screen.getByText("Estable")).not.toBeNull()
    expect(screen.getByText("+3,5 puntos vs. agosto")).not.toBeNull()
    expect(screen.getByText("Promedio de septiembre de 2026")).not.toBeNull()
  })

  it("shows a decrease with its sign", async () => {
    api.getCompanyMetrics.mockResolvedValue([month("2026-08-01", 70), month("2026-09-01", 69)])
    render(<FinancialHealthCard />)

    expect(await screen.findByText("69/100")).not.toBeNull()
    expect(screen.getByText("Estable")).not.toBeNull()
    expect(screen.getByText("−1 punto vs. agosto")).not.toBeNull()
  })

  it("omits the change when the previous month has its score hidden", async () => {
    api.getCompanyMetrics.mockResolvedValue([
      month("2026-08-01", null),
      month("2026-09-01", 64),
    ])
    render(<FinancialHealthCard />)

    expect(await screen.findByText("64/100")).not.toBeNull()
    expect(screen.getByText("Estable")).not.toBeNull()
    expect(screen.queryByText(/vs\./)).toBeNull()
  })

  it("hides the score instead of showing zero when the latest month has it hidden", async () => {
    api.getCompanyMetrics.mockResolvedValue([month("2026-08-01", 70), month("2026-09-01", null)])
    render(<FinancialHealthCard />)

    expect(await screen.findByText(/sin identificar a nadie/)).not.toBeNull()
    expect(screen.getByText("—")).not.toBeNull()
    expect(screen.queryByText(/\/100/)).toBeNull()
  })

  it("treats an anonymized response as hidden without a toast", async () => {
    api.getCompanyMetrics.mockRejectedValue({ code: "Metrics.Anonymized", status: 503 })
    render(<FinancialHealthCard />)

    expect(await screen.findByText(/sin identificar a nadie/)).not.toBeNull()
    expect(api.toastApiError).not.toHaveBeenCalled()
  })

  it("explains that there are no closed months yet", async () => {
    api.getCompanyMetrics.mockResolvedValue([])
    render(<FinancialHealthCard />)

    expect(await screen.findByText("Todavía no hay meses cerrados para calcularla.")).not.toBeNull()
  })

  it("shows the error state and notifies it", async () => {
    api.getCompanyMetrics.mockRejectedValue(new Error("boom"))
    render(<FinancialHealthCard />)

    expect(await screen.findByText("No disponible")).not.toBeNull()
    await waitFor(() => expect(api.toastApiError).toHaveBeenCalled())
  })

  it("does not render the old hardcoded values", async () => {
    api.getCompanyMetrics.mockResolvedValue([month("2026-09-01", 55)])
    render(<FinancialHealthCard />)

    expect(await screen.findByText("55/100")).not.toBeNull()
    expect(screen.getByText("Estable")).not.toBeNull()
    expect(screen.queryByText(/73\/100/)).toBeNull()
    expect(screen.queryByText(/este trimestre/)).toBeNull()
  })
})
