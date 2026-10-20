import { api } from "./client"
import type { SessionRole } from "./session"

/** Vencido, usado o inexistente: el backend no distingue entre los tres (HU-72). */
export const PASSWORD_RESET_INVALID_LINK = "PasswordReset.EnlaceInvalido"

interface PasswordResetResponse {
  role: string
}

function toSessionRole(response: PasswordResetResponse): SessionRole {
  return response.role === "Empresa" ? "empresa" : "empleado"
}

export function parsePasswordResetRole(value: string | null): SessionRole {
  return value === "empresa" ? "empresa" : "empleado"
}

/** Responde igual exista o no la cuenta, para no revelar qué emails están registrados. */
export function requestPasswordReset(role: SessionRole, email: string): Promise<void> {
  return api.post(`/password-reset/${role}`, { email }, { skipAuthRedirect: true })
}

export async function validatePasswordResetToken(token: string): Promise<SessionRole> {
  return toSessionRole(
    await api.post<PasswordResetResponse>("/password-reset/validate", { token }, { skipAuthRedirect: true }),
  )
}

/** Devuelve el rol de la cuenta para volver a su login. */
export async function resetPassword(token: string, newPassword: string): Promise<SessionRole> {
  return toSessionRole(
    await api.post<PasswordResetResponse>("/password-reset/confirm", { token, newPassword }, { skipAuthRedirect: true }),
  )
}
