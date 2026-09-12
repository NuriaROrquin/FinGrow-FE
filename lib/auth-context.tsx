"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"

type UserRole = "empleado" | "empresa"

const TOKEN_KEY = "fingrow-auth-token"

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
  login: (role: UserRole, name: string) => void
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
    const token = window.localStorage.getItem(TOKEN_KEY)

    if (token) {
      const payload = parseToken(token)

      if (payload && payload.exp * 1000 > Date.now()) {
        setAuthState({
          role: payload.rol,
          companyId: payload.companyId,
          userName: payload.userId,
          isAuthenticated: true,
        })
      } else {
        window.localStorage.removeItem(TOKEN_KEY)
      }
    }

    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return

    const token = window.localStorage.getItem(TOKEN_KEY)
    const payload = token ? parseToken(token) : null
    const remainingTime = payload ? payload.exp * 1000 - Date.now() : 0

    if (!payload || remainingTime <= 0) {
      window.localStorage.removeItem(TOKEN_KEY)
      setAuthState((current) => ({ ...current, isAuthenticated: false }))
      router.replace("/")
      return
    }

    const timeoutId = window.setTimeout(() => {
      window.localStorage.removeItem(TOKEN_KEY)
      setAuthState((current) => ({ ...current, isAuthenticated: false }))
      router.replace("/")
    }, remainingTime)
    return () => window.clearTimeout(timeoutId)
  }, [isAuthenticated, router])

  const login = (userRole: UserRole, name: string) => {
    const token = getAuth(userRole, name)
    const payload = parseToken(token)

    if (!payload) return

    window.localStorage.setItem(TOKEN_KEY, token)
    setAuthState({
      role: payload.rol,
      companyId: payload.companyId,
      userName: payload.userId,
      isAuthenticated: true,
    })
  }
  const logout = () => {
    window.localStorage.removeItem(TOKEN_KEY)
    setAuthState((current) => ({ ...current, companyId: null, isAuthenticated: false }))
    router.push("/")
  }

  const setRole = (nextRole: UserRole) => setAuthState((current) => ({ ...current, role: nextRole }))
  const setUserName = (nextName: string) => setAuthState((current) => ({ ...current, userName: nextName }))

  return (
    <AuthContext.Provider value={{ role, setRole, companyId, userName, setUserName, isAuthenticated, isHydrated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

function parseToken(token: string): TokenPayload | null {
  try {
    const encodedPayload = token.split(".")[1]
    const base64Payload = encodedPayload.replace(/-/g, "+").replace(/_/g, "/")
    const payload = JSON.parse(atob(base64Payload.padEnd(Math.ceil(base64Payload.length / 4) * 4, "="))) as Partial<TokenPayload>

    if (
      (payload.rol !== "empleado" && payload.rol !== "empresa") ||
      typeof payload.userId !== "string" ||
      (typeof payload.companyId !== "string" && payload.companyId !== null) ||
      typeof payload.exp !== "number"
    ) {
      return null
    }

    return payload as TokenPayload
  } catch {
    return null
  }
}

function getAuth(role: UserRole, userId: string) {
  const payload: TokenPayload = {
    userId,
    companyId: role === "empresa" ? userId : null,
    rol: role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  }

  return `${encodeBase64Url({ alg: "HS256", typ: "JWT" })}.${encodeBase64Url(payload)}.FindGrowSingature`
}

function encodeBase64Url(value: object) {
  return btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider")
  }
  return context
}
