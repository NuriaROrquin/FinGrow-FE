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
export { clearSession, getRole, loginPathForCurrentRole, saveSession, type SessionRole } from "./session"
export { getSession, loginEmpleado, loginEmpresa, logout, type LoginRequest, type SessionResponse } from "./auth"
export { getApiBaseUrl } from "./config"
export {
  getIntegration,
  NOT_LINKED,
  requestLinkCode,
  startMercadoPagoLink,
  syncMercadoPago,
  unlinkIntegration,
  type Integration,
  type IntegrationProvider,
  type LinkCode,
  type MercadoPagoAuthorization,
  type MercadoPagoLinkResult,
  type MercadoPagoSyncSummary,
} from "./integrations"
