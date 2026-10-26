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
import { useMessages } from "@/lib/i18n"

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
  const messages = useMessages()
  const t = messages.employees
  const [isSaving, setIsSaving] = useState(false)

  const handleDeactivate = async () => {
    setIsSaving(true)
    try {
      onDeactivated(await changeEmployeeAccess(employee.id, false))
      toast.success(t.deactivated(employee.fullName))
      onOpenChange(false)
    } catch (error) {
      toastApiError(error, t.deactivateFailed)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.deactivateTitle(employee.fullName)}</AlertDialogTitle>
          <AlertDialogDescription>{t.deactivateDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSaving}>{messages.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={isSaving}
            onClick={(event) => {
              event.preventDefault()
              void handleDeactivate()
            }}
          >
            {isSaving ? t.deactivating : t.deactivate}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
