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
import { deleteEmployee, toastApiError, type CompanyEmployeeDto } from "@/lib/api"

export function DeleteEmployeeDialog({
  employee,
  open,
  onOpenChange,
  onDeleted,
}: {
  employee: CompanyEmployeeDto
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: (employeeId: string) => void
}) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteEmployee(employee.id)
      onDeleted(employee.id)
      toast.success(`${employee.fullName} fue eliminado`)
      onOpenChange(false)
    } catch (error) {
      toastApiError(error, "No se pudo eliminar el empleado.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !isDeleting && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar a {employee.fullName}?</AlertDialogTitle>
          <AlertDialogDescription>
            Pierde el acceso a FinGrow y se borran sus datos financieros: movimientos, presupuestos, metas,
            inversiones, comprobantes e integraciones. Esta acción no se puede deshacer.
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
