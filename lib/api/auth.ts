import { api } from "./client"

export interface LoginRequest {
  email: string
  password: string
}

export interface SessionResponse {
  userId: string
  companyId: string
  fullName: string
  role: string
  expiresAt: string
}

export interface TwoFactorChallenge {
  requiresTwoFactor: true
  challengeToken: string
  expiresAt: string
}

export function isTwoFactorChallenge(response: SessionResponse | TwoFactorChallenge): response is TwoFactorChallenge {
  return "requiresTwoFactor" in response && response.requiresTwoFactor === true
}

export function loginEmpleado(credentials: LoginRequest) {
  return api.post<SessionResponse | TwoFactorChallenge>("/login/empleado", credentials, { skipAuthRedirect: true })
}

export function verifyTwoFactorLogin(challengeToken: string, code: string) {
  return api.post<SessionResponse>("/login/empleado/2fa", { challengeToken, code }, { skipAuthRedirect: true })
}

export function loginEmpresa(credentials: LoginRequest) {
  return api.post<SessionResponse>("/login/empresa", credentials, { skipAuthRedirect: true })
}

export function getSession() {
  return api.get<SessionResponse>("/session", { skipAuthRedirect: true })
}

export function refreshSession() {
  return api.post<SessionResponse>("/session/refresh", undefined, { skipAuthRedirect: true })
}

export function logout() {
  return api.delete("/session", { skipAuthRedirect: true })
}
