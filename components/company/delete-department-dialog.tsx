"use client"

import { useState } from "react"
import { Archive } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { deleteDepartment, isApiError, toastApiError, type DepartmentDto } from "@/lib/api"
import { plural } from "@/lib/utils"

export function DeleteDepartmentDialog({
  department,
  open,
  onOpenChange,
  onDeleted,
  onRejected,
  onDeactivateInstead,
}: {
  department: DepartmentDto
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: (departmentId: string) => void
  onRejected: () => void
  onDeactivateInstead: () => void
}) {
  const [isDeleting, setIsDeleting] = useState(false)
  const employees = department.employeeCount
  const hasEmployees = employees > 0

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteDepartment(department.id)
      onDeleted(department.id)
      toast.success(`Departamento "${department.name}" eliminado`)
      onOpenChange(false)
    } catch (error) {
      if (isApiError(error) && error.code === "Department.HasEmployees") {
        toast.error(error.description)
        onRejected()
        onOpenChange(false)
        return
      }

      toastApiError(error, "No se pudo eliminar el departamento.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !isDeleting && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar el departamento &quot;{department.name}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            {hasEmployees
              ? `Tiene ${employees} ${plural(employees, "empleado asignado", "empleados asignados")}: no se puede eliminar mientras tenga gente.`
              : "Se borra junto con sus métricas de meses anteriores y no se puede recuperar."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {department.isActive ? (
          <div className="flex flex-col gap-3 rounded-md border bg-muted/50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-foreground">
                {hasEmployees ? "¿El departamento ya no existe?" : "¿Querés conservar su historial?"}
              </p>
              <p className="text-muted-foreground">
                {hasEmployees
                  ? "Desactivalo: movés a su gente en el mismo paso y sus métricas se conservan."
                  : "Desactivalo: deja de usarse pero sus métricas se conservan."}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-2"
              disabled={isDeleting}
              onClick={onDeactivateInstead}
            >
              <Archive className="h-4 w-4" />
              Desactivar en su lugar
            </Button>
          </div>
        ) : (
          !hasEmployees && (
            <p className="rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground">
              Ya está desactivado: mientras no lo elimines, sus métricas de meses anteriores se conservan.
            </p>
          )
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting || hasEmployees}
            onClick={() => void handleDelete()}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
