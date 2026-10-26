"use client"

import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import { BuildingIcon } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  COMPANY_INDUSTRIES,
  getCompanyProfile,
  isApiError,
  isValidCuit,
  toastApiError,
  updateCompanyProfile,
  type CompanyIndustry,
  type CompanyProfileDto,
  type UpdateCompanyProfilePayload,
} from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useMessages, type Messages } from "@/lib/i18n"

interface Draft {
  legalName: string
  taxId: string
  industry: string
  email: string
  corporatePhone: string
  fiscalAddress: string
  foundedYear: string
}

type FieldErrors = Partial<Record<keyof Draft, string>>

function toDraft(profile: CompanyProfileDto): Draft {
  return {
    legalName: profile.legalName ?? "",
    taxId: profile.taxId ?? "",
    industry: profile.industry ?? "",
    email: profile.email ?? "",
    corporatePhone: profile.corporatePhone ?? "",
    fiscalAddress: profile.fiscalAddress ?? "",
    foundedYear:
      profile.foundedYear !== null && profile.foundedYear !== undefined ? String(profile.foundedYear) : "",
  }
}

function toPayload(draft: Draft): UpdateCompanyProfilePayload {
  const optional = (value: string) => value.trim() || null

  return {
    legalName: draft.legalName.trim(),
    taxId: draft.taxId.replace(/[-\s]/g, "").trim(),
    email: draft.email.trim(),
    industry: draft.industry.trim(),
    corporatePhone: optional(draft.corporatePhone),
    fiscalAddress: optional(draft.fiscalAddress),
    foundedYear: draft.foundedYear.trim() ? Number(draft.foundedYear.trim()) : null,
  }
}

function validate(draft: Draft, t: Messages): FieldErrors {
  const messages = t.settings.companyProfile.errors
  const errors: FieldErrors = {}

  if (!draft.legalName.trim()) {
    errors.legalName = messages.legalNameRequired
  }

  const cleanedCuit = draft.taxId.trim()
  if (!cleanedCuit) {
    errors.taxId = messages.taxIdRequired
  } else if (!isValidCuit(cleanedCuit)) {
    errors.taxId = messages.taxIdInvalid
  }

  const trimmedEmail = draft.email.trim()
  if (!trimmedEmail) {
    errors.email = messages.emailRequired
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = messages.emailInvalid
  }

  if (!draft.industry || !COMPANY_INDUSTRIES.includes(draft.industry as CompanyIndustry)) {
    errors.industry = messages.industryRequired
  }

  const trimmedYear = draft.foundedYear.trim()
  if (trimmedYear !== "") {
    const year = Number(trimmedYear)
    if (!Number.isInteger(year) || year < 1800 || year > 9999) {
      errors.foundedYear = messages.foundedYearInvalid
    }
  }

  return errors
}

