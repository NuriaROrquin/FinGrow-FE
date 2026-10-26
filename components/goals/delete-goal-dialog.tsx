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
import { useMessages } from "@/lib/i18n"

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
  const messages = useMessages()
  const t = messages.goals
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteGoal(goal.id)
      onDeleted(goal.id)
      toast.success(t.deleted(goal.name))
      onOpenChange(false)
    } catch (error) {
      toastApiError(error, t.deleteFailed)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !isDeleting && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.deleteTitle(goal.name)}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.deleteWarning(
              formatMoney(goal.currentAmount, goal.currency),
              formatMoney(goal.targetAmount, goal.currency),
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{messages.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting}
            onClick={(event) => {
              event.preventDefault()
              void handleDelete()
            }}
          >
            {isDeleting ? t.deleting : t.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
