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

export function login(credentials: LoginRequest) {
  return api.post<SessionResponse | TwoFactorChallenge>("/login", credentials, { skipAuthRedirect: true })
}

export function verifyTwoFactorLogin(challengeToken: string, code: string) {
  return api.post<SessionResponse>("/login/2fa", { challengeToken, code }, { skipAuthRedirect: true })
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

/**
 * Una sesión abierta (HU-73). Navegador y sistema salen del User-Agent y vienen en `null` si no
 * se reconocen. No hay ubicación: el backend no la registra.
 */
export interface ActiveSessionDto {
  id: string
  browser: string | null
  operatingSystem: string | null
  startedAt: string
  /** La última vez que la sesión renovó el acceso. */
  lastActiveAt: string
  isCurrent: boolean
}

// Cuelgan de /session y no de /api porque la sesión actual se reconoce por la cookie de refresh,
// que el navegador solo manda a /session.
export function listSessions(signal?: AbortSignal) {
  return api.get<ActiveSessionDto[]>("/session/all", { signal })
}

export function closeSession(sessionId: string) {
  return api.delete(`/session/${sessionId}`)
}

export function closeOtherSessions() {
  return api.delete("/session/others")
}
