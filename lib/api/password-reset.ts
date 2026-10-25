import { api } from "./client"

/** Vencido, usado o inexistente: el backend no distingue entre los tres (HU-72). */
export const PASSWORD_RESET_INVALID_LINK = "PasswordReset.EnlaceInvalido"

/** Responde igual exista o no la cuenta, para no revelar qué emails están registrados. */
export function requestPasswordReset(email: string): Promise<void> {
  return api.post("/password-reset", { email }, { skipAuthRedirect: true })
}

export function validatePasswordResetToken(token: string): Promise<void> {
  return api.post("/password-reset/validate", { token }, { skipAuthRedirect: true })
}

export function resetPassword(token: string, newPassword: string): Promise<void> {
  return api.post("/password-reset/confirm", { token, newPassword }, { skipAuthRedirect: true })
}
