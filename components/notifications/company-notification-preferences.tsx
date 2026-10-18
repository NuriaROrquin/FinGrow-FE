"use client"

import { useCallback, useEffect, useState } from "react"
import { BellRingIcon, CircleHelpIcon, UserMinusIcon, UserPlusIcon, UsersRoundIcon, WalletCardsIcon } from "lucide-react"
import { toast } from "sonner"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import {
  listCompanyNotificationTypePreferences,
  toastApiError,
  updateCompanyNotificationTypePreference,
  type CompanyNotificationType,
  type CompanyNotificationTypePreferenceDto,
} from "@/lib/api"
import { useMessages } from "@/lib/i18n"
import { es } from "@/lib/i18n/es"

const orderedTypes: CompanyNotificationType[] = [
  "FinancialWellbeingLow",
  "ParticipationLow",
  "EmployeeAdded",
  "EmployeeRemoved",
]

const thresholdDefaults: Partial<Record<CompanyNotificationType, number>> = {
  FinancialWellbeingLow: 60,
  ParticipationLow: 50,
}

const icons = {
  FinancialWellbeingLow: WalletCardsIcon,
  ParticipationLow: UsersRoundIcon,
  EmployeeAdded: UserPlusIcon,
  EmployeeRemoved: UserMinusIcon,
}

function isThresholdType(type: CompanyNotificationType): type is "FinancialWellbeingLow" | "ParticipationLow" {
  return type === "FinancialWellbeingLow" || type === "ParticipationLow"
}

