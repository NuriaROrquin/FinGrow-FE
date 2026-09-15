import { apiFetch } from "@/lib/api/client"

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  userId: string
  companyId: string | null
  rol: "empleado" | "empresa"
}

/**
 * El backend valida las credenciales y responde con Set-Cookie.
 * El token no se lee desde JavaScript: el navegador guarda la cookie.
 */
export function login(request: LoginRequest) {
  return apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: request,
  })
}
