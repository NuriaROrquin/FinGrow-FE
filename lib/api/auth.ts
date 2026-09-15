import { apiFetch } from "@/lib/api/client"

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
}

export function loginRequest(credentials: LoginRequest) {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: credentials,
  })
}
