"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { loginEmpleado } from "@/lib/api/auth"
import { isTokenValid, parseToken, TOKEN_STORAGE_KEY } from "@/lib/auth/token"
import type { TokenPayload, UserRole } from "@/lib/auth/types"

interface AuthContextType {
  role: UserRole
  companyId: string | null
  userName: string
  isAuthenticated: boolean
  isHydrated: boolean
  login: (email: string, password: string, role?: UserRole) => Promise<void>
  logout: () => void
}

interface AuthState {
  role: UserRole
  companyId: string | null
  userName: string
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    role: "empleado",
    companyId: null,
    userName: "Usuario",
    isAuthenticated: false,
  })
  const [isHydrated, setIsHydrated] = useState(false)
  const router = useRouter()
  const { role, companyId, userName, isAuthenticated } = authState

  useEffect(() => {
    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY)
    const payload = token && isTokenValid(token) ? parseToken(token) : null

    if (payload) {
      setAuthState(createAuthenticatedState(payload))
    } else if (token) {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    }

    setIsHydrated(true)
  }, [])

const login = async (email: string, password: string, role: UserRole = "empleado") => {
  if (role === "empresa") {
    throw new Error("El login de empresa todavía no está disponible.")
  }

  const { token } = await loginEmpleado({ email, password })
  const payload = parseToken(token)

  if (!payload || !isTokenValid(token)) {
    throw new Error("El token recibido no es válido")
  }

  window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
  setAuthState(createAuthenticatedState(payload))
}

  const logout = () => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    clearSession()
  }

  function clearSession() {
    setAuthState((current) => ({ ...current, companyId: null, isAuthenticated: false }))
    router.replace("/")
  }

  useEffect(() => {
    if (!isAuthenticated) return

    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY)
    const payload = token ? parseToken(token) : null
    const remainingTime = payload ? payload.exp * 1000 - Date.now() : 0

    if (!payload || remainingTime <= 0) {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY)
      clearSession()
      return
    }

    const timeoutId = window.setTimeout(() => {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY)
      clearSession()
    }, remainingTime)

    return () => window.clearTimeout(timeoutId)
  }, [isAuthenticated])

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

function createAuthenticatedState(user: TokenPayload): AuthState {
  return {
    role: user.role,
    companyId: user.companyId,
    userName: user.userId,
    isAuthenticated: true,
  }
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider")
  }
  return context
}
