"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Edit, Plus, Search, Trash2, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DeleteDepartmentDialog } from "@/components/company/delete-department-dialog"
import { DepartmentFormDialog } from "@/components/company/department-form-dialog"
import { listDepartments, toastApiError, type DepartmentDto } from "@/lib/api"
import { formatDate } from "@/lib/format"

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

function matches(department: DepartmentDto, term: string): boolean {
  return [department.name, department.description, department.managerName].some(
    (field) => field !== null && normalize(field).includes(term),
  )
}

function byName(a: DepartmentDto, b: DepartmentDto): number {
  return a.name.localeCompare(b.name, "es", { sensitivity: "base" })
}

export default function DepartamentosPage() {
  const [departments, setDepartments] = useState<DepartmentDto[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [formState, setFormState] = useState<{ open: boolean; department?: DepartmentDto }>({ open: false })
  const [departmentToDelete, setDepartmentToDelete] = useState<DepartmentDto | null>(null)

  const loadDepartments = useCallback(async (signal?: AbortSignal) => {
    setLoadFailed(false)
    try {
      setDepartments((await listDepartments(signal)).sort(byName))
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

  const filteredDepartments = useMemo(() => {
    const term = normalize(searchTerm.trim())
    return (departments ?? []).filter((department) => !term || matches(department, term))
  }, [departments, searchTerm])

  const handleSaved = (saved: DepartmentDto) => {
    setDepartments((current) =>
      [...(current ?? []).filter((department) => department.id !== saved.id), saved].sort(byName),
    )
  }

  const handleDeleted = (departmentId: string) => {
    setDepartments((current) => (current ?? []).filter((department) => department.id !== departmentId))
  }

  const totalDepartments = departments?.length ?? 0
  const activeDepartments = departments?.filter((department) => department.isActive).length ?? 0
  const assignedEmployees = departments?.reduce((sum, department) => sum + department.employeeCount, 0) ?? 0
  const isLoading = departments === null && !loadFailed

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestión de Departamentos</h1>
        <p className="text-muted-foreground mt-1">Administrá los departamentos de tu organización</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Departamentos</CardDescription>
            <CardTitle className="text-3xl">{isLoading ? <Skeleton className="h-9 w-12" /> : totalDepartments}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Departamentos Activos</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {isLoading ? <Skeleton className="h-9 w-12" /> : activeDepartments}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Empleados Asignados</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {isLoading ? <Skeleton className="h-9 w-12" /> : assignedEmployees}
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
                placeholder="Buscar por nombre, descripción o responsable..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10"
                aria-label="Buscar departamentos"
              />
            </div>

            <Button className="gap-2" onClick={() => setFormState({ open: true })} disabled={loadFailed}>
              <Plus className="h-4 w-4" />
              Agregar Departamento
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Departamentos</CardTitle>
          <CardDescription>
            {isLoading
              ? "Cargando departamentos..."
              : `${filteredDepartments.length} departamento${filteredDepartments.length !== 1 ? "s" : ""} encontrado${filteredDepartments.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Empleados</TableHead>
                  <TableHead>Fecha Creación</TableHead>
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
                ) : filteredDepartments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {departments?.length === 0
                        ? "Todavía no cargaste ningún departamento"
                        : "No se encontraron departamentos"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDepartments.map((department) => (
                    <TableRow key={department.id}>
                      <TableCell className="font-medium">{department.name}</TableCell>
                      <TableCell className="max-w-xs truncate" title={department.description ?? undefined}>
                        {department.description ?? <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>{department.managerName ?? <span className="text-muted-foreground">—</span>}</TableCell>
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
