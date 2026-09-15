import { TOKEN_STORAGE_KEY } from "@/lib/auth/token"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ""

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown
  onUnauthorized?: () => void
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, onUnauthorized, headers, ...requestOptions } = options
  const token = typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_STORAGE_KEY)
  const response = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (response.status === 401) {
    onUnauthorized?.()
    throw new Error("La sesión no es válida o expiró")
  }

  if (!response.ok) {
    throw new Error(`Error de API: ${response.status}`)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
