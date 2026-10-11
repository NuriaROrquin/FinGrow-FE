"use client"

import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import { addDays, format, subYears } from "date-fns"
import { UserIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
  ADDRESS_MAX_LENGTH,
  FULL_NAME_MAX_LENGTH,
  FULL_NAME_MIN_LENGTH,
  getProfile,
  NATIONAL_ID_MAX_LENGTH,
  NATIONAL_ID_MIN_LENGTH,
  PHONE_NUMBER_MAX_DIGITS,
  PHONE_NUMBER_MAX_LENGTH,
  PHONE_NUMBER_MIN_DIGITS,
  PROFILE_MAX_AGE,
  PROFILE_MIN_AGE,
  toastApiError,
  updateProfile,
  type EmployeeProfile,
  type UpdateProfilePayload,
} from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useMessages, type Messages } from "@/lib/i18n"

type Draft = Record<keyof UpdateProfilePayload, string>

type FieldErrors = Partial<Record<keyof UpdateProfilePayload, string>>

const ISO_DATE = "yyyy-MM-dd"

function toDraft(profile: EmployeeProfile): Draft {
  return {
    fullName: profile.fullName,
    phoneNumber: profile.phoneNumber ?? "",
    nationalId: profile.nationalId ?? "",
    birthDate: profile.birthDate ?? "",
    address: profile.address ?? "",
  }
}

// El DNI se acepta con puntos o espacios porque así lo escribe la gente; viaja solo con números.
function toPayload(draft: Draft): UpdateProfilePayload {
  const optional = (value: string) => value.trim() || null

  return {
    fullName: draft.fullName.trim(),
    phoneNumber: optional(draft.phoneNumber),
    nationalId: optional(draft.nationalId.replace(/[.\s]/g, "")),
    birthDate: optional(draft.birthDate),
    address: optional(draft.address),
  }
}

// Las mismas reglas que valida FinGrow-BE: acá solo se adelantan para avisar antes de enviar.
function validate(payload: UpdateProfilePayload, birthDateRange: { min: string; max: string }, t: Messages): FieldErrors {
  const messages = t.settings.profile.errors
  const errors: FieldErrors = {}

  if (!payload.fullName) {
    errors.fullName = messages.fullNameRequired
  } else if (payload.fullName.length < FULL_NAME_MIN_LENGTH) {
    errors.fullName = messages.fullNameTooShort(FULL_NAME_MIN_LENGTH)
  }

  if (payload.phoneNumber !== null) {
    const digits = payload.phoneNumber.replace(/\D/g, "").length
    const validCharacters = /^[\d\s+\-()]+$/.test(payload.phoneNumber)

    if (!validCharacters || digits < PHONE_NUMBER_MIN_DIGITS || digits > PHONE_NUMBER_MAX_DIGITS) {
      errors.phoneNumber = messages.phoneInvalid(PHONE_NUMBER_MIN_DIGITS, PHONE_NUMBER_MAX_DIGITS)
    }
  }

  if (payload.nationalId !== null) {
    const length = payload.nationalId.length

    if (!/^\d+$/.test(payload.nationalId) || length < NATIONAL_ID_MIN_LENGTH || length > NATIONAL_ID_MAX_LENGTH) {
      errors.nationalId = messages.nationalIdInvalid(NATIONAL_ID_MIN_LENGTH, NATIONAL_ID_MAX_LENGTH)
    }
  }

  // Las fechas `yyyy-MM-dd` se pueden comparar como texto.
  if (payload.birthDate !== null && (payload.birthDate < birthDateRange.min || payload.birthDate > birthDateRange.max)) {
    errors.birthDate = messages.birthDateInvalid(PROFILE_MIN_AGE, PROFILE_MAX_AGE)
  }

  return errors
}

function birthDateRangeFor(today: Date) {
  return {
    min: format(addDays(subYears(today, PROFILE_MAX_AGE + 1), 1), ISO_DATE),
    max: format(subYears(today, PROFILE_MIN_AGE), ISO_DATE),
  }
}

