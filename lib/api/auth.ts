import { apiFetch } from "@/lib/api/client"

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
}

export function loginEmpleado(credentials: LoginRequest) {
  return apiFetch<LoginResponse>("/login/empleado", {
    method: "POST",
    body: credentials,
  })
}