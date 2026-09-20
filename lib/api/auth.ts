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

export function loginEmpleado(credentials: LoginRequest) {
  return api.post<SessionResponse>("/login/empleado", credentials, { skipAuthRedirect: true })
}

export function loginEmpresa(credentials: LoginRequest) {
  return api.post<SessionResponse>("/login/empresa", credentials, { skipAuthRedirect: true })
}

export function getSession() {
  return api.get<SessionResponse>("/session", { skipAuthRedirect: true })
}

export function logout() {
  return api.delete("/session", { skipAuthRedirect: true })
}
