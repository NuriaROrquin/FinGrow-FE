import { api } from "./client"
import type { Currency } from "./transactions"

export const DEPARTMENT_NAME_MAX_LENGTH = 120

export const DEPARTMENT_DESCRIPTION_MAX_LENGTH = 500

export interface DepartmentManagerDto {
  id: string
  fullName: string
  isActive: boolean
}

export interface DepartmentDto {
  id: string
  name: string
  description: string | null
  manager: DepartmentManagerDto | null
  employeeCount: number
  isActive: boolean
  createdAt: string
}

export interface DepartmentPayload {
  name: string
  description: string | null
  managerId: string | null
}

export function listDepartments(signal?: AbortSignal): Promise<DepartmentDto[]> {
  return api.get<DepartmentDto[]>("/api/company/departments", { signal })
}

export function createDepartment(payload: DepartmentPayload): Promise<DepartmentDto> {
  return api.post<DepartmentDto>("/api/company/departments", payload)
}

export function updateDepartment(departmentId: string, payload: DepartmentPayload): Promise<DepartmentDto> {
  return api.put<DepartmentDto>(`/api/company/departments/${departmentId}`, payload)
}

export function deleteDepartment(departmentId: string): Promise<void> {
  return api.delete(`/api/company/departments/${departmentId}`)
}

export function changeDepartmentStatus(
  departmentId: string,
  isActive: boolean,
  moveEmployeesTo: string | null = null,
): Promise<DepartmentDto> {
  return api.put<DepartmentDto>(`/api/company/departments/${departmentId}/status`, { isActive, moveEmployeesTo })
}

export const EMPLOYEE_EMAIL_MAX_LENGTH = 256

export interface CompanyEmployeeDto {
  id: string
  fullName: string
  email: string
  phoneNumber: string | null
  departmentId: string | null
  departmentName: string | null
  hiredOn: string
  isActive: boolean
  lastLoginAt: string | null
}

export interface EmployeeDetailsPayload {
  fullName: string
  email: string
  phoneNumber: string | null
}

export interface CreateEmployeePayload extends EmployeeDetailsPayload {
  departmentId: string | null
}

export interface CreatedEmployeeDto {
  employee: CompanyEmployeeDto
  temporaryPassword: string
}

export function listEmployees(signal?: AbortSignal): Promise<CompanyEmployeeDto[]> {
  return api.get<CompanyEmployeeDto[]>("/api/company/employees", { signal })
}

export function createEmployee(payload: CreateEmployeePayload): Promise<CreatedEmployeeDto> {
  return api.post<CreatedEmployeeDto>("/api/company/employees", payload)
}

export function updateEmployee(employeeId: string, payload: EmployeeDetailsPayload): Promise<CompanyEmployeeDto> {
  return api.put<CompanyEmployeeDto>(`/api/company/employees/${employeeId}`, payload)
}

export function changeEmployeeDepartment(employeeId: string, departmentId: string | null): Promise<CompanyEmployeeDto> {
  return api.put<CompanyEmployeeDto>(`/api/company/employees/${employeeId}/department`, { departmentId })
}

export function changeEmployeeAccess(employeeId: string, isActive: boolean): Promise<CompanyEmployeeDto> {
  return api.put<CompanyEmployeeDto>(`/api/company/employees/${employeeId}/access`, { isActive })
}

export function deleteEmployee(employeeId: string): Promise<void> {
  return api.delete(`/api/company/employees/${employeeId}`)
}

export const COMPANY_INDUSTRIES = [
  "Tecnología",
  "Finanzas y seguros",
  "Comercio",
  "Industria y manufactura",
  "Salud",
  "Educación",
  "Construcción",
  "Agricultura y ganadería",
  "Servicios profesionales",
  "Otro",
] as const

export type CompanyIndustry = (typeof COMPANY_INDUSTRIES)[number]

export interface CompanyProfileDto {
  legalName: string
  taxId: string
  email: string
  industry: string
  corporatePhone: string | null
  fiscalAddress: string | null
  foundedYear: number | null
  employeeCount: number
}

export interface UpdateCompanyProfilePayload {
  legalName: string
  taxId: string
  email: string
  industry: string
  corporatePhone: string | null
  fiscalAddress: string | null
  foundedYear: number | null
}

export function isValidCuit(cuit: string): boolean {
  const cleaned = cuit.replace(/[-\s]/g, "")
  if (!/^\d{11}$/.test(cleaned)) {
    return false
  }

  const type = Number(cleaned.slice(0, 2))
  const validTypes = [20, 23, 24, 27, 30, 33, 34]
  if (!validTypes.includes(type)) {
    return false
  }

  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 10; i++) {
    sum += Number(cleaned[i]) * multipliers[i]
  }

  const mod = 11 - (sum % 11)
  let checkDigit = mod
  if (mod === 11) checkDigit = 0
  if (mod === 10) checkDigit = 9

  return Number(cleaned[10]) === checkDigit
}

