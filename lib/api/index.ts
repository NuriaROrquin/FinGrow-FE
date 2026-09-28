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
export { getMepQuote, type MepQuoteDto } from "./exchange-rates"
export {
  addContribution,
  CONTRIBUTION_NOTE_MAX_LENGTH,
  createGoal,
  GOAL_NAME_MAX_LENGTH,
  listContributions,
  listGoals,
  removeContribution,
  type AddContributionPayload,
  type ContributionAddedDto,
  type CreateGoalPayload,
  type GoalContributionDto,
  type GoalDto,
  type GoalStatus,
} from "./goals"
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
export {
  ASSET_NAME_MAX_LENGTH,
  createInvestment,
  getPortfolioSummary,
  deleteInvestment,
  investmentSortFieldLabels,
  investmentTypeLabels,
  listInvestments,
  updateInvestment,
  type AllocationGroupDto,
  type CreateInvestmentPayload,
  type CurrencyPortfolioDto,
  type InvestmentDto,
  type InvestmentListQuery,
  type InvestmentPerformance,
  type InvestmentSortField,
  type InvestmentType,
  type LastPurchaseDto,
  type PagedResultDto,
  type PortfolioSummaryDto,
  type SortDirection,
} from "./investments"
export { getSavingsVsGoals, type SavingsVsGoalsDto, type SavingsVsGoalsMonthDto } from "./reports"
