"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

/**
 * Manda directo a su panel a quien entra a la página de inicio con la sesión iniciada:
 * el Resumen al empleado y el Panel Empresarial a la empresa.
 */
export function AuthenticatedRedirect() {
  const router = useRouter()
  const { role, isAuthenticated, isHydrated } = useAuth()

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) return

    router.replace(role === "empresa" ? "/dashboard/company" : "/dashboard")
  }, [isAuthenticated, isHydrated, role, router])

  return null
}
