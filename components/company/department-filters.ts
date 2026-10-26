import type { DepartmentDto } from "@/lib/api"
import { compareText, sortRows, toDate, toggleSort, type SortAccessors, type SortState } from "@/lib/sort"
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

export type DepartmentSortField = "name" | "description" | "manager" | "employeeCount" | "createdAt" | "isActive"

export type DepartmentSort = SortState<DepartmentSortField>

export const defaultDepartmentSort: DepartmentSort = { field: "name", direction: "asc" }

export function hasActiveDepartmentFilters(values: DepartmentFilterValues): boolean {
  return values.search.trim() !== "" || values.status !== "all" || values.staff !== "all" || values.manager !== "all"
}

function matchesSearch(department: DepartmentDto, search: string): boolean {
  const term = normalizeForSearch(search.trim())

  return (
    !term ||
    [department.name, department.description, department.manager?.fullName ?? null].some(
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
  return manager === "all" || (department.manager !== null) === (manager === "withManager")
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

const departmentSortValues: SortAccessors<DepartmentDto, DepartmentSortField> = {
  name: (department) => department.name,
  description: (department) => department.description,
  manager: (department) => department.manager?.fullName ?? null,
  employeeCount: (department) => department.employeeCount,
  createdAt: (department) => toDate(department.createdAt),
  isActive: (department) => (department.isActive ? "active" : "inactive"),
}

export function sortDepartments(departments: DepartmentDto[], sort: DepartmentSort): DepartmentDto[] {
  return sortRows(departments, sort, departmentSortValues, (a, b) => compareText(a.name, b.name))
}

export function nextDepartmentSort(current: DepartmentSort, field: DepartmentSortField): DepartmentSort {
  return toggleSort(current, field, ["employeeCount", "createdAt"])
}
