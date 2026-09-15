"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { getSession, loginEmpleado, logout as logoutRequest } from "@/lib/api/auth"
import { setUnauthorizedHandler } from "@/lib/api/client"
import { clearSession as clearStoredSession, saveSession } from "@/lib/api/session"
import { isSessionActive, toSessionUser } from "@/lib/auth/session-user"
import type { SessionUser, UserRole } from "@/lib/auth/types"

interface AuthContextType {
  role: UserRole
  companyId: string | null
  userName: string
  isAuthenticated: boolean
  isHydrated: boolean
  login: (email: string, password: string, role?: UserRole) => Promise<void>
  logout: () => Promise<void>
}

interface AuthState {
  role: UserRole
  companyId: string | null
  userName: string
  isAuthenticated: boolean
  expiresAt: number | null
}

const unauthenticatedState: AuthState = {
  role: "empleado",
  companyId: null,
  userName: "Usuario",
  isAuthenticated: false,
  expiresAt: null,
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(unauthenticatedState)
  const [isHydrated, setIsHydrated] = useState(false)
  const router = useRouter()
  const { role, companyId, userName, isAuthenticated, expiresAt } = authState

  useEffect(() => {
    let cancelled = false

    getSession()
      .then((session) => {
        const user = toSessionUser(session)
        if (cancelled) return

        if (user && isSessionActive(user)) {
          saveSession(user.role)
          setAuthState(createAuthenticatedState(user))
        } else {
          clearStoredSession()
        }
      })
      .catch(() => {
        if (!cancelled) clearStoredSession()
      })
      .finally(() => {
        if (!cancelled) setIsHydrated(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = async (email: string, password: string, role: UserRole = "empleado") => {
    if (role === "empresa") {
      throw new Error("El login de empresa todavía no está disponible.")
    }

    const user = toSessionUser(await loginEmpleado({ email, password }))

    if (!user || !isSessionActive(user)) {
      throw new Error("La sesión recibida no es válida")
    }

    saveSession(user.role)
    setAuthState(createAuthenticatedState(user))
  }

  const clearSession = useCallback(() => {
    clearStoredSession()
    setAuthState(unauthenticatedState)
    router.replace("/")
  }, [router])

  const logout = async () => {
    try {
      await logoutRequest()
    } finally {
      clearSession()
    }
  }

  useEffect(() => {
    setUnauthorizedHandler(clearSession)
  }, [clearSession])

  useEffect(() => {
    if (!isAuthenticated || expiresAt === null) return

    const remainingTime = expiresAt - Date.now()

    if (remainingTime <= 0) {
      clearSession()
      return
    }

    const timeoutId = window.setTimeout(clearSession, remainingTime)

    return () => window.clearTimeout(timeoutId)
  }, [isAuthenticated, expiresAt, clearSession])

  return (
    <AuthContext.Provider
      value={{
        role,
        companyId,
        userName,
        isAuthenticated,
        isHydrated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

function createAuthenticatedState(user: SessionUser): AuthState {
  return {
    role: user.role,
    companyId: user.companyId,
    userName: user.fullName || user.userId,
    isAuthenticated: true,
    expiresAt: user.expiresAt,
  }
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider")
  }
  return context
}
