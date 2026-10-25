import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { DepartmentMetricsSummary } from "@/lib/api"
import { DepartmentMetricsSection } from "./department-metrics-section"

const api = vi.hoisted(() => ({
  getDepartmentMetrics: vi.fn(),
  toastApiError: vi.fn(),
}))

vi.mock("@/lib/api", () => api)

function department(overrides: Partial<DepartmentMetricsSummary> = {}): DepartmentMetricsSummary {
  return {
    departmentId: "1",
    departmentName: "Ventas",
    period: "2026-09-01",
    activeEmployees: 8,
    participatingEmployees: 6,
    participationRate: 75,
    averageFinancialHealthScore: 72.5,
    financialHealthBand: "Stable",
    isMetricsHidden: false,
    minimumGroupSize: 3,
    hiddenReason: null,
    ...overrides,
  }
}

describe("DepartmentMetricsSection", () => {
  afterEach(cleanup)
  beforeEach(() => vi.clearAllMocks())

  it("renders the loading state", () => {
    api.getDepartmentMetrics.mockReturnValue(new Promise(() => {}))
    render(<DepartmentMetricsSection />)
    expect(screen.getByTestId("department-metrics-loading")).not.toBeNull()
  })

  it("renders the real departments in the order sent by the backend, with formatted values", async () => {
    api.getDepartmentMetrics.mockResolvedValue([
      department({
        departmentId: "2",
        departmentName: "Zeta",
        activeEmployees: 11,
        averageFinancialHealthScore: 66.666,
        participationRate: 80.5,
      }),
      department({ departmentId: "1", departmentName: "Alfa" }),
    ])
    render(<DepartmentMetricsSection />)

    const rows = await screen.findAllByTestId("department-metrics-row")
    expect(rows).toHaveLength(2)
    expect(within(rows[0]).getByText("Zeta")).not.toBeNull()
    expect(within(rows[0]).getByText("11")).not.toBeNull()
    expect(within(rows[0]).getByText("66,67/100")).not.toBeNull()
    expect(within(rows[0]).getByText("80,5%")).not.toBeNull()
    expect(within(rows[1]).getByText("Alfa")).not.toBeNull()
    expect(within(rows[1]).getByText("72,5/100")).not.toBeNull()
    expect(within(rows[1]).getByText("75%")).not.toBeNull()
  })

  it("does not render hardcoded departments or legacy labels", async () => {
    api.getDepartmentMetrics.mockResolvedValue([department({ departmentName: "Logística" })])
    render(<DepartmentMetricsSection />)

    expect(await screen.findByText("Logística")).not.toBeNull()
    for (const invented of ["Ingeniería", "Ventas", "Marketing", "Operaciones", "RRHH"]) {
      expect(screen.queryByText(invented)).toBeNull()
    }
    expect(screen.queryByText("Excelente")).toBeNull()
    expect(screen.queryByText("Bueno")).toBeNull()
    expect(screen.queryByText("Necesita Atención")).toBeNull()
  })

  it.each([
    ["Critical", "Crítica"],
    ["Fragile", "Frágil"],
    ["Stable", "Estable"],
    ["Healthy", "Saludable"],
  ] as const)("translates %s as %s", async (status, label) => {
    api.getDepartmentMetrics.mockResolvedValue([department({ financialHealthBand: status })])
    render(<DepartmentMetricsSection />)
    expect(await screen.findByText(label)).not.toBeNull()
  })

  it("takes the status only from the backend, whatever the score", async () => {
    api.getDepartmentMetrics.mockResolvedValue([
      department({
        departmentId: "1",
        departmentName: "Alta",
        averageFinancialHealthScore: 95,
        financialHealthBand: "Critical",
      }),
      department({
        departmentId: "2",
        departmentName: "Baja",
        averageFinancialHealthScore: 10,
        financialHealthBand: "Healthy",
      }),
    ])
    render(<DepartmentMetricsSection />)

    const rows = await screen.findAllByTestId("department-metrics-row")
    expect(within(rows[0]).getByText("Crítica")).not.toBeNull()
    expect(within(rows[1]).getByText("Saludable")).not.toBeNull()
  })

  it("shows a dash for null values instead of zeros", async () => {
    api.getDepartmentMetrics.mockResolvedValue([
      department({
        activeEmployees: null,
        averageFinancialHealthScore: null,
        participationRate: null,
        financialHealthBand: null,
      }),
    ])
    render(<DepartmentMetricsSection />)

    expect(await screen.findByText("Ventas")).not.toBeNull()
    expect(screen.getAllByText("—")).toHaveLength(4)
    expect(screen.queryByText("0")).toBeNull()
    expect(screen.queryByText("0%")).toBeNull()
  })

  it("shows restricted metrics with the reason and minimum size, and no values", async () => {
    api.getDepartmentMetrics.mockResolvedValue([
      department({
        departmentName: "Marketing",
        isMetricsHidden: true,
        hiddenReason: "No hay suficientes empleados para mostrar esta metrica de forma anonimizada.",
        activeEmployees: 2,
        averageFinancialHealthScore: 50,
        participationRate: 40,
        financialHealthBand: "Fragile",
      }),
    ])
    render(<DepartmentMetricsSection />)

    expect(await screen.findByText("Métricas restringidas")).not.toBeNull()
    expect(screen.getByText(/No hay suficientes empleados/)).not.toBeNull()
    expect(screen.getByText("Se requiere un mínimo de 3 empleados.")).not.toBeNull()
    expect(screen.queryByText("Sin datos disponibles")).toBeNull()
    expect(screen.queryByText(/\/100/)).toBeNull()
    expect(screen.queryByText("40%")).toBeNull()
    expect(screen.queryByText("Frágil")).toBeNull()
    expect(screen.queryByText("—")).toBeNull()
  })

  it("shows a no-data state keeping the department name when there is no period", async () => {
    api.getDepartmentMetrics.mockResolvedValue([
      department({
        departmentName: "Soporte",
        period: null,
        activeEmployees: null,
        averageFinancialHealthScore: null,
        participationRate: null,
        financialHealthBand: null,
      }),
    ])
    render(<DepartmentMetricsSection />)

    expect(await screen.findByText("Soporte")).not.toBeNull()
    expect(screen.getByText("Sin datos disponibles")).not.toBeNull()
    expect(screen.queryByText("Métricas restringidas")).toBeNull()
    expect(screen.queryByText("0")).toBeNull()
  })

  it("shows an empty state when there are no departments", async () => {
    api.getDepartmentMetrics.mockResolvedValue([])
    render(<DepartmentMetricsSection />)
    expect(await screen.findByText("No hay departamentos disponibles")).not.toBeNull()
  })

  it("shows an error and retries the request", async () => {
    api.getDepartmentMetrics.mockRejectedValueOnce(new Error("boom"))
    api.getDepartmentMetrics.mockResolvedValueOnce([department({ departmentName: "Finanzas" })])
    render(<DepartmentMetricsSection />)

    expect(await screen.findByRole("alert")).not.toBeNull()
    await waitFor(() => expect(api.toastApiError).toHaveBeenCalled())

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }))

    expect(await screen.findByText("Finanzas")).not.toBeNull()
    expect(screen.queryByRole("alert")).toBeNull()
    expect(api.getDepartmentMetrics).toHaveBeenCalledTimes(2)
  })

  it("sorts by a column on click and inverts the order on a second click", async () => {
    api.getDepartmentMetrics.mockResolvedValue([
      department({ departmentId: "1", departmentName: "Ventas", averageFinancialHealthScore: 72.5 }),
      department({ departmentId: "2", departmentName: "Administración", averageFinancialHealthScore: 40 }),
      department({ departmentId: "3", departmentName: "Logística", averageFinancialHealthScore: 91 }),
    ])
    render(<DepartmentMetricsSection />)
    await screen.findAllByTestId("department-metrics-row")

    const rowNames = () =>
      screen.getAllByTestId("department-metrics-row").map((row) => within(row).getAllByRole("cell")[0].textContent)
    const header = () => screen.getByRole("columnheader", { name: /Departamento/ })

    fireEvent.click(screen.getByRole("button", { name: "Departamento" }))
    expect(rowNames()).toEqual(["Administración", "Logística", "Ventas"])
    expect(header().getAttribute("aria-sort")).toBe("ascending")

    fireEvent.click(screen.getByRole("button", { name: "Departamento" }))
    expect(rowNames()).toEqual(["Ventas", "Logística", "Administración"])
    expect(header().getAttribute("aria-sort")).toBe("descending")

    fireEvent.click(screen.getByRole("button", { name: "Puntaje Promedio" }))
    expect(rowNames()).toEqual(["Logística", "Ventas", "Administración"])
  })

  it("puts departments with restricted metrics last, without using their hidden values", async () => {
    api.getDepartmentMetrics.mockResolvedValue([
      department({ departmentId: "1", departmentName: "Oculto", isMetricsHidden: true, averageFinancialHealthScore: 99 }),
      department({ departmentId: "2", departmentName: "Bajo", averageFinancialHealthScore: 20 }),
      department({ departmentId: "3", departmentName: "Alto", averageFinancialHealthScore: 80 }),
    ])
    render(<DepartmentMetricsSection />)
    await screen.findAllByTestId("department-metrics-row")

    const rowNames = () =>
      screen.getAllByTestId("department-metrics-row").map((row) => within(row).getAllByRole("cell")[0].textContent)

    fireEvent.click(screen.getByRole("button", { name: "Puntaje Promedio" }))
    expect(rowNames()).toEqual(["Alto", "Bajo", "Oculto"])

    fireEvent.click(screen.getByRole("button", { name: "Puntaje Promedio" }))
    expect(rowNames()).toEqual(["Bajo", "Alto", "Oculto"])
  })

  it("calls the overview endpoint only once on load", async () => {
    api.getDepartmentMetrics.mockResolvedValue([department()])
    render(<DepartmentMetricsSection />)

    await screen.findByText("Ventas")
    expect(api.getDepartmentMetrics).toHaveBeenCalledTimes(1)
  })
})
