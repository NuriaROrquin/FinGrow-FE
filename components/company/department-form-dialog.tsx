"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Building2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ManagerPicker } from "@/components/company/manager-picker"
import {
  createDepartment,
  DEPARTMENT_DESCRIPTION_MAX_LENGTH,
  DEPARTMENT_NAME_MAX_LENGTH,
  isApiError,
  toastApiError,
  updateDepartment,
  type CompanyEmployeeDto,
  type DepartmentDto,
} from "@/lib/api"

interface Draft {
  name: string
  description: string
  managerId: string | null
}

const emptyDraft: Draft = { name: "", description: "", managerId: null }

function toDraft(department?: DepartmentDto): Draft {
  if (!department) {
    return emptyDraft
  }

  return {
    name: department.name,
    description: department.description ?? "",
    managerId: department.manager?.id ?? null,
  }
}

export function DepartmentFormDialog({
  department,
  employees,
  open,
  onOpenChange,
  onSaved,
}: {
  department?: DepartmentDto
  employees: CompanyEmployeeDto[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (department: DepartmentDto) => void
}) {
  const isEditing = department !== undefined
  const [draft, setDraft] = useState<Draft>(() => toDraft(department))
  const [nameError, setNameError] = useState<string | null>(null)
  const [managerError, setManagerError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setDraft(toDraft(department))
      setNameError(null)
      setManagerError(null)
    }
  }, [open, department])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const name = draft.name.trim()
    if (!name) {
      setNameError("El nombre del departamento es obligatorio.")
      return
    }

    const payload = {
      name,
      description: draft.description.trim() || null,
      managerId: draft.managerId,
    }

    setIsSaving(true)
    try {
      const saved = isEditing ? await updateDepartment(department.id, payload) : await createDepartment(payload)
      onSaved(saved)
      toast.success(isEditing ? `Departamento "${saved.name}" actualizado` : `Departamento "${saved.name}" creado`)
      onOpenChange(false)
    } catch (error) {
      if (isApiError(error) && error.code === "Department.NameTaken") {
        setNameError(error.description)
        return
      }

      if (isApiError(error) && error.code === "Department.ManagerNotAvailable") {
        setManagerError(error.description)
        return
      }

      toastApiError(error, isEditing ? "No se pudo actualizar el departamento." : "No se pudo crear el departamento.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar departamento" : "Agregar departamento"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Modificá los datos del departamento." : "Solo el nombre es obligatorio."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="department-name">Nombre</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="department-name"
                  placeholder="Ventas, Marketing, IT..."
                  maxLength={DEPARTMENT_NAME_MAX_LENGTH}
                  value={draft.name}
                  onChange={(event) => {
                    setDraft({ ...draft, name: event.target.value })
                    setNameError(null)
                  }}
                  aria-invalid={nameError !== null}
                  className="pl-10"
                  autoFocus
                />
              </div>
              {nameError && <p className="text-sm text-destructive">{nameError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department-description">Descripción</Label>
              <Textarea
                id="department-description"
                placeholder="Qué hace el departamento"
                maxLength={DEPARTMENT_DESCRIPTION_MAX_LENGTH}
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department-manager">Responsable</Label>
              <ManagerPicker
                id="department-manager"
                employees={employees}
                currentManager={department?.manager ?? null}
                value={draft.managerId}
                onChange={(managerId) => {
                  setDraft({ ...draft, managerId })
                  setManagerError(null)
                }}
                disabled={isSaving}
              />
              {managerError ? (
                <p className="text-sm text-destructive">{managerError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Un empleado con acceso activo, de cualquier departamento.</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Guardando..." : isEditing ? "Guardar cambios" : "Agregar departamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
