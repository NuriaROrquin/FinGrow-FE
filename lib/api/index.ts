/**
 * Capa de acceso HTTP de FinGrow (T-04).
 *
 * Todo el consumo de la API pasa por acá: ninguna página arma una URL, adjunta
 * un token ni repite cabeceras por su cuenta.
 *
 * ```tsx
 * import { api, toastApiError } from "@/lib/api"
 *
 * try {
 *   const resumen = await api.get<ResumenDto>("/dashboard/summary")
 * } catch (error) {
 *   toastApiError(error)
 * }
 * ```
 */

export { api, setUnauthorizedHandler, type RequestOptions } from "./client"
export { ApiError, ClientErrorCodes, isApiError, parseApiError } from "./errors"
export { toastApiError } from "./notify"
export {
  clearSession,
  getRole,
  getToken,
  loginPathForCurrentRole,
  saveSession,
  type SessionRole,
} from "./session"
export { getApiBaseUrl } from "./config"
