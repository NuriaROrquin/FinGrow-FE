"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteDepartment, isApiError, toastApiError, type DepartmentDto } from "@/lib/api"

export function DeleteDepartmentDialog({
  department,
  open,
  onOpenChange,
  onDeleted,
  onRejected,
}: {
  department: DepartmentDto
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: (departmentId: string) => void
  onRejected: () => void
}) {
  const [isDeleting, setIsDeleting] = useState(false)
  const hasEmployees = department.employeeCount > 0

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
              ? `Tiene ${department.employeeCount} empleado${department.employeeCount === 1 ? "" : "s"} asignado${department.employeeCount === 1 ? "" : "s"}: no se va a poder eliminar hasta que los reasignes a otro departamento.`
              : "El departamento deja de existir y no se puede recuperar."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting}
            onClick={(event) => {
              event.preventDefault()
              void handleDelete()
            }}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
