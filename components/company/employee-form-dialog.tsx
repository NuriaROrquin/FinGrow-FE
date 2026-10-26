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
  changeEmployeeDepartment,
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
import { useMessages, type Messages } from "@/lib/i18n"

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

function validate(payload: EmployeeDetailsPayload, t: Messages["employees"]): FieldErrors {
  const errors: FieldErrors = {}

  if (payload.fullName.length < FULL_NAME_MIN_LENGTH) {
    errors.fullName = payload.fullName ? t.nameTooShort(FULL_NAME_MIN_LENGTH) : t.nameRequired
  }

  if (!payload.email) {
    errors.email = t.emailRequired
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.email = t.emailInvalid
  }

  if (payload.phoneNumber !== null) {
    const digits = payload.phoneNumber.replace(/\D/g, "").length
    if (!/^[\d\s+\-()]+$/.test(payload.phoneNumber) || digits < PHONE_NUMBER_MIN_DIGITS || digits > PHONE_NUMBER_MAX_DIGITS) {
      errors.phoneNumber = t.phoneInvalid(PHONE_NUMBER_MIN_DIGITS, PHONE_NUMBER_MAX_DIGITS)
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
  const messages = useMessages()
  const t = messages.employees
  const isEditing = employee !== undefined
  const [draft, setDraft] = useState<Draft>(() => toDraft(employee))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [isSaving, setIsSaving] = useState(false)
  const selectableDepartments = departments.filter(
    (department) => department.isActive || department.id === employee?.departmentId,
  )

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
    const fieldErrors = validate(payload, t)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    const departmentId = draft.departmentId === NO_DEPARTMENT ? null : draft.departmentId

    setIsSaving(true)
    try {
      if (isEditing) {
        let saved = await updateEmployee(employee.id, payload)
        if (departmentId !== employee.departmentId) {
          saved = await changeEmployeeDepartment(employee.id, departmentId)
        }
        onUpdated(saved)
        toast.success(t.updated(saved.fullName))
      } else {
        onCreated(await createEmployee({ ...payload, departmentId }))
      }
      onOpenChange(false)
    } catch (error) {
      if (isApiError(error) && error.code === "Employee.EmailTaken") {
        setErrors({ email: error.description })
        return
      }

      toastApiError(error, isEditing ? t.updateFailed : t.createFailed)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>{isEditing ? t.editTitle : t.addTitle}</DialogTitle>
            <DialogDescription>
              {isEditing ? t.editDescription : t.addDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="employee-full-name">{t.fullName}</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="employee-full-name"
                  placeholder={t.fullNamePlaceholder}
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
              <Label htmlFor="employee-email">{t.email}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="employee-email"
                  type="email"
                  placeholder={t.emailPlaceholder}
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
              <Label htmlFor="employee-phone">{t.phone}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="employee-phone"
                  placeholder={t.phonePlaceholder}
                  maxLength={PHONE_NUMBER_MAX_LENGTH}
                  value={draft.phoneNumber}
                  onChange={(event) => update("phoneNumber", event.target.value)}
                  aria-invalid={errors.phoneNumber !== undefined}
                  className="pl-10"
                />
              </div>
              {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee-department">{t.department}</Label>
              <Select value={draft.departmentId} onValueChange={(value) => update("departmentId", value)}>
                <SelectTrigger id="employee-department" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_DEPARTMENT}>{t.noDepartment}</SelectItem>
                  {selectableDepartments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isEditing && (
                <p className="text-xs text-muted-foreground">
                  {t.departmentHint}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              {messages.common.cancel}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t.saving : isEditing ? t.saveChanges : t.addSubmit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
