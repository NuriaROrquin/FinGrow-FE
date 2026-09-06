import { buildUrl } from "./config"
import { ApiError, ClientErrorCodes, parseApiError } from "./errors"
import { clearSession, getToken, loginPathForCurrentRole } from "./session"

export interface RequestOptions {
  /** Parámetros de query. Los `undefined` y `null` se omiten. */
  query?: Record<string, string | number | boolean | undefined | null>

  /** Cabeceras extra para esta llamada puntual. */
  headers?: Record<string, string>

  /** Para cancelar la llamada desde el componente que la disparó. */
  signal?: AbortSignal

  /**
   * Desactiva el manejo automático del 401 para esta llamada.
   * El login lo usa: ahí un 401 significa "credenciales incorrectas", no
   * "se venció tu sesión", y no hay que redirigir a ningún lado.
   */
  skipAuthRedirect?: boolean
}

/**
 * Qué hacer cuando la API responde 401.
 *
 * Es reemplazable para que T-05 pueda usar el router de Next en lugar de una
 * recarga completa, y para que los tests puedan observarlo sin tocar `window`.
 */
let onUnauthorized: () => void = () => {
  if (typeof window === "undefined") {
    return
  }

  window.location.href = loginPathForCurrentRole()
}

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler
}

async function request<TResponse>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<TResponse> {
  const token = getToken()

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json"
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response: Response

  try {
    response = await fetch(buildUrl(path) + buildQueryString(options.query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: options.signal,
      // El backend habilita AllowCredentials en la política FinGrowFrontend.
      credentials: "include",
    })
  } catch (error) {
    // Una excepción de fetch no distingue entre red caída, servidor apagado y CORS:
    // el navegador oculta el motivo a propósito. Por eso el mensaje es genérico.
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error
    }

    throw new ApiError({
      code: ClientErrorCodes.Network,
      description: "No pudimos conectarnos con el servidor. Revisá tu conexión e intentá de nuevo.",
      status: 0,
    })
  }

  if (response.status === 401 && !options.skipAuthRedirect) {
    clearSession()
    onUnauthorized()
  }

  if (!response.ok) {
    throw parseApiError(response.status, await readJson(response))
  }

  // 204 y 205 no traen cuerpo; devolver undefined es correcto para un Promise<void>.
  if (response.status === 204 || response.status === 205) {
    return undefined as TResponse
  }

  return (await readJson(response)) as TResponse
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()

  if (text.length === 0) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function buildQueryString(query: RequestOptions["query"]): string {
  if (!query) {
    return ""
  }

  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      params.append(key, String(value))
    }
  }

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ""
}

/**
 * Cliente HTTP de FinGrow.
 *
 * Cada método recibe el tipo de la respuesta esperada, de modo que las páginas
 * trabajen con datos tipados en lugar de `any`:
 *
 * ```ts
 * const transactions = await api.get<TransactionDto[]>("/transactions", {
 *   query: { from: "2026-03-01" },
 * })
 * ```
 *
 * El tipo es una promesa del backend, no una verificación: describe lo que la API
 * dice que devuelve. Si un endpoint cambia su forma, TypeScript no lo va a notar.
 */
export const api = {
  get: <TResponse>(path: string, options?: RequestOptions) =>
    request<TResponse>("GET", path, undefined, options),

  post: <TResponse>(path: string, body?: unknown, options?: RequestOptions) =>
    request<TResponse>("POST", path, body, options),

  put: <TResponse>(path: string, body?: unknown, options?: RequestOptions) =>
    request<TResponse>("PUT", path, body, options),

  patch: <TResponse>(path: string, body?: unknown, options?: RequestOptions) =>
    request<TResponse>("PATCH", path, body, options),

  delete: <TResponse = void>(path: string, options?: RequestOptions) =>
    request<TResponse>("DELETE", path, undefined, options),
}
