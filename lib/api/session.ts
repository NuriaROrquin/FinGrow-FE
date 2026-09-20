const ROLE_KEY = "fingrow-role"

export type SessionRole = "empleado" | "empresa"

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function getRole(): SessionRole | null {
  const role = getStorage()?.getItem(ROLE_KEY)
  return role === "empleado" || role === "empresa" ? role : null
}

export function saveSession(role: SessionRole): void {
  getStorage()?.setItem(ROLE_KEY, role)
}

export function clearSession(): void {
  getStorage()?.removeItem(ROLE_KEY)
}

export function loginPathForCurrentRole(): string {
  const role = getRole()
  return role ? `/login/${role}` : "/"
}
