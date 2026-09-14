"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"

type UserRole = "empleado" | "empresa"

const TOKEN_COOKIE_NAME = "fingrow-auth-token"
const NAME_IDENTIFIER_CLAIM =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
const COMPANY_ID_CLAIM = "company_id"

interface TokenPayload {
  userId: string
  companyId: string | null
  rol: UserRole
  exp: number
}

interface AuthContextType {
  role: UserRole
  setRole: (role: UserRole) => void
  companyId: string | null
  userName: string
  setUserName: (name: string) => void
  isAuthenticated: boolean
  isHydrated: boolean
  login: (token: string) => boolean
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
    const token = getTokenCookie()

    if (token) {
      const payload = parseToken(token)

      if (payload && payload.exp * 1000 > Date.now()) {
        setAuthState(createAuthenticatedState(payload))
      } else {
        removeTokenCookie()
      }
    }

    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return

    const token = getTokenCookie()
    const payload = token ? parseToken(token) : null
    const remainingTime = payload ? getRemainingTime(payload.exp) : 0

    if (!payload || remainingTime <= 0) {
      removeTokenCookie()
      setAuthState((current) => ({ ...current, isAuthenticated: false }))
      router.replace("/")
      return
    }

    const timeoutId = window.setTimeout(() => {
      removeTokenCookie()
      setAuthState((current) => ({ ...current, isAuthenticated: false }))
      router.replace("/")
    }, remainingTime)
    return () => window.clearTimeout(timeoutId)
  }, [isAuthenticated, router])

  const loginWithToken = (token: string): boolean => {
    const payload = parseToken(token)

    if (!payload || payload.exp * 1000 <= Date.now()) return false

    setTokenCookie(token, payload.exp)
    setAuthState(createAuthenticatedState(payload))
    return true
  }

  const logout = () => {
    removeTokenCookie()
    setAuthState((current) => ({ ...current, companyId: null, isAuthenticated: false }))
    router.push("/")
  }

  const setRole = (nextRole: UserRole) =>
    setAuthState((current) => ({ ...current, role: nextRole }))
  const setUserName = (nextName: string) =>
    setAuthState((current) => ({ ...current, userName: nextName }))

  return (
    <AuthContext.Provider
      value={{
        role,
        setRole,
        companyId,
        userName,
        setUserName,
        isAuthenticated,
        isHydrated,
        loginWithToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

function createAuthenticatedState(payload: TokenPayload): AuthState {
  return {
    role: payload.rol,
    companyId: payload.companyId,
    userName: payload.userId,
    isAuthenticated: true,
  }
}

function getRemainingTime(expiresAt: number): number {
  return expiresAt * 1000 - Date.now()
}

function getTokenCookie(): string | null {
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${TOKEN_COOKIE_NAME}=`))

  return cookie ? decodeURIComponent(cookie.slice(TOKEN_COOKIE_NAME.length + 1)) : null
}

function setTokenCookie(token: string, expiresAt: number): void {
  const maxAge = Math.max(0, Math.floor(expiresAt - Date.now() / 1000))
  document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
}

function removeTokenCookie(): void {
  document.cookie = `${TOKEN_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`
}

function parseToken(token: string): TokenPayload | null {
  try {
    const encodedPayload = token.split(".")[1]
    const base64Payload = encodedPayload.replace(/-/g, "+").replace(/_/g, "/")
    const payload = JSON.parse(
      atob(base64Payload.padEnd(Math.ceil(base64Payload.length / 4) * 4, "=")),
    ) as Record<string, unknown>
    const userId = payload[NAME_IDENTIFIER_CLAIM]
    const companyId = payload[COMPANY_ID_CLAIM]
    const role = payload[ROLE_CLAIM]

    if (
      (role !== "User" && role !== "Empleado" && role !== "Empresa") ||
      typeof userId !== "string" ||
      typeof companyId !== "string" ||
      typeof payload.exp !== "number"
    ) {
      return null
    }

    return {
      userId,
      companyId,
      rol: role === "Empresa" ? "empresa" : "empleado",
      exp: payload.exp,
    }
  } catch {
    return null
  }
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider")
  }
  return context
}
