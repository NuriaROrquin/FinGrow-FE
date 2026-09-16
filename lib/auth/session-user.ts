import type { SessionResponse } from "@/lib/api/auth"
import type { SessionUser, UserRole } from "@/lib/auth/types"

export function toSessionUser(session: SessionResponse): SessionUser | null {
  const role = normalizeRole(session.role)
  const expiresAt = Date.parse(session.expiresAt)

  if (!role || Number.isNaN(expiresAt)) return null

  return {
    userId: session.userId,
    companyId: session.companyId ?? null,
    fullName: session.fullName,
    role,
    expiresAt,
  }
}

export function isSessionActive(user: SessionUser): boolean {
  return user.expiresAt > Date.now()
}

function normalizeRole(value: unknown): UserRole | null {
  if (value === "empresa" || value === "Empresa") return "empresa"
  if (value === "empleado" || value === "Empleado" || value === "User") return "empleado"
  return null
}
