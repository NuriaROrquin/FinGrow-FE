import { buildUrl } from "./config"
import { ApiError, ClientErrorCodes, parseApiError } from "./errors"
import { clearSession, loginPathForCurrentRole } from "./session"

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined | null>

  headers?: Record<string, string>

  signal?: AbortSignal

  skipAuthRedirect?: boolean
}

let onUnauthorized: () => void = () => {
  if (typeof window === "undefined") {
    return
  }

  window.location.href = loginPathForCurrentRole()
}

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler
}

let refreshInFlight: Promise<boolean> | null = null

function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(buildUrl("/session/refresh"), {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null
      })
  }

  return refreshInFlight
}

async function request<TResponse>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
  isRetryAfterRefresh = false,
): Promise<TResponse> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json"
  }

  let response: Response

  try {
    response = await fetch(buildUrl(path) + buildQueryString(options.query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: options.signal,
      credentials: "include",
    })
  } catch (error) {
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
    if (!isRetryAfterRefresh && (await refreshSession())) {
      return request<TResponse>(method, path, body, options, true)
    }

    clearSession()
    onUnauthorized()
  }

  if (!response.ok) {
    throw parseApiError(response.status, await readJson(response))
  }

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
