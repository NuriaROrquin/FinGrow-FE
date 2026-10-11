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
import { plural } from "@/lib/utils"

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
          ? `Se desactivó "${department.name}"`
          : target
            ? `Se desactivó "${department.name}" y ${plural(employees, "su empleado pasó", `sus ${employees} empleados pasaron`)} a "${target.name}"`
            : `Se desactivó "${department.name}" y ${plural(employees, "su empleado quedó", `sus ${employees} empleados quedaron`)} sin departamento`,
      )
      onDeactivated()
      onOpenChange(false)
    } catch (error) {
      toastApiError(error, "No se pudo desactivar el departamento.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Desactivar el departamento &quot;{department.name}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            Deja de aparecer al dar de alta o mover empleados. Sus métricas de meses anteriores se conservan y podés
            reactivarlo cuando quieras.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hasEmployees && (
          <div className="space-y-2 rounded-md border bg-muted/50 p-3 text-sm">
            <Label htmlFor="deactivate-department-destination" className="font-medium">
              Tiene {employees} {plural(employees, "empleado", "empleados")}. ¿A dónde {plural(employees, "lo", "los")} movés?
            </Label>
            <Select value={destination} onValueChange={setDestination} disabled={isSaving}>
              <SelectTrigger id="deactivate-department-destination" className="w-full bg-background">
                <SelectValue placeholder="Elegí un departamento" />
              </SelectTrigger>
              <SelectContent>
                {destinations.map((candidate) => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    {candidate.name}
                  </SelectItem>
                ))}
                <SelectItem value={WITHOUT_DEPARTMENT}>Dejarlos sin departamento</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              El cambio queda en su historial: las métricas de meses anteriores siguen contándolos acá.
            </p>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
          <Button type="button" disabled={isSaving || (hasEmployees && !destination)} onClick={() => void handleDeactivate()}>
            {isSaving ? "Desactivando..." : "Desactivar departamento"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
