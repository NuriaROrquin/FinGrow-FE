/**
 * Next inlina las variables NEXT_PUBLIC_* en tiempo de build, por eso se lee
 * `process.env.NEXT_PUBLIC_API_URL` de forma literal y no con acceso dinámico:
 * si se escribiera `process.env[nombre]` el valor llegaría vacío al navegador.
 */
const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_URL

/**
 * URL base de la API, sin barra final.
 *
 * Falla fuerte y temprano si falta la variable: es preferible un error claro al
 * arrancar que un `fetch("undefined/transactions")` que confunde durante media hora.
 */
export function getApiBaseUrl(): string {
  if (!RAW_BASE_URL) {
    throw new Error(
      "Falta la variable NEXT_PUBLIC_API_URL. Copiá .env.example a .env.local y completala.",
    )
  }

  return RAW_BASE_URL.replace(/\/+$/, "")
}

/** Arma la URL final combinando la base con la ruta del endpoint. */
export function buildUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${getApiBaseUrl()}${normalizedPath}`
}
