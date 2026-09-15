export type UserRole = "empleado" | "empresa"

export interface TokenPayload {
  userId: string
  companyId: string | null
  role: UserRole
  exp: number
}
