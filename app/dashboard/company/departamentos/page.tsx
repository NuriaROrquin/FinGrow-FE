"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Edit, Plus, Trash2, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { SortableTableHead } from "@/components/company/sortable-table-head"
import { listDepartments, toastApiError, type DepartmentDto } from "@/lib/api"
import { formatDate } from "@/lib/format"
import { plural } from "@/lib/utils"

function Placeholder() {
  return <span className="text-muted-foreground">—</span>
}

export default function DepartamentosPage() {
  const [departments, setDepartments] = useState<DepartmentDto[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [filters, setFilters] = useState<DepartmentFilterValues>(defaultDepartmentFilters)
  const [sort, setSort] = useState<DepartmentSort>(defaultDepartmentSort)
  const [formState, setFormState] = useState<{ open: boolean; department?: DepartmentDto }>({ open: false })
  const [departmentToDelete, setDepartmentToDelete] = useState<DepartmentDto | null>(null)

  const loadDepartments = useCallback(async (signal?: AbortSignal) => {
    setLoadFailed(false)
    try {
      setDepartments(await listDepartments(signal))
    } catch (error) {
      if (signal?.aborted) {
        return
      }
      setLoadFailed(true)
      toastApiError(error, "No se pudieron cargar los departamentos.")
    }
  }, [])

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
  const departmentsWithoutManager = departments?.filter((department) => department.managerName === null).length ?? 0
  const assignedEmployees = departments?.reduce((sum, department) => sum + department.employeeCount, 0) ?? 0
  const isFiltered = hasActiveDepartmentFilters(filters)

  const listDescription = isLoading
    ? "Cargando departamentos..."
    : isFiltered
      ? `${visibleDepartments.length} de ${totalDepartments} ${plural(totalDepartments, "departamento", "departamentos")}`
      : `${totalDepartments} ${plural(totalDepartments, "departamento", "departamentos")}`

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Departamentos</h1>
          <p className="text-muted-foreground mt-1">Administrá los departamentos de tu organización</p>
        </div>
        <Button className="gap-2 self-start sm:self-auto" onClick={() => setFormState({ open: true })} disabled={loadFailed}>
          <Plus className="h-4 w-4" />
          Agregar Departamento
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <FilterStatCard
          label="Total Departamentos"
          value={totalDepartments}
          hint={`${assignedEmployees} ${plural(assignedEmployees, "empleado asignado", "empleados asignados")}`}
          isLoading={isLoading}
          isSelected={filters.staff === "all" && filters.manager === "all"}
          onSelect={() => setFilters((current) => ({ ...current, staff: "all", manager: "all" }))}
        />
        <FilterStatCard
          label="Sin Empleados"
          value={emptyDepartments}
          valueClassName="text-orange-600"
          isLoading={isLoading}
          isSelected={filters.staff === "empty"}
          onSelect={() => toggleStaff("empty")}
        />
        <FilterStatCard
          label="Sin Responsable"
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
          <CardTitle>Lista de Departamentos</CardTitle>
          <CardDescription>{listDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    label="Nombre"
                    field="name"
                    sortField={sort.field}
                    sortDirection={sort.direction}
                    onSort={handleSort}
                  />
                  <TableHead>Descripción</TableHead>
                  <SortableTableHead
                    label="Responsable"
                    field="managerName"
                    sortField={sort.field}
                    sortDirection={sort.direction}
                    onSort={handleSort}
                  />
                  <SortableTableHead
                    label="Empleados"
                    field="employeeCount"
                    sortField={sort.field}
                    sortDirection={sort.direction}
                    onSort={handleSort}
                  />
                  <SortableTableHead
                    label="Fecha Creación"
                    field="createdAt"
                    sortField={sort.field}
                    sortDirection={sort.direction}
                    onSort={handleSort}
                  />
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
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
                      <p>No pudimos cargar los departamentos.</p>
                      <Button variant="outline" size="sm" className="mt-3" onClick={() => void loadDepartments()}>
                        Reintentar
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : visibleDepartments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {totalDepartments === 0 ? (
                        "Todavía no cargaste ningún departamento"
                      ) : (
                        <>
                          <p>Ningún departamento coincide con los filtros.</p>
                          <Button variant="outline" size="sm" className="mt-3" onClick={clearFilters}>
                            Limpiar filtros
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
                      <TableCell>{department.managerName ?? <Placeholder />}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{department.employeeCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(department.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant={department.isActive ? "default" : "secondary"}>
                          {department.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setFormState({ open: true, department })}
                            title="Editar"
                            aria-label={`Editar ${department.name}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDepartmentToDelete(department)}
                            title="Eliminar"
                            aria-label={`Eliminar ${department.name}`}
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
        />
      )}
    </div>
  )
}
