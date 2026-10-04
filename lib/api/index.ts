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
export {
  getSession,
  isTwoFactorChallenge,
  loginEmpleado,
  loginEmpresa,
  logout,
  verifyTwoFactorLogin,
  type LoginRequest,
  type SessionResponse,
  type TwoFactorChallenge,
} from "./auth"
export {
  ADDRESS_MAX_LENGTH,
  changePassword,
  disableTwoFactor,
  enableTwoFactor,
  FULL_NAME_MAX_LENGTH,
  FULL_NAME_MIN_LENGTH,
  getProfile,
  getTwoFactorStatus,
  NATIONAL_ID_MAX_LENGTH,
  NATIONAL_ID_MIN_LENGTH,
  PASSWORD_MIN_LENGTH,
  PHONE_NUMBER_MAX_DIGITS,
  PHONE_NUMBER_MAX_LENGTH,
  PHONE_NUMBER_MIN_DIGITS,
  PROFILE_MAX_AGE,
  PROFILE_MIN_AGE,
  setupTwoFactor,
  TWO_FACTOR_CODE_LENGTH,
  updateProfile,
  type ChangePasswordPayload,
  type EmployeeProfile,
  type TwoFactorSetup,
  type TwoFactorStatus,
  type UpdateProfilePayload,
} from "./account"
export { getApiBaseUrl } from "./config"
export {
  defaultPreferences,
  getPreferences,
  updatePreferences,
  type DateFormat,
  type Language,
  type Preferences,
  type ThemePreference,
} from "./preferences"
export {
  educationCategoryLabels,
  getArticle,
  listArticles,
  type ArticleDto,
  type ArticleFilters,
  type ArticleSummaryDto,
} from "./articles"
export {
  completeLesson,
  courseLevelLabels,
  courseProgressStatusLabels,
  getCourse,
  listCourses,
  rateCourse,
  type CourseDetailDto,
  type CourseFilters,
  type CourseLevel,
  type CourseProgressStatus,
  type CourseSummaryDto,
  type LessonDto,
} from "./courses"
export { type EducationCategory } from "./education"
export { getMepQuote, type MepQuoteDto } from "./exchange-rates"
export {
  changeBudgetCurrency,
  createBudget,
  deleteBudget,
  duplicatePreviousBudget,
  getBudget,
  removeBudgetLimit,
  setBudgetLimit,
  type BudgetDto,
  type BudgetHealth,
  type BudgetLimitDto,
  type BudgetPeriod,
  type CreateBudgetPayload,
  type SetBudgetLimitPayload,
} from "./budgets"
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
  FUND_NAME_MAX_LENGTH,
  SYMBOL_MAX_LENGTH,
  createInvestment,
  formatQuantity,
  getPortfolioSummary,
  deleteInvestment,
  investmentSortFieldLabels,
  investmentTypeLabels,
  isPricedPerNominal,
  isQuoted,
  listInvestments,
  quantityUnit,
  quoteMarketOf,
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
  type QuoteMarket,
  type SortDirection,
} from "./investments"
export { getSavingsVsGoals, type SavingsVsGoalsDto, type SavingsVsGoalsMonthDto } from "./reports"
export { canQuoteIn, getSecurityPrice, searchSecurityPrices, type SecurityPriceDto } from "./security-prices"
export {
  getDashboardSummary,
  getExpensesByCategory,
  getIncomeVsExpenses,
  getMonthlyExpenses,
  type DashboardDateRangeQuery,
  type DashboardPeriodQuery,
  type DashboardSummaryDto,
  type ExpenseCategoryTotalDto,
  type IncomeExpenseMonthDto,
  type MonthlyExpenseDto,
} from "./dashboard"
