/**
 * Guarda el token y el rol de la sesión activa.
 *
 * Es deliberadamente mínimo: existe para que el cliente HTTP pueda adjuntar el
 * bearer y limpiarlo ante un 401. La sesión completa —rehidratación al refrescar,
 * expiración, integración con el AuthProvider— es T-05, que va a construir sobre
 * estas funciones en lugar de reemplazarlas.
 */

const TOKEN_KEY = "fingrow-token"
const ROLE_KEY = "fingrow-role"

export type SessionRole = "empleado" | "empresa"

/**
 * En el servidor no hay localStorage. Los componentes de servidor de Next ejecutan
 * este módulo igual, así que cada acceso se protege en lugar de asumir el navegador.
 */
function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    return window.localStorage
  } catch {
    // El navegador puede bloquear el almacenamiento (modo privado, cookies bloqueadas).
    return null
  }
}

export function getToken(): string | null {
  return getStorage()?.getItem(TOKEN_KEY) ?? null
}

export function getRole(): SessionRole | null {
  const role = getStorage()?.getItem(ROLE_KEY)
  return role === "empleado" || role === "empresa" ? role : null
}

export function saveSession(token: string, role: SessionRole): void {
  const storage = getStorage()
  storage?.setItem(TOKEN_KEY, token)
  storage?.setItem(ROLE_KEY, role)
}

export function clearSession(): void {
  const storage = getStorage()
  storage?.removeItem(TOKEN_KEY)
  storage?.removeItem(ROLE_KEY)
}

/**
 * A dónde mandar a alguien que perdió la sesión.
 *
 * No hay una pantalla de login única: hay una por rol. Si sabemos con cuál entró,
 * lo devolvemos ahí; si no, a la portada, que ofrece las dos.
 */
export function loginPathForCurrentRole(): string {
  const role = getRole()
  return role ? `/login/${role}` : "/"
}
