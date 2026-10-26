"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Edit, Trash2, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SortableTableHead } from "@/components/ui/sortable-table-head"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DeactivateEmployeeDialog } from "@/components/company/deactivate-employee-dialog"
import { DeleteEmployeeDialog } from "@/components/company/delete-employee-dialog"
import { EmployeeFiltersBar, type DepartmentFilterOption } from "@/components/company/employee-filters-bar"
import {
  defaultEmployeeFilters,
  defaultEmployeeSort,
  filterEmployees,
  hasActiveFilters,
  hasHiredRangeError,
  nextSort,
  NO_DEPARTMENT_FILTER,
  sortEmployees,
  type EmployeeFilterValues,
  type EmployeeSort,
  type EmployeeSortField,
  type EmployeeStatusFilter,
} from "@/components/company/employee-filters"
import { EmployeeFormDialog } from "@/components/company/employee-form-dialog"
import { FilterStatCard } from "@/components/company/filter-stat-card"
import { TemporaryPasswordDialog } from "@/components/company/temporary-password-dialog"
import {
  changeEmployeeAccess,
  listDepartments,
  listEmployees,
  toastApiError,
  type CompanyEmployeeDto,
  type CreatedEmployeeDto,
  type DepartmentDto,
} from "@/lib/api"
import { formatDate, formatRelativeTime } from "@/lib/format"
import { useMessages } from "@/lib/i18n"

function Placeholder() {
  return <span className="text-muted-foreground">—</span>
}

