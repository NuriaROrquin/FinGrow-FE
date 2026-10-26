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
import { useMessages } from "@/lib/i18n"

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
  const messages = useMessages()
  const t = messages.departments
  const [isDeleting, setIsDeleting] = useState(false)
  const employees = department.employeeCount
  const hasEmployees = employees > 0

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteDepartment(department.id)
      onDeleted(department.id)
      toast.success(t.deleted(department.name))
      onOpenChange(false)
    } catch (error) {
      if (isApiError(error) && error.code === "Department.HasEmployees") {
        toast.error(error.description)
        onRejected()
        onOpenChange(false)
        return
      }

      toastApiError(error, t.deleteFailed)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !isDeleting && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.deleteTitle(department.name)}</AlertDialogTitle>
          <AlertDialogDescription>
            {hasEmployees ? t.hasEmployees(employees) : t.deleteWarning}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {department.isActive ? (
          <div className="flex flex-col gap-3 rounded-md border bg-muted/50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-foreground">
                {hasEmployees ? t.noLongerExists : t.keepHistory}
              </p>
              <p className="text-muted-foreground">
                {hasEmployees ? t.deactivateMovingPeople : t.deactivateKeepsMetrics}
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
              {t.deactivateInstead}
            </Button>
          </div>
        ) : (
          !hasEmployees && (
            <p className="rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground">
              {t.alreadyInactive}
            </p>
          )
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{messages.common.cancel}</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting || hasEmployees}
            onClick={() => void handleDelete()}
          >
            {isDeleting ? t.deleting : t.delete}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
