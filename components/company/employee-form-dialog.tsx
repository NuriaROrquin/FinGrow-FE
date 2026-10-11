"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Mail, Phone, User } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  createEmployee,
  EMPLOYEE_EMAIL_MAX_LENGTH,
  FULL_NAME_MAX_LENGTH,
  FULL_NAME_MIN_LENGTH,
  isApiError,
  PHONE_NUMBER_MAX_DIGITS,
  PHONE_NUMBER_MAX_LENGTH,
  PHONE_NUMBER_MIN_DIGITS,
  toastApiError,
  updateEmployee,
  type CompanyEmployeeDto,
  type CreatedEmployeeDto,
  type DepartmentDto,
  type EmployeeDetailsPayload,
} from "@/lib/api"

const NO_DEPARTMENT = "none"

interface Draft {
  fullName: string
  email: string
  phoneNumber: string
  departmentId: string
}

type FieldErrors = Partial<Record<"fullName" | "email" | "phoneNumber", string>>

function toDraft(employee?: CompanyEmployeeDto): Draft {
  return {
    fullName: employee?.fullName ?? "",
    email: employee?.email ?? "",
    phoneNumber: employee?.phoneNumber ?? "",
    departmentId: employee?.departmentId ?? NO_DEPARTMENT,
  }
}

function toPayload(draft: Draft): EmployeeDetailsPayload {
  return {
    fullName: draft.fullName.trim(),
    email: draft.email.trim(),
    phoneNumber: draft.phoneNumber.trim() || null,
  }
}

function validate(payload: EmployeeDetailsPayload): FieldErrors {
  const errors: FieldErrors = {}

  if (payload.fullName.length < FULL_NAME_MIN_LENGTH) {
    errors.fullName = payload.fullName
      ? `El nombre tiene que tener al menos ${FULL_NAME_MIN_LENGTH} caracteres.`
      : "El nombre es obligatorio."
  }

  if (!payload.email) {
    errors.email = "El email es obligatorio."
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.email = "El email no es una dirección válida."
  }

  if (payload.phoneNumber !== null) {
    const digits = payload.phoneNumber.replace(/\D/g, "").length
    if (!/^[\d\s+\-()]+$/.test(payload.phoneNumber) || digits < PHONE_NUMBER_MIN_DIGITS || digits > PHONE_NUMBER_MAX_DIGITS) {
      errors.phoneNumber = `El teléfono solo admite números, espacios, +, - y paréntesis, con entre ${PHONE_NUMBER_MIN_DIGITS} y ${PHONE_NUMBER_MAX_DIGITS} dígitos.`
    }
  }

  return errors
}

export function EmployeeFormDialog({
  employee,
  departments,
  open,
  onOpenChange,
  onCreated,
  onUpdated,
}: {
  employee?: CompanyEmployeeDto
  departments: DepartmentDto[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (created: CreatedEmployeeDto) => void
  onUpdated: (employee: CompanyEmployeeDto) => void
}) {
  const isEditing = employee !== undefined
  const [draft, setDraft] = useState<Draft>(() => toDraft(employee))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [isSaving, setIsSaving] = useState(false)
  const activeDepartments = departments.filter((department) => department.isActive)

  useEffect(() => {
    if (open) {
      setDraft(toDraft(employee))
      setErrors({})
    }
  }, [open, employee])

  const update = (field: keyof Draft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const payload = toPayload(draft)
    const fieldErrors = validate(payload)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    setIsSaving(true)
    try {
      if (isEditing) {
        const saved = await updateEmployee(employee.id, payload)
        onUpdated(saved)
        toast.success(`Datos de ${saved.fullName} actualizados`)
      } else {
        const departmentId = draft.departmentId === NO_DEPARTMENT ? null : draft.departmentId
        onCreated(await createEmployee({ ...payload, departmentId }))
      }
      onOpenChange(false)
    } catch (error) {
      if (isApiError(error) && error.code === "Employee.EmailTaken") {
        setErrors({ email: error.description })
        return
      }

      toastApiError(error, isEditing ? "No se pudo actualizar el empleado." : "No se pudo dar de alta el empleado.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar empleado" : "Agregar empleado"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Corregí los datos de contacto. El email es con el que inicia sesión."
                : "Al confirmar se crea su usuario con una contraseña temporal para que pueda ingresar."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="employee-full-name">Nombre completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="employee-full-name"
                  placeholder="Juan Pérez"
                  maxLength={FULL_NAME_MAX_LENGTH}
                  value={draft.fullName}
                  onChange={(event) => update("fullName", event.target.value)}
                  aria-invalid={errors.fullName !== undefined}
                  className="pl-10"
                  autoFocus
                />
              </div>
              {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee-email">Email corporativo</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="employee-email"
                  type="email"
                  placeholder="juan.perez@empresa.com"
                  maxLength={EMPLOYEE_EMAIL_MAX_LENGTH}
                  value={draft.email}
                  onChange={(event) => update("email", event.target.value)}
                  aria-invalid={errors.email !== undefined}
                  className="pl-10"
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee-phone">Teléfono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="employee-phone"
                  placeholder="+54 9 11 1234-5678"
                  maxLength={PHONE_NUMBER_MAX_LENGTH}
                  value={draft.phoneNumber}
                  onChange={(event) => update("phoneNumber", event.target.value)}
                  aria-invalid={errors.phoneNumber !== undefined}
                  className="pl-10"
                />
              </div>
              {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber}</p>}
            </div>

            {!isEditing && (
              <div className="space-y-2">
                <Label htmlFor="employee-department">Departamento</Label>
                <Select value={draft.departmentId} onValueChange={(value) => update("departmentId", value)}>
                  <SelectTrigger id="employee-department" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_DEPARTMENT}>Sin departamento</SelectItem>
                    {activeDepartments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Guardando..." : isEditing ? "Guardar cambios" : "Agregar empleado"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