export function getCompanyProfile(signal?: AbortSignal): Promise<CompanyProfileDto> {
  return api.get<CompanyProfileDto>("/api/company/profile", { signal })
}

export function updateCompanyProfile(payload: UpdateCompanyProfilePayload): Promise<CompanyProfileDto> {
  return api.put<CompanyProfileDto>("/api/company/profile", payload)
}

export type CompanyPreferenceTheme = "System" | "Light" | "Dark"
export type CompanyPreferenceLanguage = "es" | "en" | "pt"

export interface CompanyPreferencesDto {
  theme: CompanyPreferenceTheme | null
  language: CompanyPreferenceLanguage | null
  currency: Currency | null
  fiscalYearStartMonth: number | null
}

export interface UpdateCompanyPreferencesPayload {
  theme: CompanyPreferenceTheme
  language: CompanyPreferenceLanguage
  currency: Currency
  fiscalYearStartMonth: number
}

export function getCompanyPreferences(signal?: AbortSignal): Promise<CompanyPreferencesDto> {
  return api
    .get<CompanyPreferencesDto | {
      theme: CompanyPreferenceTheme | 0
      language: CompanyPreferenceLanguage | 0
      currency: Currency
      fiscalYearStartMonth: number
    }>("/api/company/preferences", { signal })
    .then((data) => {
      const isUnconfigured = data.theme === 0 || data.language === 0 || data.fiscalYearStartMonth === 0

      if (isUnconfigured) {
        return {
          theme: null,
          language: null,
          currency: null,
          fiscalYearStartMonth: null,
        }
      }

      return data as CompanyPreferencesDto
    })
}

export function updateCompanyPreferences(
  payload: UpdateCompanyPreferencesPayload,
): Promise<CompanyPreferencesDto> {
  return api.put<CompanyPreferencesDto>("/api/company/preferences", payload)
}

export interface CompanyParticipationDto {
  periodStart: string
  periodEnd: string
  totalEmployees: number
  activeEmployees: number
  /** `null` cuando el grupo es demasiado chico para mostrarlo sin identificar a nadie. */
  participatingEmployees: number | null
  /** Porcentaje (0 a 100). `null` si no hay empleados activos o si está oculto. */
  participationRate: number | null
  isParticipationHidden: boolean
  minimumGroupSize: number
}

export function getCompanyParticipation(signal?: AbortSignal): Promise<CompanyParticipationDto> {
  return api.get<CompanyParticipationDto>("/api/company/metrics/participation", { signal })
}

export type CompanyEducationMetricsResponse = {
  totalCompletedCourses: number
  satisfactionPercentage: number | null
  last30DaysCompletedCourses: number
}

export function getCompanyEducationMetrics(signal?: AbortSignal): Promise<CompanyEducationMetricsResponse> {
  return api.get<CompanyEducationMetricsResponse>("/api/company/metrics/education", { signal })
}

export interface CompanyMetricsComparisonPeriodDto {
  period: string
  participationRate: number | null
  averageFinancialHealthScore: number | null
}

export interface CompanyMetricsComparisonDto {
  periods: CompanyMetricsComparisonPeriodDto[]
  participationRateChange: number | null
  averageFinancialHealthScoreChange: number | null
}

export function getCompanyMetricsComparison(signal?: AbortSignal): Promise<CompanyMetricsComparisonDto> {
  return api.get<CompanyMetricsComparisonDto>("/api/company/metrics/comparison", { signal })
}

export type HealthBand = "Critical" | "Fragile" | "Stable" | "Healthy"

export type DepartmentMetricsSummary = {
  departmentId: string
  departmentName: string
  period: string | null
  employees: number | null
  averageScore: number | null
  participation: number | null
  status: HealthBand | null
  isMetricsHidden: boolean
  minimumGroupSize: number
  hiddenReason: string | null
}

export type DepartmentMetricsQuery = {
  /** `YYYY-MM-DD`. Con `toDate`, acota el ultimo snapshot disponible a ese rango. */
  fromDate?: string
  toDate?: string
}

export function getDepartmentMetrics(
  query: DepartmentMetricsQuery = {},
  signal?: AbortSignal,
): Promise<DepartmentMetricsSummary[]> {
  const params = new URLSearchParams()
  if (query.fromDate) params.set("fromDate", query.fromDate)
  if (query.toDate) params.set("toDate", query.toDate)
  const search = params.toString()

  return api.get<DepartmentMetricsSummary[]>(`/api/company/metrics/departments${search ? `?${search}` : ""}`, { signal })
}