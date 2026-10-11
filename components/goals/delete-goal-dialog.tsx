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
import { deleteGoal, toastApiError, type GoalDto } from "@/lib/api"
import { formatMoney } from "@/lib/format"

export function DeleteGoalDialog({
  goal,
  open,
  onOpenChange,
  onDeleted,
}: {
  goal: GoalDto
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: (goalId: string) => void
}) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteGoal(goal.id)
      onDeleted(goal.id)
      toast.success(`Meta "${goal.name}" eliminada`)
      onOpenChange(false)
    } catch (error) {
      toastApiError(error, "No se pudo eliminar la meta.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !isDeleting && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar la meta &quot;{goal.name}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            Llevás ahorrado {formatMoney(goal.currentAmount, goal.currency)} de{" "}
            {formatMoney(goal.targetAmount, goal.currency)}. La meta deja de mostrarse y de contar en tus
            reportes. Esta acción no se puede deshacer.
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
