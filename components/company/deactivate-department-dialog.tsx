"use client"

import { useState } from "react"
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { changeDepartmentStatus, toastApiError, type DepartmentDto } from "@/lib/api"
import { useMessages } from "@/lib/i18n"

const WITHOUT_DEPARTMENT = "none"

export function DeactivateDepartmentDialog({
  department,
  departments,
  open,
  onOpenChange,
  onDeactivated,
}: {
  department: DepartmentDto
  departments: DepartmentDto[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeactivated: () => void
}) {
  const messages = useMessages()
  const t = messages.departments
  const [destination, setDestination] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const employees = department.employeeCount
  const hasEmployees = employees > 0
  const destinations = departments
    .filter((candidate) => candidate.isActive && candidate.id !== department.id)
    .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }))

  const handleDeactivate = async () => {
    const moveEmployeesTo = destination && destination !== WITHOUT_DEPARTMENT ? destination : null

    setIsSaving(true)
    try {
      await changeDepartmentStatus(department.id, false, moveEmployeesTo)
      const target = destinations.find((candidate) => candidate.id === moveEmployeesTo)
      toast.success(
        !hasEmployees
          ? t.deactivated(department.name)
          : target
            ? t.deactivatedMoved(department.name, employees, target.name)
            : t.deactivatedUnassigned(department.name, employees),
      )
      onDeactivated()
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
          <AlertDialogTitle>{t.deactivateTitle(department.name)}</AlertDialogTitle>
          <AlertDialogDescription>{t.deactivateDescription}</AlertDialogDescription>
        </AlertDialogHeader>

        {hasEmployees && (
          <div className="space-y-2 rounded-md border bg-muted/50 p-3 text-sm">
            <Label htmlFor="deactivate-department-destination" className="font-medium">
              {t.whereToMove(employees)}
            </Label>
            <Select value={destination} onValueChange={setDestination} disabled={isSaving}>
              <SelectTrigger id="deactivate-department-destination" className="w-full bg-background">
                <SelectValue placeholder={t.pickDepartment} />
              </SelectTrigger>
              <SelectContent>
                {destinations.map((candidate) => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    {candidate.name}
                  </SelectItem>
                ))}
                <SelectItem value={WITHOUT_DEPARTMENT}>{t.leaveUnassigned}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t.historyNote}
            </p>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSaving}>{messages.common.cancel}</AlertDialogCancel>
          <Button type="button" disabled={isSaving || (hasEmployees && !destination)} onClick={() => void handleDeactivate()}>
            {isSaving ? t.deactivating : t.deactivate}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
