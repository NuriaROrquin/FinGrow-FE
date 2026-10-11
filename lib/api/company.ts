import { api } from "./client"

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
