"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Edit, Search, Trash2, UserPlus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DeleteEmployeeDialog } from "@/components/company/delete-employee-dialog"
import { EmployeeFormDialog } from "@/components/company/employee-form-dialog"
import { TemporaryPasswordDialog } from "@/components/company/temporary-password-dialog"
import {
  listDepartments,
  listEmployees,
  toastApiError,
  type CompanyEmployeeDto,
  type CreatedEmployeeDto,
  type DepartmentDto,
} from "@/lib/api"
import { formatDate, formatRelativeTime } from "@/lib/format"

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

function matches(employee: CompanyEmployeeDto, term: string): boolean {
  return [employee.fullName, employee.email, employee.departmentName].some(
    (field) => field !== null && normalize(field).includes(term),
  )
}

function byName(a: CompanyEmployeeDto, b: CompanyEmployeeDto): number {
  return a.fullName.localeCompare(b.fullName, "es", { sensitivity: "base" })
}

function Placeholder() {
  return <span className="text-muted-foreground">—</span>
}

export default function EmpleadosPage() {
  const [employees, setEmployees] = useState<CompanyEmployeeDto[] | null>(null)
  const [departments, setDepartments] = useState<DepartmentDto[]>([])
  const [loadFailed, setLoadFailed] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [formState, setFormState] = useState<{ open: boolean; employee?: CompanyEmployeeDto }>({ open: false })
  const [created, setCreated] = useState<CreatedEmployeeDto | null>(null)
  const [employeeToDelete, setEmployeeToDelete] = useState<CompanyEmployeeDto | null>(null)

  const loadStaff = useCallback(async (signal?: AbortSignal) => {
    setLoadFailed(false)
    try {
      const [loadedEmployees, loadedDepartments] = await Promise.all([listEmployees(signal), listDepartments(signal)])
      setEmployees(loadedEmployees.sort(byName))
      setDepartments(loadedDepartments)
    } catch (error) {
      if (signal?.aborted) {
        return
      }
      setLoadFailed(true)
      toastApiError(error, "No se pudieron cargar los empleados.")
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void loadStaff(controller.signal)
    return () => controller.abort()
  }, [loadStaff])

  const filteredEmployees = useMemo(() => {
    const term = normalize(searchTerm.trim())
    return (employees ?? []).filter((employee) => !term || matches(employee, term))
  }, [employees, searchTerm])

  const replaceEmployee = (saved: CompanyEmployeeDto) => {
    setEmployees((current) =>
      [...(current ?? []).filter((employee) => employee.id !== saved.id), saved].sort(byName),
    )
  }

  const handleCreated = (result: CreatedEmployeeDto) => {
    replaceEmployee(result.employee)
    setCreated(result)
  }

  const handleDeleted = (employeeId: string) => {
    setEmployees((current) => (current ?? []).filter((employee) => employee.id !== employeeId))
  }

  const isLoading = employees === null && !loadFailed
  const activeEmployees = employees?.filter((employee) => employee.isActive).length ?? 0
  const inactiveEmployees = (employees?.length ?? 0) - activeEmployees

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestión de Empleados</h1>
        <p className="text-muted-foreground mt-1">
          Administrá los empleados que tienen acceso al beneficio de bienestar financiero
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Empleados</CardDescription>
            <CardTitle className="text-3xl">{isLoading ? <Skeleton className="h-9 w-12" /> : (employees?.length ?? 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Empleados Activos</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {isLoading ? <Skeleton className="h-9 w-12" /> : activeEmployees}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Empleados Inactivos</CardDescription>
            <CardTitle className="text-3xl text-orange-600">
              {isLoading ? <Skeleton className="h-9 w-12" /> : inactiveEmployees}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o departamento..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10"
                aria-label="Buscar empleados"
              />
            </div>

            <Button className="gap-2" onClick={() => setFormState({ open: true })} disabled={loadFailed}>
              <UserPlus className="h-4 w-4" />
              Agregar Empleado
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Empleados</CardTitle>
          <CardDescription>
            {isLoading
              ? "Cargando empleados..."
              : `${filteredEmployees.length} empleado${filteredEmployees.length !== 1 ? "s" : ""} encontrado${filteredEmployees.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Fecha Alta</TableHead>
                  <TableHead>Último Ingreso</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
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
                      <p>No pudimos cargar los empleados.</p>
                      <Button variant="outline" size="sm" className="mt-3" onClick={() => void loadStaff()}>
                        Reintentar
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {employees?.length === 0 ? "Todavía no diste de alta a ningún empleado" : "No se encontraron empleados"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee) => (
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
                          <span className="text-muted-foreground">Nunca</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={employee.isActive ? "default" : "secondary"}>
                          {employee.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setFormState({ open: true, employee })}
                            title="Editar"
                            aria-label={`Editar ${employee.fullName}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEmployeeToDelete(employee)}
                            title="Eliminar"
                            aria-label={`Eliminar ${employee.fullName}`}
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

      {employeeToDelete && (
        <DeleteEmployeeDialog
          employee={employeeToDelete}
          open
          onOpenChange={(open) => !open && setEmployeeToDelete(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
