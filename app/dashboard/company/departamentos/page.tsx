"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Edit, Plus, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SortableTableHead } from "@/components/ui/sortable-table-head"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DeactivateDepartmentDialog } from "@/components/company/deactivate-department-dialog"
import { DeleteDepartmentDialog } from "@/components/company/delete-department-dialog"
import { DepartmentFiltersBar } from "@/components/company/department-filters-bar"
import {
  defaultDepartmentFilters,
  defaultDepartmentSort,
  filterDepartments,
  hasActiveDepartmentFilters,
  nextDepartmentSort,
  sortDepartments,
  type DepartmentFilterValues,
  type DepartmentManagerFilter,
  type DepartmentSort,
  type DepartmentSortField,
  type DepartmentStaffFilter,
} from "@/components/company/department-filters"
import { DepartmentFormDialog } from "@/components/company/department-form-dialog"
import { FilterStatCard } from "@/components/company/filter-stat-card"
import {
  changeDepartmentStatus,
  listDepartments,
  listEmployees,
  toastApiError,
  type CompanyEmployeeDto,
  type DepartmentDto,
} from "@/lib/api"
import { formatDate } from "@/lib/format"
import { useMessages } from "@/lib/i18n"

function Placeholder() {
  return <span className="text-muted-foreground">—</span>
}

