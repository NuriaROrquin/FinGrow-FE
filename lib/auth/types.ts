export type UserRole = "empleado" | "empresa"

export interface SessionUser {
  userId: string
  companyId: string | null
  fullName: string
  role: UserRole
  expiresAt: number
}
