import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ResetPasswordForm } from "./reset-password-form"

const INVALID_LINK = "PasswordReset.EnlaceInvalido"

const api = vi.hoisted(() => ({
  validatePasswordResetToken: vi.fn(),
  resetPassword: vi.fn(),
  toastApiError: vi.fn(),
}))
const navigation = vi.hoisted(() => ({ params: new URLSearchParams() }))

vi.mock("@/lib/api", () => ({
  ...api,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_RESET_INVALID_LINK: "PasswordReset.EnlaceInvalido",
  parsePasswordResetRole: (value: string | null) => (value === "empresa" ? "empresa" : "empleado"),
  isApiError: (error: unknown) => typeof error === "object" && error !== null && "code" in error,
}))
vi.mock("next/navigation", () => ({ useSearchParams: () => navigation.params }))
vi.mock("next/image", () => ({ default: () => null }))

describe("ResetPasswordForm", () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    navigation.params = new URLSearchParams({ token: "abc", tipo: "empresa" })
  })

  it("offers a new link to the same account type when the link no longer works", async () => {
    api.validatePasswordResetToken.mockRejectedValue({ code: INVALID_LINK })

    render(<ResetPasswordForm />)

    const retry = await screen.findByRole("link", { name: "Pedir un enlace nuevo" })
    expect(retry.getAttribute("href")).toBe("/recuperar-password?tipo=empresa")
    expect(api.toastApiError).not.toHaveBeenCalled()
  })

  it("does not call the API without a token", () => {
    navigation.params = new URLSearchParams()

    render(<ResetPasswordForm />)

    expect(screen.getByText("El enlace no sirve")).not.toBeNull()
    expect(api.validatePasswordResetToken).not.toHaveBeenCalled()
  })

  it("only submits when both passwords match and returns to the login of the account", async () => {
    api.validatePasswordResetToken.mockResolvedValue("empresa")
    api.resetPassword.mockResolvedValue("empresa")
    const user = userEvent.setup()

    render(<ResetPasswordForm />)

    await user.type(await screen.findByLabelText("Contraseña nueva"), "nueva-1234")
    await user.type(screen.getByLabelText("Repetí la contraseña"), "nueva-9999")

    const submit = screen.getByRole("button", { name: "Guardar contraseña" })
    expect(screen.getByText("Las contraseñas no coinciden.")).not.toBeNull()
    expect(submit.hasAttribute("disabled")).toBe(true)

    await user.clear(screen.getByLabelText("Repetí la contraseña"))
    await user.type(screen.getByLabelText("Repetí la contraseña"), "nueva-1234")
    await user.click(submit)

    expect(api.resetPassword).toHaveBeenCalledWith("abc", "nueva-1234")
    const login = await screen.findByRole("link", { name: "Iniciar sesión" })
    expect(login.getAttribute("href")).toBe("/login/empresa")
  })

  it("switches to the invalid state when the link expires while typing", async () => {
    api.validatePasswordResetToken.mockResolvedValue("empleado")
    api.resetPassword.mockRejectedValue({ code: INVALID_LINK })
    const user = userEvent.setup()

    render(<ResetPasswordForm />)

    await user.type(await screen.findByLabelText("Contraseña nueva"), "nueva-1234")
    await user.type(screen.getByLabelText("Repetí la contraseña"), "nueva-1234")
    await user.click(screen.getByRole("button", { name: "Guardar contraseña" }))

    expect(await screen.findByText("El enlace no sirve")).not.toBeNull()
  })
})