export default function DepartamentosPage() {
  const t = useMessages().departments
  const [departments, setDepartments] = useState<DepartmentDto[] | null>(null)
  const [employees, setEmployees] = useState<CompanyEmployeeDto[]>([])
  const [loadFailed, setLoadFailed] = useState(false)
  const [filters, setFilters] = useState<DepartmentFilterValues>(defaultDepartmentFilters)
  const [sort, setSort] = useState<DepartmentSort>(defaultDepartmentSort)
  const [formState, setFormState] = useState<{ open: boolean; department?: DepartmentDto }>({ open: false })
  const [departmentToDelete, setDepartmentToDelete] = useState<DepartmentDto | null>(null)
  const [departmentToDeactivate, setDepartmentToDeactivate] = useState<DepartmentDto | null>(null)
  const [reactivatingId, setReactivatingId] = useState<string | null>(null)

  const loadDepartments = useCallback(async (signal?: AbortSignal) => {
    setLoadFailed(false)
    try {
      const [loadedDepartments, loadedEmployees] = await Promise.all([listDepartments(signal), listEmployees(signal)])
      setDepartments(loadedDepartments)
      setEmployees(loadedEmployees)
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
    void loadDepartments(controller.signal)
    return () => controller.abort()
  }, [loadDepartments])

  const visibleDepartments = useMemo(
    () => sortDepartments(filterDepartments(departments ?? [], filters), sort),
    [departments, filters, sort],
  )

  const handleSaved = (saved: DepartmentDto) => {
    setDepartments((current) => [...(current ?? []).filter((department) => department.id !== saved.id), saved])
  }

  const reactivate = async (department: DepartmentDto) => {
    setReactivatingId(department.id)
    try {
      handleSaved(await changeDepartmentStatus(department.id, true))
      toast.success(t.reactivated(department.name))
    } catch (error) {
      toastApiError(error, t.reactivateFailed)
    } finally {
      setReactivatingId(null)
    }
  }

  const handleDeleted = (departmentId: string) => {
    setDepartments((current) => (current ?? []).filter((department) => department.id !== departmentId))
  }

  const toggleStaff = (staff: DepartmentStaffFilter) =>
    setFilters((current) => ({ ...current, staff: current.staff === staff ? "all" : staff }))

  const toggleManager = (manager: DepartmentManagerFilter) =>
    setFilters((current) => ({ ...current, manager: current.manager === manager ? "all" : manager }))

  const clearFilters = () => setFilters(defaultDepartmentFilters)

  const handleSort = (field: DepartmentSortField) => setSort((current) => nextDepartmentSort(current, field))

  const isLoading = departments === null && !loadFailed
  const totalDepartments = departments?.length ?? 0
  const emptyDepartments = departments?.filter((department) => department.employeeCount === 0).length ?? 0
  const departmentsWithoutManager = departments?.filter((department) => department.manager === null).length ?? 0
  const assignedEmployees = departments?.reduce((sum, department) => sum + department.employeeCount, 0) ?? 0
  const inactiveDepartments = departments?.filter((department) => !department.isActive).length ?? 0
  const totalHint = [
    t.assignedEmployees(assignedEmployees),
    inactiveDepartments > 0 ? t.inactiveCount(inactiveDepartments) : null,
  ]
    .filter(Boolean)
    .join(" · ")
  const isFiltered = hasActiveDepartmentFilters(filters)

  const listDescription = isLoading
    ? t.loading
    : isFiltered
      ? t.filteredCount(visibleDepartments.length, totalDepartments)
      : t.count(totalDepartments)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <Button className="gap-2 self-start sm:self-auto" onClick={() => setFormState({ open: true })} disabled={loadFailed}>
          <Plus className="h-4 w-4" />
          {t.add}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <FilterStatCard
          label={t.total}
          value={totalDepartments}
          hint={totalHint}
          isLoading={isLoading}
          isSelected={filters.staff === "all" && filters.manager === "all"}
          onSelect={() => setFilters((current) => ({ ...current, staff: "all", manager: "all" }))}
        />
        <FilterStatCard
          label={t.withoutEmployees}
          value={emptyDepartments}
          valueClassName="text-orange-600"
          isLoading={isLoading}
          isSelected={filters.staff === "empty"}
          onSelect={() => toggleStaff("empty")}
        />
        <FilterStatCard
          label={t.withoutManager}
          value={departmentsWithoutManager}
          valueClassName="text-orange-600"
          isLoading={isLoading}
          isSelected={filters.manager === "withoutManager"}
          onSelect={() => toggleManager("withoutManager")}
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <DepartmentFiltersBar values={filters} onChange={setFilters} onClear={clearFilters} />
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
                  <SortableTableHead label={t.columnName} field="name" sort={sort} onSort={handleSort} />
                  <SortableTableHead label={t.columnDescription} field="description" sort={sort} onSort={handleSort} />
                  <SortableTableHead label={t.columnManager} field="manager" sort={sort} onSort={handleSort} />
                  <SortableTableHead label={t.columnEmployees} field="employeeCount" sort={sort} onSort={handleSort} />
                  <SortableTableHead label={t.columnCreatedAt} field="createdAt" sort={sort} onSort={handleSort} />
                  <SortableTableHead label={t.columnStatus} field="isActive" sort={sort} onSort={handleSort} />
                  <TableHead className="text-right">{t.columnActions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }, (_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : loadFailed ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <p>{t.listLoadFailed}</p>
                      <Button variant="outline" size="sm" className="mt-3" onClick={() => void loadDepartments()}>
                        {t.retry}
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : visibleDepartments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {totalDepartments === 0 ? (
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
                  visibleDepartments.map((department) => (
                    <TableRow key={department.id}>
                      <TableCell className="font-medium">{department.name}</TableCell>
                      <TableCell className="max-w-xs truncate" title={department.description ?? undefined}>
                        {department.description ?? <Placeholder />}
                      </TableCell>
                      <TableCell>
                        {department.manager ? (
                          <span className={department.manager.isActive ? undefined : "text-muted-foreground"}>
                            {department.manager.fullName}
                            {!department.manager.isActive && t.withoutAccess}
                          </span>
                        ) : (
                          <Placeholder />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{department.employeeCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(department.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={department.isActive}
                            disabled={reactivatingId === department.id}
                            onCheckedChange={(checked) =>
                              checked ? void reactivate(department) : setDepartmentToDeactivate(department)
                            }
                            aria-label={department.isActive ? t.deactivateAria(department.name) : t.reactivateAria(department.name)}
                          />
                          <span className={department.isActive ? "text-sm" : "text-sm text-muted-foreground"}>
                            {department.isActive ? t.active : t.inactive}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setFormState({ open: true, department })}
                            title={t.edit}
                            aria-label={t.editAria(department.name)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDepartmentToDelete(department)}
                            title={t.delete}
                            aria-label={t.deleteAria(department.name)}
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

      <DepartmentFormDialog
        department={formState.department}
        employees={employees}
        open={formState.open}
        onOpenChange={(open) => setFormState((current) => ({ ...current, open }))}
        onSaved={handleSaved}
      />

      {departmentToDelete && (
        <DeleteDepartmentDialog
          department={departmentToDelete}
          open
          onOpenChange={(open) => !open && setDepartmentToDelete(null)}
          onDeleted={handleDeleted}
          onRejected={() => void loadDepartments()}
          onDeactivateInstead={() => {
            setDepartmentToDeactivate(departmentToDelete)
            setDepartmentToDelete(null)
          }}
        />
      )}

      {departmentToDeactivate && (
        <DeactivateDepartmentDialog
          department={departmentToDeactivate}
          departments={departments ?? []}
          open
          onOpenChange={(open) => !open && setDepartmentToDeactivate(null)}
          onDeactivated={() => void loadDepartments()}
        />
      )}
    </div>
  )
}
