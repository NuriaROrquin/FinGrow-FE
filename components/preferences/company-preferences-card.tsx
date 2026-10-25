"use client"

import { useEffect, useState, type FormEvent } from "react"
import { BuildingIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { currencyLabels } from "@/components/budgets/budget-month"
import {
  getCompanyPreferences,
  isApiError,
  toastApiError,
  updateCompanyPreferences,
  type CompanyPreferencesDto,
  type CompanyPreferenceLanguage,
  type CompanyPreferenceTheme,
  type UpdateCompanyPreferencesPayload,
} from "@/lib/api"
import type { Currency } from "@/lib/api/transactions"
import { messagesFor, useMessages } from "@/lib/i18n"
import { usePreferences } from "@/lib/preferences-context"

const COMPANY_THEMES: CompanyPreferenceTheme[] = ["System", "Light", "Dark"]
const COMPANY_LANGUAGES: CompanyPreferenceLanguage[] = ["es", "en", "pt"]
const FISCAL_MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const

function toThemePreference(theme: CompanyPreferenceTheme) {
  return theme.toLowerCase() as "system" | "light" | "dark"
}

function isValidPreferences(preferences: CompanyPreferencesDto): preferences is UpdateCompanyPreferencesPayload {
  return (
    preferences.theme !== null &&
    COMPANY_THEMES.includes(preferences.theme) &&
    preferences.language !== null &&
    COMPANY_LANGUAGES.includes(preferences.language) &&
    preferences.currency !== null &&
    Object.keys(currencyLabels).includes(preferences.currency) &&
    Number.isInteger(preferences.fiscalYearStartMonth) &&
    preferences.fiscalYearStartMonth !== null &&
    preferences.fiscalYearStartMonth >= 1 &&
    preferences.fiscalYearStartMonth <= 12
  )
}

export function CompanyPreferencesCard() {
  const t = useMessages()
  const texts = t.preferences.corporate
  const { setTheme } = useTheme()
  const { setApplicationLanguage } = usePreferences()
  const [preferences, setPreferences] = useState<CompanyPreferencesDto | null>(null)
  const [draft, setDraft] = useState<CompanyPreferencesDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setLoadError(null)

    getCompanyPreferences(controller.signal)
      .then((data) => {
        setPreferences(data)
        setDraft(data)
        if (data.theme !== null) {
          setTheme(toThemePreference(data.theme))
        }
        setApplicationLanguage(data.language)
        setIsLoading(false)
      })
      .catch((error) => {
        if (controller.signal.aborted) return

        setIsLoading(false)
        if (isApiError(error) && error.status === 403) {
          setLoadError(texts.forbidden)
          toast.error(texts.forbidden)
          return
        }
        if (isApiError(error) && error.status === 404) {
          setLoadError(texts.notFound)
          toast.error(texts.notFound)
          return
        }

        setLoadError(texts.loadFailed)
        toastApiError(error, texts.loadFailed)
      })

    return () => controller.abort()
    // La tarjeta se recarga solo cuando cambia explícitamente la solicitud; el idioma
    // seleccionado modifica sus textos, pero no debe disparar otro GET.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey, setApplicationLanguage])

  const hasChanges =
    preferences !== null &&
    draft !== null &&
    JSON.stringify(preferences) !== JSON.stringify(draft)

  const update = <K extends keyof CompanyPreferencesDto>(key: K, value: CompanyPreferencesDto[K]) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current))
    setGeneralError(null)
    setFieldError(null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft || !hasChanges || !isValidPreferences(draft)) {
      if (draft && !isValidPreferences(draft)) {
        setFieldError(texts.validation)
      }
      return
    }

    setSaving(true)
    setGeneralError(null)
    setFieldError(null)

    try {
      const updated = await updateCompanyPreferences(draft)
      setPreferences(updated)
      setDraft(updated)
      if (updated.theme !== null) {
        setTheme(toThemePreference(updated.theme))
      }
      setApplicationLanguage(updated.language)
      toast.success(updated.language ? messagesFor(updated.language).preferences.corporate.saved : texts.saved)
    } catch (error) {
      if (isApiError(error)) {
        if (error.status === 400) {
          const fiscalYearError = error.fieldErrors?.fiscalYearStartMonth?.join(" ") ??
            (error.description.toLowerCase().includes("mes") ? error.description : undefined)
          if (fiscalYearError) {
            setFieldError(fiscalYearError)
          } else {
            setGeneralError(error.description)
          }
          toast.error(error.description)
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
        if (error.status >= 500) {
          setGeneralError(texts.genericError)
          toast.error(texts.genericError)
          return
        }
      }

      toastApiError(error, texts.saveFailed, { showCode: false })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
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
          {isLoading ? (
            <PreferencesSkeleton />
          ) : loadError ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>{loadError}</AlertDescription>
              </Alert>
              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={() => setReloadKey((key) => key + 1)}>
                  {texts.retry}
                </Button>
              </div>
            </div>
          ) : draft === null ? null : (
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {generalError && (
                <Alert variant="destructive">
                  <AlertDescription>{generalError}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company-preferences-theme">{texts.theme}</Label>
                  <Select
                    value={draft.theme ?? ""}
                    onValueChange={(value) => update("theme", value as CompanyPreferenceTheme)}
                  >
                    <SelectTrigger id="company-preferences-theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="System">{texts.themes.system}</SelectItem>
                      <SelectItem value="Light">{texts.themes.light}</SelectItem>
                      <SelectItem value="Dark">{texts.themes.dark}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-preferences-language">{texts.language}</Label>
                  <Select
                    value={draft.language ?? ""}
                    onValueChange={(value) => update("language", value as CompanyPreferenceLanguage)}
                  >
                    <SelectTrigger id="company-preferences-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">{texts.languages.es}</SelectItem>
                      <SelectItem value="en">{texts.languages.en}</SelectItem>
                      <SelectItem value="pt">{texts.languages.pt}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company-preferences-currency">{texts.currency}</Label>
                  <Select
                    value={draft.currency ?? ""}
                    onValueChange={(value) => update("currency", value as Currency)}
                  >
                    <SelectTrigger id="company-preferences-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(currencyLabels) as Currency[]).map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currencyLabels[currency]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-preferences-fiscal-month">{texts.fiscalYearStartMonth}</Label>
                  <Select
                    value={draft.fiscalYearStartMonth === null ? "" : String(draft.fiscalYearStartMonth)}
                    onValueChange={(value) => update("fiscalYearStartMonth", Number(value))}
                  >
                    <SelectTrigger id="company-preferences-fiscal-month">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FISCAL_MONTHS.map((month, index) => (
                        <SelectItem key={month} value={String(index + 1)}>
                          {index + 1}. {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{texts.fiscalYearStartMonthHint}</p>
                  {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" disabled={!hasChanges || saving} onClick={() => setDraft(preferences)}>
                  {t.common.cancel}
                </Button>
                <Button type="submit" disabled={!hasChanges || saving}>
                  {saving && <Spinner className="mr-2" />}
                  {saving ? texts.saving : t.common.saveChanges}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function PreferencesSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[1, 2, 3, 4].map((item) => (
        <div className="space-y-2" key={item}>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  )
}
