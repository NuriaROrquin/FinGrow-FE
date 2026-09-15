import { api } from "./client"

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
}

export function loginEmpleado(credentials: LoginRequest) {
  return api.post<LoginResponse>("/login/empleado", credentials, { skipAuthRedirect: true })
}