export function CompanyProfileCard() {
  const { role, refreshUser } = useAuth()
  const t = useMessages()
  const texts = t.settings.companyProfile

  const [profile, setProfile] = useState<CompanyProfileDto | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [errors, setErrors] = useState<FieldErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setLoadError(null)

    getCompanyProfile(controller.signal)
      .then((data) => {
        setProfile(data)
        setDraft(toDraft(data))
        setIsLoading(false)
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        setIsLoading(false)

        if (isApiError(error)) {
          if (error.status === 403) {
            setLoadError(texts.forbidden)
            toast.error(texts.forbidden)
            return
          }
          if (error.status === 404) {
            setLoadError(texts.notFound)
            toast.error(texts.notFound)
            return
          }
        }

        setLoadError(texts.loadFailed)
        toastApiError(error, texts.loadFailed)
      })

    return () => controller.abort()
  }, [reloadKey, texts.forbidden, texts.loadFailed, texts.notFound])

  const hasChanges =
    profile !== null &&
    draft !== null &&
    JSON.stringify(toPayload(draft)) !== JSON.stringify(toPayload(toDraft(profile)))

  const hasRequiredFields =
    draft !== null &&
    draft.legalName.trim() !== "" &&
    draft.taxId.trim() !== "" &&
    draft.email.trim() !== "" &&
    COMPANY_INDUSTRIES.includes(draft.industry as CompanyIndustry)

  const canSave = hasChanges && hasRequiredFields

  const update = (field: keyof Draft, value: string) => {
    setDraft((current) => (current ? { ...current, [field]: value } : current))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setGeneralError(null)
  }

  const resetForm = () => {
    if (!profile) return
    setDraft(toDraft(profile))
    setErrors({})
    setGeneralError(null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!profile || !draft || !hasChanges) return

    setGeneralError(null)

    const validationErrors = validate(draft, t)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const payload = toPayload(draft)
    setIsSaving(true)

    try {
      const updatedProfile = await updateCompanyProfile(payload)
      setProfile(updatedProfile)
      setDraft(toDraft(updatedProfile))
      setErrors({})
      setGeneralError(null)
      toast.success(texts.saved)

      if (payload.legalName !== profile.legalName) {
        await refreshUser().catch(() => undefined)
      }
    } catch (error) {
      if (isApiError(error)) {
        if (error.status === 400) {
          const nextErrors: FieldErrors = {}
          let matchedField = false

          if (error.fieldErrors) {
            for (const [rawField, messages] of Object.entries(error.fieldErrors)) {
              const msg = messages.join(" ")
              const field = rawField.toLowerCase()
              if (field === "legalname" || field === "razonsocial") {
                nextErrors.legalName = msg
                matchedField = true
              } else if (field === "taxid" || field === "cuit") {
                nextErrors.taxId = msg
                matchedField = true
              } else if (field === "email" || field === "mail") {
                nextErrors.email = msg
                matchedField = true
              } else if (field === "industry" || field === "industria") {
                nextErrors.industry = msg
                matchedField = true
              } else if (field === "corporatephone" || field === "phone" || field === "telefono") {
                nextErrors.corporatePhone = msg
                matchedField = true
              } else if (field === "fiscaladdress" || field === "address" || field === "direccion") {
                nextErrors.fiscalAddress = msg
                matchedField = true
              } else if (field === "foundedyear" || field === "year" || field === "anofundacion") {
                nextErrors.foundedYear = msg
                matchedField = true
              }
            }
          }

          const descLower = (error.description || "").toLowerCase()
          if (!matchedField) {
            if (descLower.includes("cuit") || descLower.includes("taxid")) {
              nextErrors.taxId = error.description
            } else if (descLower.includes("email") || descLower.includes("correo")) {
              nextErrors.email = error.description
            } else if (
              descLower.includes("razón social") ||
              descLower.includes("razon social") ||
              descLower.includes("legalname")
            ) {
              nextErrors.legalName = error.description
            } else if (descLower.includes("industria") || descLower.includes("industry")) {
              nextErrors.industry = error.description
            } else if (descLower.includes("año") || descLower.includes("fundación") || descLower.includes("fundacion")) {
              nextErrors.foundedYear = error.description
            }
          }

          setErrors(nextErrors)
          setGeneralError(error.description || texts.saveFailed)
          toast.error(error.description || texts.saveFailed)
          return
        }

        if (error.status === 403) {
          setGeneralError(texts.forbidden)
          toast.error(texts.forbidden)
          return
        }

        if (error.status === 404) {
          setGeneralError(texts.notFound)
          toast.error(texts.notFound)
          return
        }

        if (error.status === 409) {
          const descLower = (error.description || "").toLowerCase()
          const nextErrors: FieldErrors = {}
          if (descLower.includes("cuit") || descLower.includes("taxid")) {
            nextErrors.taxId = error.description
          }
          if (descLower.includes("email") || descLower.includes("correo")) {
            nextErrors.email = error.description
          }
          setErrors((prev) => ({ ...prev, ...nextErrors }))
          const msg = error.description || texts.conflict
          setGeneralError(msg)
          toast.error(msg)
          return
        }

        if (error.status >= 500) {
          setGeneralError(texts.genericError)
          toast.error(texts.genericError)
          return
        }
      }

      toastApiError(error, texts.saveFailed, { showCode: false })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <BuildingIcon className="size-5" />
          <div>
            <CardTitle>{texts.title}</CardTitle>
            <CardDescription>{texts.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {role !== "empresa" && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{texts.forbidden}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="space-y-4" aria-busy="true" aria-label={texts.loading}>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-10 w-full" />
            </div>

            <Skeleton className="h-px w-full" />

            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        ) : loadError ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
                {texts.retry}
              </Button>
            </div>
          </div>
        ) : profile === null || draft === null ? null : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {generalError && (
              <Alert variant="destructive">
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}

            <Field id="company-legal-name" label={texts.legalName} error={errors.legalName}>
              <Input
                id="company-legal-name"
                value={draft.legalName}
                onChange={(e) => update("legalName", e.target.value)}
                aria-invalid={Boolean(errors.legalName)}
                placeholder="Empresa Demo S.A."
                required
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field id="company-tax-id" label={texts.taxId} error={errors.taxId}>
                <Input
                  id="company-tax-id"
                  placeholder="20123456786"
                  value={draft.taxId}
                  onChange={(e) => update("taxId", e.target.value)}
                  aria-invalid={Boolean(errors.taxId)}
                  maxLength={13}
                  required
                />
              </Field>

              <Field id="company-industry" label={texts.industry} error={errors.industry}>
                <Select value={draft.industry} onValueChange={(value) => update("industry", value)}>
                  <SelectTrigger id="company-industry" aria-invalid={Boolean(errors.industry)} className="w-full">
                    <SelectValue placeholder={texts.selectIndustryPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_INDUSTRIES.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {t.labels.companyIndustries[industry]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field id="company-email" label={texts.email} error={errors.email}>
              <Input
                id="company-email"
                type="email"
                placeholder="contacto@empresa.com"
                value={draft.email}
                onChange={(e) => update("email", e.target.value)}
                aria-invalid={Boolean(errors.email)}
                required
              />
            </Field>

            <Field id="company-phone" label={texts.phone} error={errors.corporatePhone}>
              <Input
                id="company-phone"
                type="tel"
                placeholder="+54 11 1234-5678"
                value={draft.corporatePhone}
                onChange={(e) => update("corporatePhone", e.target.value)}
                aria-invalid={Boolean(errors.corporatePhone)}
              />
            </Field>

            <Separator />

            <Field id="company-address" label={texts.address} error={errors.fiscalAddress}>
              <Input
                id="company-address"
                placeholder="Av. Corrientes 1234, CABA"
                value={draft.fiscalAddress}
                onChange={(e) => update("fiscalAddress", e.target.value)}
                aria-invalid={Boolean(errors.fiscalAddress)}
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company-employee-count">{texts.employeeCount}</Label>
                <Input
                  id="company-employee-count"
                  type="number"
                  value={profile.employeeCount}
                  disabled
                  readOnly
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">{texts.employeeCountHint}</p>
              </div>

              <Field id="company-founded-year" label={texts.foundedYear} error={errors.foundedYear}>
                <Input
                  id="company-founded-year"
                  type="number"
                  min={1800}
                  max={9999}
                  placeholder="2010"
                  value={draft.foundedYear}
                  onChange={(e) => update("foundedYear", e.target.value)}
                  aria-invalid={Boolean(errors.foundedYear)}
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={resetForm} disabled={isSaving || !hasChanges}>
                {t.common.cancel}
              </Button>
              <Button type="submit" disabled={isSaving || !canSave}>
                {isSaving && <Spinner className="mr-2" />}
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
