"use client"

import { useState, type ReactNode } from "react"
import { BarChart3, PiggyBank, Plug, Receipt, TrendingUp, UserX } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { changeEmployeeAccess, deleteEmployee, toastApiError, type CompanyEmployeeDto } from "@/lib/api"
import { useMessages } from "@/lib/i18n"

function LostItem({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 text-destructive">{icon}</span>
      <span>{children}</span>
    </li>
  )
}

export function DeleteEmployeeDialog({
  employee,
  open,
  onOpenChange,
  onDeleted,
  onDeactivated,
}: {
  employee: CompanyEmployeeDto
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: (employeeId: string) => void
  onDeactivated: (employee: CompanyEmployeeDto) => void
}) {
  const messages = useMessages()
  const t = messages.employees
  const [confirmed, setConfirmed] = useState(false)
  const [pending, setPending] = useState<"delete" | "deactivate" | null>(null)
  const firstName = employee.fullName.split(" ")[0]
  const isBusy = pending !== null

  const handleDelete = async () => {
    setPending("delete")
    try {
      await deleteEmployee(employee.id)
      onDeleted(employee.id)
      toast.success(t.deleted(employee.fullName))
      onOpenChange(false)
    } catch (error) {
      toastApiError(error, t.deleteFailed)
    } finally {
      setPending(null)
    }
  }

  const handleDeactivate = async () => {
    setPending("deactivate")
    try {
      onDeactivated(await changeEmployeeAccess(employee.id, false))
      toast.success(t.deactivatedKeepsData(employee.fullName))
      onOpenChange(false)
    } catch (error) {
      toastApiError(error, t.deactivateFailed)
    } finally {
      setPending(null)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !isBusy && onOpenChange(next)}>
      <AlertDialogContent className="sm:max-w-[520px]">
        <AlertDialogHeader>
          <AlertDialogTitle>{t.deleteTitle(employee.fullName)}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.deleteWarning(firstName)}
            <strong className="text-foreground">{t.cannotRecover}</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
            <p className="mb-2 font-medium text-foreground">{t.deletedForever}</p>
            <ul className="space-y-1.5 text-muted-foreground">
              <LostItem icon={<Receipt className="h-4 w-4" />}>{t.lostTransactions}</LostItem>
              <LostItem icon={<PiggyBank className="h-4 w-4" />}>{t.lostBudgets}</LostItem>
              <LostItem icon={<TrendingUp className="h-4 w-4" />}>{t.lostInvestments}</LostItem>
              <LostItem icon={<Plug className="h-4 w-4" />}>{t.lostIntegrations}</LostItem>
            </ul>
          </div>

          <p className="flex items-start gap-2 px-1 text-muted-foreground">
            <BarChart3 className="mt-0.5 h-4 w-4 shrink-0" />
            {t.metricsUnchanged}
          </p>

          {employee.isActive ? (
            <div className="flex flex-col gap-3 rounded-md border bg-muted/50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-foreground">{t.onlyBlock}</p>
                <p className="text-muted-foreground">{t.onlyBlockHint}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-2"
                disabled={isBusy}
                onClick={() => void handleDeactivate()}
              >
                <UserX className="h-4 w-4" />
                {pending === "deactivate" ? t.deactivating : t.deactivateAccess}
              </Button>
            </div>
          ) : (
            <p className="rounded-md border bg-muted/50 p-3 text-muted-foreground">
              {t.alreadyInactive}
            </p>
          )}

          <div className="flex items-start gap-2 pt-1">
            <Checkbox
              id="confirm-employee-deletion"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
              disabled={isBusy}
              className="mt-0.5"
            />
            <Label htmlFor="confirm-employee-deletion" className="font-normal leading-snug">
              {t.confirmDeletion(firstName)}
            </Label>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isBusy}>{messages.common.cancel}</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={!confirmed || isBusy}
            onClick={() => void handleDelete()}
          >
            {pending === "delete" ? t.deleting : t.deleteAccount}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
