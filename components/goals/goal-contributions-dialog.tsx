"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  addContribution,
  CONTRIBUTION_NOTE_MAX_LENGTH,
  listContributions,
  removeContribution,
  toastApiError,
  type GoalContributionDto,
  type GoalDto,
} from "@/lib/api"

function todayLocal(): string {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60 * 1000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10)
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatAmount(amount: number, currency: string): string {
  return `$${amount.toLocaleString("es-AR")} ${currency}`
}

export function GoalContributionsDialog({
  goal,
  open,
  onOpenChange,
  onGoalChange,
}: {
  goal: GoalDto
  open: boolean
  onOpenChange: (open: boolean) => void
  onGoalChange: (goal: GoalDto) => void
}) {
  const [contributions, setContributions] = useState<GoalContributionDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<GoalContributionDto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    const controller = new AbortController()
    setIsLoading(true)

    listContributions(goal.id, controller.signal)
      .then(setContributions)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        toastApiError(error, "No se pudo cargar el historial de aportes.")
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [goal.id, open])

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return

    setIsDeleting(true)
    try {
      const updatedGoal = await removeContribution(goal.id, pendingDelete.id)
      setContributions((current) => current.filter((contribution) => contribution.id !== pendingDelete.id))
      onGoalChange(updatedGoal)
      toast.success("Aporte eliminado")
      setPendingDelete(null)
    } catch (error) {
      toastApiError(error, "No se pudo eliminar el aporte.")
    } finally {
      setIsDeleting(false)
    }
  }

  const canContribute = goal.status === "Active"
  const canDelete = goal.status !== "Cancelled"

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{goal.name}</DialogTitle>
            <DialogDescription>
              {formatAmount(goal.currentAmount, goal.currency)} ahorrados de{" "}
              {formatAmount(goal.targetAmount, goal.currency)}
            </DialogDescription>
          </DialogHeader>

          <Progress value={goal.progressPercentage} className="h-2" />

          {canContribute ? (
            <AddContributionForm
              goal={goal}
              onAdded={(contribution, updatedGoal) => {
                setContributions((current) =>
                  [contribution, ...current].sort(
                    (a, b) => b.contributedOn.localeCompare(a.contributedOn) || b.createdAt.localeCompare(a.createdAt),
                  ),
                )
                onGoalChange(updatedGoal)
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {goal.status === "Achieved"
                ? "¡Meta alcanzada! Ya no se pueden registrar más aportes."
                : "Esta meta está cancelada."}
            </p>
          )}

          <Separator />

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Historial de aportes</h3>
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {isLoading ? (
                <>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : contributions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">Todavía no registraste aportes en esta meta.</p>
              ) : (
                contributions.map((contribution) => (
                  <div
                    key={contribution.id}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-success">
                        +{formatAmount(contribution.amount, contribution.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {formatDate(contribution.contributedOn)}
                        {contribution.note ? ` · ${contribution.note}` : ""}
                      </p>
                    </div>
                    {canDelete && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar aporte"
                        onClick={() => setPendingDelete(contribution)}
                      >
                        <Trash2Icon className="size-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(isOpen) => !isOpen && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este aporte?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete &&
                `Se va a quitar el aporte de ${formatAmount(pendingDelete.amount, pendingDelete.currency)} del ${formatDate(pendingDelete.contributedOn)} y el acumulado de la meta se va a recalcular.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                // Se cierra solo cuando el backend confirma, no apenas se hace clic.
                e.preventDefault()
                void handleConfirmDelete()
              }}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function AddContributionForm({
  goal,
  onAdded,
}: {
  goal: GoalDto
  onAdded: (contribution: GoalContributionDto, goal: GoalDto) => void
}) {
  const [amount, setAmount] = useState("")
  const [contributedOn, setContributedOn] = useState(todayLocal)
  const [note, setNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    try {
      const result = await addContribution(goal.id, {
        amount: parseFloat(amount),
        currency: goal.currency,
        contributedOn,
        note: note.trim() || undefined,
      })
      onAdded(result.contribution, result.goal)
      toast.success(
        result.goal.status === "Achieved" ? `¡Alcanzaste la meta "${result.goal.name}"!` : "Aporte registrado",
      )
      setAmount("")
      setNote("")
    } catch (error) {
      toastApiError(error, "No se pudo registrar el aporte.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label htmlFor="contribution-amount">Monto ({goal.currency})</Label>
          <Input
            id="contribution-amount"
            type="number"
            placeholder="0.00"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contribution-date">Fecha</Label>
          <Input
            id="contribution-date"
            type="date"
            max={todayLocal()}
            value={contributedOn}
            onChange={(e) => setContributedOn(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contribution-note">Nota (opcional)</Label>
        <Textarea
          id="contribution-note"
          placeholder="ej., Parte del aguinaldo"
          maxLength={CONTRIBUTION_NOTE_MAX_LENGTH}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Registrar aporte"}
        </Button>
      </div>
    </form>
  )
}
