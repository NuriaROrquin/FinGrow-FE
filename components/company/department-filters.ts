import type { DepartmentDto } from "@/lib/api"
import { normalizeForSearch } from "@/lib/utils"

export type DepartmentStatusFilter = "all" | "active" | "inactive"

export type DepartmentStaffFilter = "all" | "withEmployees" | "empty"

export type DepartmentManagerFilter = "all" | "withManager" | "withoutManager"

export interface DepartmentFilterValues {
  search: string
  status: DepartmentStatusFilter
  staff: DepartmentStaffFilter
  manager: DepartmentManagerFilter
}

export const defaultDepartmentFilters: DepartmentFilterValues = {
  search: "",
  status: "all",
  staff: "all",
  manager: "all",
}

export const departmentStatusLabels: Record<DepartmentStatusFilter, string> = {
  all: "Todos",
  active: "Activos",
  inactive: "Inactivos",
}

export const departmentStaffLabels: Record<DepartmentStaffFilter, string> = {
  all: "Todos",
  withEmployees: "Con empleados",
  empty: "Sin empleados",
}

export const departmentManagerLabels: Record<DepartmentManagerFilter, string> = {
  all: "Todos",
  withManager: "Con responsable",
  withoutManager: "Sin responsable",
}

export type DepartmentSortField = "name" | "managerName" | "employeeCount" | "createdAt"

export interface DepartmentSort {
  field: DepartmentSortField
  direction: "asc" | "desc"
}

export const defaultDepartmentSort: DepartmentSort = { field: "name", direction: "asc" }

export function hasActiveDepartmentFilters(values: DepartmentFilterValues): boolean {
  return values.search.trim() !== "" || values.status !== "all" || values.staff !== "all" || values.manager !== "all"
}

function matchesSearch(department: DepartmentDto, search: string): boolean {
  const term = normalizeForSearch(search.trim())

  return (
    !term ||
    [department.name, department.description, department.managerName].some(
      (field) => field !== null && normalizeForSearch(field).includes(term),
    )
  )
}

function matchesStatus(department: DepartmentDto, status: DepartmentStatusFilter): boolean {
  return status === "all" || department.isActive === (status === "active")
}

function matchesStaff(department: DepartmentDto, staff: DepartmentStaffFilter): boolean {
  return staff === "all" || (department.employeeCount > 0) === (staff === "withEmployees")
}

function matchesManager(department: DepartmentDto, manager: DepartmentManagerFilter): boolean {
  return manager === "all" || (department.managerName !== null) === (manager === "withManager")
}

export function filterDepartments(departments: DepartmentDto[], values: DepartmentFilterValues): DepartmentDto[] {
  return departments.filter(
    (department) =>
      matchesSearch(department, values.search) &&
      matchesStatus(department, values.status) &&
      matchesStaff(department, values.staff) &&
      matchesManager(department, values.manager),
  )
}

function byName(a: DepartmentDto, b: DepartmentDto): number {
  return a.name.localeCompare(b.name, "es", { sensitivity: "base" })
}

function compareField(a: DepartmentDto, b: DepartmentDto, field: DepartmentSortField): number {
  switch (field) {
    case "employeeCount":
      return a.employeeCount - b.employeeCount
    case "createdAt":
      return a.createdAt.localeCompare(b.createdAt)
    case "managerName":
      return (a.managerName ?? "").localeCompare(b.managerName ?? "", "es", { sensitivity: "base" })
    default:
      return byName(a, b)
  }
}

export function sortDepartments(departments: DepartmentDto[], sort: DepartmentSort): DepartmentDto[] {
  const direction = sort.direction === "asc" ? 1 : -1

  return [...departments].sort((a, b) => {
    if (sort.field === "managerName" && (a.managerName === null) !== (b.managerName === null)) {
      return a.managerName === null ? 1 : -1
    }

    return compareField(a, b, sort.field) * direction || byName(a, b)
  })
}

export function nextDepartmentSort(current: DepartmentSort, field: DepartmentSortField): DepartmentSort {
  if (current.field === field) {
    return { field, direction: current.direction === "asc" ? "desc" : "asc" }
  }

  return { field, direction: field === "employeeCount" || field === "createdAt" ? "desc" : "asc" }
}