export default function EmpleadosPage() {
  const t = useMessages().employees
  const [employees, setEmployees] = useState<CompanyEmployeeDto[] | null>(null)
  const [departments, setDepartments] = useState<DepartmentDto[]>([])
  const [loadFailed, setLoadFailed] = useState(false)
  const [filters, setFilters] = useState<EmployeeFilterValues>(defaultEmployeeFilters)
  const [sort, setSort] = useState<EmployeeSort>(defaultEmployeeSort)
  const [formState, setFormState] = useState<{ open: boolean; employee?: CompanyEmployeeDto }>({ open: false })
  const [created, setCreated] = useState<CreatedEmployeeDto | null>(null)
  const [employeeToDelete, setEmployeeToDelete] = useState<CompanyEmployeeDto | null>(null)
  const [employeeToDeactivate, setEmployeeToDeactivate] = useState<CompanyEmployeeDto | null>(null)
  const [reactivatingId, setReactivatingId] = useState<string | null>(null)

  const loadStaff = useCallback(async (signal?: AbortSignal) => {
    setLoadFailed(false)
    try {
      const [loadedEmployees, loadedDepartments] = await Promise.all([listEmployees(signal), listDepartments(signal)])
      setEmployees(loadedEmployees)
      setDepartments(loadedDepartments)
    } catch (error) {
      if (signal?.aborted) {
        return
      }
      setLoadFailed(true)
      toastApiError(error, t.loadFailed)
    }
  }, [t])

  useEffect(() => {
    const controller = new AbortController()
    void loadStaff(controller.signal)
    return () => controller.abort()
  }, [loadStaff])

  const visibleEmployees = useMemo(
    () => sortEmployees(filterEmployees(employees ?? [], filters), sort),
    [employees, filters, sort],
  )

  const departmentOptions = useMemo<DepartmentFilterOption[]>(() => {
    const countFor = (departmentId: string | null) =>
      (employees ?? []).filter((employee) => employee.departmentId === departmentId).length

    return [
      { id: NO_DEPARTMENT_FILTER, name: t.noDepartment, employees: countFor(null), isActive: true },
      ...[...departments]
        .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }))
        .map((department) => ({
          id: department.id,
          name: department.name,
          employees: countFor(department.id),
          isActive: department.isActive,
        })),
    ]
  }, [departments, employees, t])

  const replaceEmployee = (saved: CompanyEmployeeDto) => {
    setEmployees((current) => [...(current ?? []).filter((employee) => employee.id !== saved.id), saved])
  }

  const handleCreated = (result: CreatedEmployeeDto) => {
    replaceEmployee(result.employee)
    setCreated(result)
  }

  const reactivate = async (employee: CompanyEmployeeDto) => {
    setReactivatingId(employee.id)
    try {
      replaceEmployee(await changeEmployeeAccess(employee.id, true))
      toast.success(t.reactivated(employee.fullName))
    } catch (error) {
      toastApiError(error, t.reactivateFailed)
    } finally {
      setReactivatingId(null)
    }
  }

  const handleDeleted = (employeeId: string) => {
    setEmployees((current) => (current ?? []).filter((employee) => employee.id !== employeeId))
  }

  const selectStatus = (status: EmployeeStatusFilter) =>
    setFilters((current) => ({ ...current, status: current.status === status ? "all" : status }))

  const clearFilters = () => setFilters(defaultEmployeeFilters)

  const handleSort = (field: EmployeeSortField) => setSort((current) => nextSort(current, field))

  const isLoading = employees === null && !loadFailed
  const totalEmployees = employees?.length ?? 0
  const activeEmployees = employees?.filter((employee) => employee.isActive).length ?? 0
  const inactiveEmployees = totalEmployees - activeEmployees
  const isFiltered = hasActiveFilters(filters)

  const listDescription = isLoading
    ? t.loading
    : isFiltered
      ? t.filteredCount(visibleEmployees.length, totalEmployees)
      : t.count(totalEmployees)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <Button className="gap-2 self-start sm:self-auto" onClick={() => setFormState({ open: true })} disabled={loadFailed}>
          <UserPlus className="h-4 w-4" />
          {t.add}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <FilterStatCard
          label={t.total}
          value={totalEmployees}
          isLoading={isLoading}
          isSelected={filters.status === "all"}
          onSelect={() => setFilters((current) => ({ ...current, status: "all" }))}
        />
        <FilterStatCard
          label={t.active}
          value={activeEmployees}
          valueClassName="text-green-600"
          isLoading={isLoading}
          isSelected={filters.status === "active"}
          onSelect={() => selectStatus("active")}
        />
        <FilterStatCard
          label={t.inactive}
          value={inactiveEmployees}
          valueClassName="text-orange-600"
          isLoading={isLoading}
          isSelected={filters.status === "inactive"}
          onSelect={() => selectStatus("inactive")}
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <EmployeeFiltersBar
            values={filters}
            departmentOptions={departmentOptions}
            onChange={setFilters}
            onClear={clearFilters}
            error={hasHiredRangeError(filters)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.listTitle}</CardTitle>
          <CardDescription>{listDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead label={t.columnName} field="fullName" sort={sort} onSort={handleSort} />
                  <SortableTableHead label={t.columnEmail} field="email" sort={sort} onSort={handleSort} />
                  <SortableTableHead label={t.columnPhone} field="phoneNumber" sort={sort} onSort={handleSort} />
                  <SortableTableHead label={t.columnDepartment} field="departmentName" sort={sort} onSort={handleSort} />
                  <SortableTableHead label={t.columnHiredOn} field="hiredOn" sort={sort} onSort={handleSort} />
                  <SortableTableHead label={t.columnLastLogin} field="lastLoginAt" sort={sort} onSort={handleSort} />
                  <SortableTableHead label={t.columnStatus} field="isActive" sort={sort} onSort={handleSort} />
                  <TableHead className="text-right">{t.columnActions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }, (_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={8}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : loadFailed ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <p>{t.listLoadFailed}</p>
                      <Button variant="outline" size="sm" className="mt-3" onClick={() => void loadStaff()}>
                        {t.retry}
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : visibleEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {totalEmployees === 0 ? (
                        t.empty
                      ) : (
                        <>
                          <p>{t.noMatches}</p>
                          <Button variant="outline" size="sm" className="mt-3" onClick={clearFilters}>
                            {t.clearFilters}
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.fullName}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.phoneNumber ?? <Placeholder />}</TableCell>
                      <TableCell>{employee.departmentName ?? <Placeholder />}</TableCell>
                      <TableCell>{formatDate(employee.hiredOn)}</TableCell>
                      <TableCell>
                        {employee.lastLoginAt ? (
                          formatRelativeTime(employee.lastLoginAt)
                        ) : (
                          <span className="text-muted-foreground">{t.never}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {employee.withdrawnAt ? (
                          // La baja la pidió el empleado (HU-74): sus datos ya no existen y no se reactiva.
                          <Badge
                            variant="outline"
                            className="text-muted-foreground"
                            title={`Se dio de baja el ${formatDate(employee.withdrawnAt)} y borró sus datos`}
                          >
                            Dado de baja
                          </Badge>
                        ) : (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={employee.isActive}
                            disabled={reactivatingId === employee.id}
                            onCheckedChange={(checked) =>
                              checked ? void reactivate(employee) : setEmployeeToDeactivate(employee)
                            }
                            aria-label={employee.isActive ? t.deactivateAccessAria(employee.fullName) : t.reactivateAccessAria(employee.fullName)}
                          />
                          <span className={employee.isActive ? "text-sm" : "text-sm text-muted-foreground"}>
                            {employee.isActive ? t.statusActive : t.statusInactive}
                          </span>
                        </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setFormState({ open: true, employee })}
                            title={t.edit}
                            aria-label={t.editAria(employee.fullName)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEmployeeToDelete(employee)}
                            title={t.delete}
                            aria-label={t.deleteAria(employee.fullName)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <EmployeeFormDialog
        employee={formState.employee}
        departments={departments}
        open={formState.open}
        onOpenChange={(open) => setFormState((current) => ({ ...current, open }))}
        onCreated={handleCreated}
        onUpdated={replaceEmployee}
      />

      <TemporaryPasswordDialog created={created} onClose={() => setCreated(null)} />

      {employeeToDeactivate && (
        <DeactivateEmployeeDialog
          employee={employeeToDeactivate}
          open
          onOpenChange={(open) => !open && setEmployeeToDeactivate(null)}
          onDeactivated={replaceEmployee}
        />
      )}

      {employeeToDelete && (
        <DeleteEmployeeDialog
          employee={employeeToDelete}
          open
          onOpenChange={(open) => !open && setEmployeeToDelete(null)}
          onDeleted={handleDeleted}
          onDeactivated={replaceEmployee}
        />
      )}
    </div>
  )
}
