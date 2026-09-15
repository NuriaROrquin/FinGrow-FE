import type { TokenPayload, UserRole } from "@/lib/auth/types"

export const TOKEN_STORAGE_KEY = "fingrow-token"

const NAME_IDENTIFIER_CLAIM =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
const COMPANY_ID_CLAIM = "company_id"

export function parseToken(token: string): TokenPayload | null {
  try {
    const encodedPayload = token.split(".")[1]
    if (!encodedPayload) return null

    const base64Payload = encodedPayload.replace(/-/g, "+").replace(/_/g, "/")
    const payload = JSON.parse(
      atob(base64Payload.padEnd(Math.ceil(base64Payload.length / 4) * 4, "=")),
    ) as Record<string, unknown>

    const userId = payload[NAME_IDENTIFIER_CLAIM] ?? payload.userId ?? payload.sub
    const companyId = payload[COMPANY_ID_CLAIM] ?? payload.companyId ?? null
    const rawRole = payload[ROLE_CLAIM] ?? payload.rol ?? payload.role
    const role = normalizeRole(rawRole)

    if (
      !role ||
      typeof userId !== "string" ||
      (typeof companyId !== "string" && companyId !== null) ||
      typeof payload.exp !== "number"
    ) {
      return null
    }

    return { userId, companyId, role, exp: payload.exp }
  } catch {
    return null
  }
}

export function isTokenValid(token: string): boolean {
  const payload = parseToken(token)
  return payload !== null && payload.exp * 1000 > Date.now()
}

function normalizeRole(value: unknown): UserRole | null {
  if (value === "empresa" || value === "Empresa") return "empresa"
  if (value === "empleado" || value === "Empleado" || value === "User") return "empleado"
  return null
}
