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
import { changeEmployeeAccess, toastApiError, type CompanyEmployeeDto } from "@/lib/api"

export function DeactivateEmployeeDialog({
  employee,
  open,
  onOpenChange,
  onDeactivated,
}: {
  employee: CompanyEmployeeDto
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeactivated: (employee: CompanyEmployeeDto) => void
}) {
  const [isSaving, setIsSaving] = useState(false)

  const handleDeactivate = async () => {
    setIsSaving(true)
    try {
      onDeactivated(await changeEmployeeAccess(employee.id, false))
      toast.success(`Se desactivó el acceso de ${employee.fullName}`)
      onOpenChange(false)
    } catch (error) {
      toastApiError(error, "No se pudo desactivar el acceso.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Desactivar el acceso de {employee.fullName}?</AlertDialogTitle>
          <AlertDialogDescription>
            No va a poder iniciar sesión y se cierran sus sesiones abiertas. Sus datos se conservan y podés
            reactivarlo cuando quieras. Un acceso desactivado deja de contar como licencia activa.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={isSaving}
            onClick={(event) => {
              event.preventDefault()
              void handleDeactivate()
            }}
          >
            {isSaving ? "Desactivando..." : "Desactivar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
