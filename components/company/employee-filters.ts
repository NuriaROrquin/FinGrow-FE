import type { CompanyEmployeeDto } from "@/lib/api"

export const NO_DEPARTMENT_FILTER = "none"

export type EmployeeStatusFilter = "all" | "active" | "inactive"

export type LastLoginFilter = "any" | "last7" | "last30" | "over30" | "never"

export interface EmployeeFilterValues {
  search: string
  departments: string[]
  status: EmployeeStatusFilter
  lastLogin: LastLoginFilter
  hiredFrom: string
  hiredTo: string
}

export const defaultEmployeeFilters: EmployeeFilterValues = {
  search: "",
  departments: [],
  status: "all",
  lastLogin: "any",
  hiredFrom: "",
  hiredTo: "",
}

export const statusFilterLabels: Record<EmployeeStatusFilter, string> = {
  all: "Todos",
  active: "Activos",
  inactive: "Inactivos",
}

export const lastLoginFilterLabels: Record<LastLoginFilter, string> = {
  any: "Cualquiera",
  last7: "En los últimos 7 días",
  last30: "En los últimos 30 días",
  over30: "Hace más de 30 días",
  never: "Nunca ingresó",
}

export type EmployeeSortField = "fullName" | "departmentName" | "hiredOn" | "lastLoginAt"

export type SortOrder = "asc" | "desc"

export interface EmployeeSort {
  field: EmployeeSortField
  direction: SortOrder
}

export const defaultEmployeeSort: EmployeeSort = { field: "fullName", direction: "asc" }

const DAY_IN_MS = 24 * 60 * 60 * 1000

const MIN_PHONE_DIGITS_TO_SEARCH = 3

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

export function hasActiveFilters(values: EmployeeFilterValues): boolean {
  return (
    values.search.trim() !== "" ||
    values.departments.length > 0 ||
    values.status !== "all" ||
    values.lastLogin !== "any" ||
    values.hiredFrom !== "" ||
    values.hiredTo !== ""
  )
}

export function filtersError(values: EmployeeFilterValues): string | null {
  return values.hiredFrom && values.hiredTo && values.hiredFrom > values.hiredTo
    ? "La fecha de alta desde no puede ser posterior a la fecha hasta."
    : null
}

function matchesSearch(employee: CompanyEmployeeDto, search: string): boolean {
  const term = normalize(search.trim())

  if (!term) {
    return true
  }

  const matchesText = [employee.fullName, employee.email, employee.departmentName].some(
    (field) => field !== null && normalize(field).includes(term),
  )

  if (matchesText) {
    return true
  }

  const digits = search.replace(/\D/g, "")

  return (
    digits.length >= MIN_PHONE_DIGITS_TO_SEARCH &&
    employee.phoneNumber !== null &&
    employee.phoneNumber.replace(/\D/g, "").includes(digits)
  )
}

function matchesDepartments(employee: CompanyEmployeeDto, departments: string[]): boolean {
  return departments.length === 0 || departments.includes(employee.departmentId ?? NO_DEPARTMENT_FILTER)
}

function matchesStatus(employee: CompanyEmployeeDto, status: EmployeeStatusFilter): boolean {
  return status === "all" || employee.isActive === (status === "active")
}

function matchesLastLogin(employee: CompanyEmployeeDto, lastLogin: LastLoginFilter, now: Date): boolean {
  if (lastLogin === "any") {
    return true
  }

  if (employee.lastLoginAt === null) {
    return lastLogin === "never"
  }

  const days = (now.getTime() - Date.parse(employee.lastLoginAt)) / DAY_IN_MS

  switch (lastLogin) {
    case "last7":
      return days <= 7
    case "last30":
      return days <= 30
    case "over30":
      return days > 30
    default:
      return false
  }
}

function matchesHiredOn(employee: CompanyEmployeeDto, from: string, to: string): boolean {
  return (!from || employee.hiredOn >= from) && (!to || employee.hiredOn <= to)
}

export function filterEmployees(
  employees: CompanyEmployeeDto[],
  values: EmployeeFilterValues,
  now: Date = new Date(),
): CompanyEmployeeDto[] {
  return employees.filter(
    (employee) =>
      matchesSearch(employee, values.search) &&
      matchesDepartments(employee, values.departments) &&
      matchesStatus(employee, values.status) &&
      matchesLastLogin(employee, values.lastLogin, now) &&
      matchesHiredOn(employee, values.hiredFrom, values.hiredTo),
  )
}

function byName(a: CompanyEmployeeDto, b: CompanyEmployeeDto): number {
  return a.fullName.localeCompare(b.fullName, "es", { sensitivity: "base" })
}

function compareField(a: CompanyEmployeeDto, b: CompanyEmployeeDto, field: EmployeeSortField): number {
  if (field === "fullName") {
    return byName(a, b)
  }

  const left = a[field]
  const right = b[field]

  return field === "departmentName"
    ? (left ?? "").localeCompare(right ?? "", "es", { sensitivity: "base" })
    : (left ?? "").localeCompare(right ?? "")
}

export function sortEmployees(employees: CompanyEmployeeDto[], sort: EmployeeSort): CompanyEmployeeDto[] {
  const direction = sort.direction === "asc" ? 1 : -1

  return [...employees].sort((a, b) => {
    const leftMissing = sort.field !== "fullName" && a[sort.field] === null
    const rightMissing = sort.field !== "fullName" && b[sort.field] === null

    if (leftMissing !== rightMissing) {
      return leftMissing ? 1 : -1
    }

    return compareField(a, b, sort.field) * direction || byName(a, b)
  })
}

export function nextSort(current: EmployeeSort, field: EmployeeSortField): EmployeeSort {
  if (current.field === field) {
    return { field, direction: current.direction === "asc" ? "desc" : "asc" }
  }

  return { field, direction: field === "hiredOn" || field === "lastLoginAt" ? "desc" : "asc" }
}