export function ProfileCard() {
  const { refreshUser } = useAuth()
  const t = useMessages()
  const texts = t.settings.profile
  const [profile, setProfile] = useState<EmployeeProfile | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [birthDateRange] = useState(() => birthDateRangeFor(new Date()))

  useEffect(() => {
    const controller = new AbortController()

    getProfile(controller.signal)
      .then((data) => {
        setProfile(data)
        setDraft(toDraft(data))
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        toastApiError(error, texts.loadFailed)
        setLoadFailed(true)
      })

    return () => controller.abort()
    // Solo se carga al montar: el idioma puede cambiar después sin volver a pedir el perfil.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasChanges =
    profile !== null &&
    draft !== null &&
    JSON.stringify(toPayload(draft)) !== JSON.stringify(toPayload(toDraft(profile)))

  const update = (field: keyof Draft, value: string) => {
    setDraft((current) => (current ? { ...current, [field]: value } : current))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const resetForm = () => {
    if (!profile) return
    setDraft(toDraft(profile))
    setErrors({})
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile || !draft || !hasChanges) return

    const payload = toPayload(draft)
    const validationErrors = validate(payload, birthDateRange, t)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setSaving(true)

    try {
      await updateProfile(payload)
      const saved = { ...profile, ...payload }
      setProfile(saved)
      setDraft(toDraft(saved))
      toast.success(texts.saved)

      if (payload.fullName !== profile.fullName) {
        // Los datos ya están guardados: si la renovación falla, el encabezado toma el nombre
        // nuevo en la próxima renovación de la sesión.
        await refreshUser().catch(() => undefined)
      }
    } catch (error) {
      toastApiError(error, texts.saveFailed, { showCode: false })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <UserIcon className="size-5" />
          <div>
            <CardTitle>{texts.title}</CardTitle>
            <CardDescription>{texts.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {profile === null || draft === null ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {loadFailed ? (
              texts.loadFailed
            ) : (
              <>
                <Spinner /> {texts.loading}
              </>
            )}
          </div>
        ) : (
          <form onSubmit={save} noValidate className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="profile-full-name" label={texts.fullName} error={errors.fullName}>
                <Input
                  id="profile-full-name"
                  value={draft.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  maxLength={FULL_NAME_MAX_LENGTH}
                  autoComplete="name"
                  aria-invalid={Boolean(errors.fullName)}
                />
              </Field>
              <Field id="profile-phone" label={texts.phone} error={errors.phoneNumber}>
                <Input
                  id="profile-phone"
                  type="tel"
                  placeholder="+54 11 1234-5678"
                  value={draft.phoneNumber}
                  onChange={(e) => update("phoneNumber", e.target.value)}
                  maxLength={PHONE_NUMBER_MAX_LENGTH}
                  autoComplete="tel"
                  aria-invalid={Boolean(errors.phoneNumber)}
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field id="profile-national-id" label={texts.nationalId} error={errors.nationalId}>
                <Input
                  id="profile-national-id"
                  inputMode="numeric"
                  placeholder="12345678"
                  value={draft.nationalId}
                  onChange={(e) => update("nationalId", e.target.value)}
                  // Deja lugar para los puntos de un DNI escrito como 12.345.678.
                  maxLength={NATIONAL_ID_MAX_LENGTH + 2}
                  aria-invalid={Boolean(errors.nationalId)}
                />
              </Field>
              <Field id="profile-birth-date" label={texts.birthDate} error={errors.birthDate}>
                <Input
                  id="profile-birth-date"
                  type="date"
                  value={draft.birthDate}
                  onChange={(e) => update("birthDate", e.target.value)}
                  min={birthDateRange.min}
                  max={birthDateRange.max}
                  autoComplete="bday"
                  aria-invalid={Boolean(errors.birthDate)}
                />
              </Field>
            </div>

            <Field id="profile-address" label={texts.address}>
              <Input
                id="profile-address"
                placeholder="Av. Corrientes 1234, CABA"
                value={draft.address}
                onChange={(e) => update("address", e.target.value)}
                maxLength={ADDRESS_MAX_LENGTH}
                autoComplete="street-address"
              />
            </Field>

            <Separator />

            <Field id="profile-email" label={texts.email}>
              <Input id="profile-email" type="email" value={profile.email} disabled />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field id="profile-department" label={texts.department}>
                <Input id="profile-department" value={profile.departmentName ?? texts.noDepartment} disabled />
              </Field>
              <Field id="profile-company" label={texts.company}>
                <Input id="profile-company" value={profile.companyName} disabled />
              </Field>
            </div>

            <p className="text-sm text-muted-foreground">{texts.managedByCompany}</p>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={resetForm} disabled={saving || !hasChanges}>
                {t.common.cancel}
              </Button>
              <Button type="submit" disabled={saving || !hasChanges}>
                {saving && <Spinner className="mr-2" />}
                {t.common.saveChanges}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
