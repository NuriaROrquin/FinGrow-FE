"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
  getSession,
  isTwoFactorChallenge,
  loginEmpleado,
  loginEmpresa,
  logout as logoutRequest,
  refreshSession,
  verifyTwoFactorLogin,
  type SessionResponse,
  type TwoFactorChallenge,
} from "@/lib/api/auth"
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
  login: (email: string, password: string, role?: UserRole) => Promise<TwoFactorChallenge | null>
  completeTwoFactorLogin: (challengeToken: string, code: string, role?: UserRole) => Promise<void>
  logout: (redirectTo?: string) => Promise<void>
  refreshUser: () => Promise<void>
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

  const startSession = (session: SessionResponse) => {
    const user = toSessionUser(session)

    if (!user || !isSessionActive(user)) {
      throw new Error("La sesión recibida no es válida")
    }

    saveSession(user.role)
    setAuthState(createAuthenticatedState(user))
  }

const login = async (email: string, password: string, role: UserRole = "empleado") => {
  const response =
    role === "empresa" ? await loginEmpresa({ email, password }) : await loginEmpleado({ email, password })

  if (isTwoFactorChallenge(response)) {
    return response
  }

  startSession(response)
  return null
}

const completeTwoFactorLogin = async (challengeToken: string, code: string, role: UserRole = "empleado") => {
  startSession(await verifyTwoFactorLogin(challengeToken, code, role))
}

  // El nombre viaja dentro del token: después de editar el perfil hay que renovar la sesión
  // para que GET /session deje de devolver el anterior.
  const refreshUser = async () => {
    startSession(await refreshSession())
  }

  const clearSession = useCallback(
    (redirectTo = "/") => {
      clearStoredSession()
      setAuthState(unauthenticatedState)
      router.replace(redirectTo)
    },
    [router],
  )

  const logout = async (redirectTo?: string) => {
    try {
      await logoutRequest()
    } finally {
      clearSession(redirectTo)
    }
  }

  useEffect(() => {
    setUnauthorizedHandler(clearSession)
  }, [clearSession])

  useEffect(() => {
    if (!isAuthenticated || expiresAt === null) return

    let cancelled = false

    const handleExpiry = async () => {
      try {
        const session = await refreshSession()
        const user = toSessionUser(session)

        if (cancelled) return

        if (user && isSessionActive(user)) {
          saveSession(user.role)
          setAuthState(createAuthenticatedState(user))
          return
        }
      } catch {
        // Refresh token vencido o revocado: se cae al cierre de sesión de abajo.
      }

      if (!cancelled) clearSession()
    }

    const remainingTime = expiresAt - Date.now()

    if (remainingTime <= 0) {
      void handleExpiry()
      return () => {
        cancelled = true
      }
    }

    const timeoutId = window.setTimeout(() => {
      void handleExpiry()
    }, remainingTime)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
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
        completeTwoFactorLogin,
        logout,
        refreshUser,
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
