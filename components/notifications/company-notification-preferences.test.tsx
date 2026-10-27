import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { es } from "@/lib/i18n/es"
import type { CompanyNotificationTypePreferenceDto } from "@/lib/api"
import { CompanyNotificationPreferences } from "./company-notification-preferences"

const api = vi.hoisted(() => ({
  listCompanyNotificationTypePreferences: vi.fn(),
  updateCompanyNotificationTypePreference: vi.fn(),
  toastApiError: vi.fn(),
}))
const i18n = vi.hoisted(() => ({
  useMessages: vi.fn(),
}))

vi.mock("@/lib/api", () => api)
vi.mock("@/lib/i18n", () => ({ useMessages: i18n.useMessages }))
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }))

const preferences: CompanyNotificationTypePreferenceDto[] = [
  { type: "FinancialWellbeingLow", isEnabled: false, cadence: "Monthly", threshold: null },
  { type: "ParticipationLow", isEnabled: false, cadence: "Monthly", threshold: null },
  { type: "EmployeeAdded", isEnabled: false, cadence: "Weekly", threshold: null },
  { type: "EmployeeRemoved", isEnabled: false, cadence: "Weekly", threshold: null },
  { type: "MonthlyReport", isEnabled: false, cadence: "Monthly", threshold: null },
]

const switchNames: Record<CompanyNotificationTypePreferenceDto["type"], RegExp> = {
  FinancialWellbeingLow: /Bienestar/,
  ParticipationLow: /Participación/,
  EmployeeAdded: /Altas/,
  EmployeeRemoved: /Bajas/,
  MonthlyReport: /Reportes mensuales/,
}

describe("CompanyNotificationPreferences", () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    i18n.useMessages.mockReturnValue(es)
    api.listCompanyNotificationTypePreferences.mockResolvedValue(preferences)
    api.updateCompanyNotificationTypePreference.mockImplementation(
      (_type: string, payload: CompanyNotificationTypePreferenceDto) => Promise.resolve(payload),
    )
  })

  it("renders all company alerts disabled when the API has no persisted enabled preferences", async () => {
    render(<CompanyNotificationPreferences />)

    expect(await screen.findByText("Bienestar financiero")).not.toBeNull()
    for (const preference of preferences) {
      expect(screen.getByRole("switch", { name: switchNames[preference.type] }).getAttribute("data-state")).toBe("unchecked")
    }
  })

  it("falls back to Spanish company notification messages when the active locale is missing them", async () => {
    const incompleteMessages = {
      ...es,
      settings: {
        ...es.settings,
        notifications: { ...es.settings.notifications },
      },
    }
    Reflect.deleteProperty(incompleteMessages.settings.notifications, "company")
    i18n.useMessages.mockReturnValue(incompleteMessages)
    api.listCompanyNotificationTypePreferences.mockReturnValue(new Promise(() => {}))

    render(<CompanyNotificationPreferences />)

    expect(await screen.findByText("Cargando las preferencias de la empresa...")).not.toBeNull()
  })

  it("validates thresholds and sends the fixed monthly payload", async () => {
    const user = userEvent.setup()
    render(<CompanyNotificationPreferences />)

    const toggle = await screen.findByRole("switch", { name: "Bienestar financiero" })
    await user.click(toggle)
    const threshold = screen.getByLabelText("Alertar si el bienestar financiero promedio es menor a")
    await user.clear(threshold)
    await user.type(threshold, "0")

    expect(screen.getByText("Ingresá un valor entre 1 y 100.")).not.toBeNull()
    expect(screen.getByRole("button", { name: "Guardar cambios" }).hasAttribute("disabled")).toBe(true)

    await user.clear(threshold)
    await user.type(threshold, "60")
    expect(api.updateCompanyNotificationTypePreference).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))

    await waitFor(() => expect(api.updateCompanyNotificationTypePreference).toHaveBeenCalledWith(
      "FinancialWellbeingLow",
      { isEnabled: true, cadence: "Monthly", threshold: 60 },
    ))
  })

  it("does not show frequency controls and preserves the saved cadence for employee summaries", async () => {
    const user = userEvent.setup()
    render(<CompanyNotificationPreferences />)

    await user.click(await screen.findByRole("switch", { name: "Altas de empleados" }))
    expect(screen.queryByRole("combobox", { name: "Frecuencia" })).toBeNull()
    expect(api.updateCompanyNotificationTypePreference).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))

    await waitFor(() => expect(api.updateCompanyNotificationTypePreference).toHaveBeenCalledWith(
      "EmployeeAdded",
      { isEnabled: true, cadence: "Weekly", threshold: null },
    ))

    await user.click(screen.getByRole("switch", { name: "Bajas definitivas" }))
    expect(screen.queryByRole("combobox", { name: "Frecuencia" })).toBeNull()
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))

    await waitFor(() => expect(api.updateCompanyNotificationTypePreference).toHaveBeenCalledWith(
      "EmployeeRemoved",
      { isEnabled: true, cadence: "Weekly", threshold: null },
    ))
  })

  it("turns on the monthly report as a monthly preference without threshold", async () => {
    const user = userEvent.setup()
    render(<CompanyNotificationPreferences />)

    await user.click(await screen.findByRole("switch", { name: "Reportes mensuales" }))
    expect(screen.queryByLabelText(/Alertar si/)).toBeNull()
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))

    await waitFor(() => expect(api.updateCompanyNotificationTypePreference).toHaveBeenCalledWith(
      "MonthlyReport",
      { isEnabled: true, cadence: "Monthly", threshold: null },
    ))
    expect(api.updateCompanyNotificationTypePreference).toHaveBeenCalledTimes(1)
  })

  it("displays the expanded metric help", async () => {
    const user = userEvent.setup()
    render(<CompanyNotificationPreferences />)

    await user.click(await screen.findByRole("button", { name: "¿Qué mide el bienestar financiero?" }))
    expect(screen.getByText("Ahorro: 40 %. Relación entre ingresos y gastos del mes.")).not.toBeNull()
    await user.click(screen.getByRole("button", { name: "¿Qué mide la participación?" }))
    expect(screen.getByText("participación = empleados activos con actividad / total de empleados activos × 100")).not.toBeNull()
  })

  it("rolls back all draft changes when the final save fails", async () => {
    api.listCompanyNotificationTypePreferences.mockResolvedValue([
      { ...preferences[0], isEnabled: true, threshold: 60 },
      ...preferences.slice(1),
    ])
    api.updateCompanyNotificationTypePreference.mockRejectedValueOnce(new Error("network"))
    render(<CompanyNotificationPreferences />)

    const toggle = await screen.findByRole("switch", { name: "Bienestar financiero" })
    fireEvent.click(toggle)

    expect(toggle.getAttribute("data-state")).toBe("unchecked")
    expect(api.updateCompanyNotificationTypePreference).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }))

    await waitFor(() => expect(toggle.getAttribute("data-state")).toBe("checked"))
    expect(api.toastApiError).toHaveBeenCalled()
  })
})