export function CompanyNotificationPreferences() {
  const t = useMessages()
  const companyMessages = t.settings.notifications.company ?? es.settings.notifications.company
  const [preferences, setPreferences] = useState<CompanyNotificationTypePreferenceDto[] | null>(null)
  const [confirmed, setConfirmed] = useState<CompanyNotificationTypePreferenceDto[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [saving, setSaving] = useState<ReadonlySet<CompanyNotificationType>>(new Set())

  const load = useCallback(async (signal?: AbortSignal) => {
    setFailed(false)
    try {
      const result = await listCompanyNotificationTypePreferences(signal)
      const sorted = [...result].sort((a, b) => orderedTypes.indexOf(a.type) - orderedTypes.indexOf(b.type))
      setPreferences(sorted)
      setConfirmed(sorted)
    } catch (error) {
      if (signal?.aborted) return
      toastApiError(error, companyMessages.loadFailed)
      setFailed(true)
    }
  }, [companyMessages])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  const setBusy = (type: CompanyNotificationType, busy: boolean) => {
    setSaving((current) => {
      const next = new Set(current)
      if (busy) next.add(type)
      else next.delete(type)
      return next
    })
  }

  const updateLocal = (type: CompanyNotificationType, changes: Partial<CompanyNotificationTypePreferenceDto>) => {
    setPreferences((current) =>
      current?.map((preference) => (preference.type === type ? { ...preference, ...changes } : preference)) ?? null,
    )
  }

  const saveAll = async () => {
    if (!preferences || !confirmed || preferences.some((preference) =>
      isThresholdType(preference.type) &&
      preference.isEnabled &&
      (preference.threshold === null || preference.threshold < 1 || preference.threshold > 100),
    )) {
      return
    }

    const changed = preferences.filter((preference) => {
      const saved = confirmed.find((existing) => existing.type === preference.type)
      return saved && !samePreference(saved, preference)
    })

    if (changed.length === 0) return
    changed.forEach((preference) => setBusy(preference.type, true))

    try {
      const saved = await Promise.all(changed.map((preference) =>
        updateCompanyNotificationTypePreference(preference.type, {
          isEnabled: preference.isEnabled,
          cadence: preference.cadence,
          threshold: preference.threshold,
        }),
      ))
      setPreferences((current) =>
        current?.map((preference) => saved.find((item) => item.type === preference.type) ?? preference) ?? null,
      )
      setConfirmed((current) =>
        current?.map((preference) => saved.find((item) => item.type === preference.type) ?? preference) ?? null,
      )
      toast.success(companyMessages.saved)
    } catch (error) {
      setPreferences(confirmed)
      toastApiError(error, companyMessages.saveFailed)
    } finally {
      changed.forEach((preference) => setBusy(preference.type, false))
    }
  }

  const changeEnabled = (preference: CompanyNotificationTypePreferenceDto, isEnabled: boolean) => {
    updateLocal(preference.type, {
      isEnabled,
      cadence: isEnabled && isThresholdType(preference.type) ? "Monthly" : preference.cadence,
      threshold: isEnabled && isThresholdType(preference.type)
        ? preference.threshold ?? thresholdDefaults[preference.type] ?? null
        : preference.threshold,
    })
  }

  if (failed) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between gap-4 py-6">
          <p className="text-sm text-muted-foreground">{companyMessages.loadFailed}</p>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            {t.settings.notifications.retry}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Spinner />
          {companyMessages.loading}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <BellRingIcon className="size-5" />
          <div>
            <CardTitle>{companyMessages.title}</CardTitle>
            <CardDescription>{companyMessages.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {preferences.map((preference, index) => {
          const text = companyMessages.types[preference.type]
          const metric = isThresholdType(preference.type) ? companyMessages.types[preference.type] : null
          const Icon = icons[preference.type]
          const id = `company-notification-${preference.type}`
          const isSaving = saving.size > 0
          const validThreshold = !isThresholdType(preference.type) ||
            (preference.threshold !== null && preference.threshold >= 1 && preference.threshold <= 100)

          return (
            <div key={preference.type} className="space-y-4">
              {index > 0 && <Separator />}
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="space-y-1">
                    <Label htmlFor={id}>{text.label}</Label>
                    <p className="text-sm text-muted-foreground">{text.description}</p>
                    {metric && <p className="text-xs text-muted-foreground">{metric.shortHelp}</p>}
                  </div>
                </div>
                <Switch
                  id={id}
                  checked={preference.isEnabled}
                  disabled={isSaving}
                  onCheckedChange={(checked) => changeEnabled(preference, checked)}
                />
              </div>

              {metric && isThresholdType(preference.type) && (
                <MetricHelp
                  type={preference.type}
                  helpTitle={metric.helpTitle}
                  help={metric.help}
                  privacyNote={metric.privacyNote}
                  formula={"formula" in metric ? metric.formula : undefined}
                  factors={"factors" in metric ? metric.factors : undefined}
                />
              )}

              {metric && preference.isEnabled && (
                <div className="ml-8 space-y-3 rounded-md border bg-muted/30 p-4">
                  <Label htmlFor={`${id}-threshold`}>{metric.thresholdLabel}</Label>
                  <div className="flex max-w-xs items-center gap-2">
                    <Input
                      id={`${id}-threshold`}
                      type="number"
                      min={1}
                      max={100}
                      required
                      value={preference.threshold ?? ""}
                      disabled={isSaving}
                      aria-invalid={!validThreshold}
                      onChange={(event) => {
                        const value = event.target.value
                        updateLocal(preference.type, { threshold: value === "" ? null : Number(value) })
                      }}
                    />
                    <span className="text-sm text-muted-foreground">{metric.thresholdSuffix}</span>
                  </div>
                  {!validThreshold && <p className="text-sm text-destructive">{companyMessages.thresholdError}</p>}
                  <p className="text-sm text-muted-foreground">{companyMessages.monthly}</p>
                </div>
              )}
            </div>
          )
        })}
        <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{companyMessages.privacy}</p>
        <div className="flex items-center justify-end gap-3 border-t pt-4">
          <Button
            disabled={isSaving(saving) || !hasChanges(preferences, confirmed) || !allThresholdsValid(preferences)}
            onClick={() => void saveAll()}
          >
            {isSaving(saving) && <Spinner className="mr-2" />}
            {companyMessages.saveAll}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function samePreference(
  first: CompanyNotificationTypePreferenceDto,
  second: CompanyNotificationTypePreferenceDto,
): boolean {
  return first.isEnabled === second.isEnabled &&
    first.cadence === second.cadence &&
    first.threshold === second.threshold
}

function hasChanges(
  preferences: CompanyNotificationTypePreferenceDto[],
  confirmed: CompanyNotificationTypePreferenceDto[] | null,
): boolean {
  return Boolean(confirmed && preferences.some((preference) => {
    const saved = confirmed.find((existing) => existing.type === preference.type)
    return saved && !samePreference(saved, preference)
  }))
}

function allThresholdsValid(preferences: CompanyNotificationTypePreferenceDto[]): boolean {
  return preferences.every((preference) =>
    !isThresholdType(preference.type) ||
    !preference.isEnabled ||
    (preference.threshold !== null && preference.threshold >= 1 && preference.threshold <= 100),
  )
}

function isSaving(saving: ReadonlySet<CompanyNotificationType>): boolean {
  return saving.size > 0
}

function MetricHelp({
  type,
  helpTitle,
  help,
  privacyNote,
  formula,
  factors,
}: {
  type: "FinancialWellbeingLow" | "ParticipationLow"
  helpTitle: string
  help: readonly string[]
  privacyNote: string
  formula?: string
  factors?: readonly string[]
}) {
  return (
    <Accordion type="single" collapsible className="ml-8">
      <AccordionItem value={`help-${type}`}>
        <AccordionTrigger>
          <span className="flex items-center gap-2"><CircleHelpIcon className="size-4" />{helpTitle}</span>
        </AccordionTrigger>
        <AccordionContent className="space-y-3 text-muted-foreground">
          {help.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {type === "ParticipationLow" ? (
            <p className="font-medium text-foreground">{formula}</p>
          ) : (
            <ul className="list-disc space-y-1 pl-5">
              {factors?.map((factor) => <li key={factor}>{factor}</li>)}
            </ul>
          )}
          <p>{privacyNote}</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
