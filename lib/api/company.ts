import { api } from "./client"

export const DEPARTMENT_NAME_MAX_LENGTH = 120

export const DEPARTMENT_DESCRIPTION_MAX_LENGTH = 500

export const DEPARTMENT_MANAGER_NAME_MAX_LENGTH = 150

export interface DepartmentDto {
  id: string
  name: string
  description: string | null
  managerName: string | null
  employeeCount: number
  isActive: boolean
  createdAt: string
}

export interface DepartmentPayload {
  name: string
  description: string | null
  managerName: string | null
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
