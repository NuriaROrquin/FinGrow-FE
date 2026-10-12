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
  changeDepartmentStatus,
  changeEmployeeAccess,
  changeEmployeeDepartment,
  createDepartment,
  createEmployee,
  deleteDepartment,
  deleteEmployee,
  DEPARTMENT_DESCRIPTION_MAX_LENGTH,
  DEPARTMENT_NAME_MAX_LENGTH,
  EMPLOYEE_EMAIL_MAX_LENGTH,
  listDepartments,
  listEmployees,
  updateDepartment,
  updateEmployee,
  type CompanyEmployeeDto,
  type CreatedEmployeeDto,
  type CreateEmployeePayload,
  type DepartmentDto,
  type DepartmentManagerDto,
  type DepartmentPayload,
  type EmployeeDetailsPayload,
} from "./company"
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
  deleteGoal,
  GOAL_NAME_MAX_LENGTH,
  listContributions,
  listGoals,
  removeContribution,
  updateGoal,
  type AddContributionPayload,
  type ContributionAddedDto,
  type CreateGoalPayload,
  type GoalContributionDto,
  type GoalDto,
  type GoalStatus,
  type UpdateGoalPayload,
} from "./goals"
export {
  getIntegration,
  linkIol,
  NOT_LINKED,
  requestLinkCode,
  startMercadoPagoLink,
  syncMercadoPago,
  unlinkIntegration,
  type Integration,
  type IntegrationProvider,
  type IntegrationStatus,
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
export {
  BUDGET_NOTIFICATION_EVENT,
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  NOTIFICATIONS_PAGE_SIZE,
  type NotificationDto,
  type NotificationType,
} from "./notifications"
export { connectToNotifications, type NotificationsHubHandlers } from "./notifications-hub"
