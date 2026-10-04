"use client"

import { useEffect, useState, type FormEvent } from "react"
import { DollarSignIcon, PaletteIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toastApiError } from "@/lib/api/notify"
import type { DateFormat, Language, Preferences, ThemePreference } from "@/lib/api/preferences"
import type { Currency } from "@/lib/api/transactions"
import { useAuth } from "@/lib/auth-context"
import { useMessages } from "@/lib/i18n"
import { usePreferences } from "@/lib/preferences-context"

export function PreferencesCard() {
  const { role } = useAuth()

  return role === "empleado" ? <EmployeePreferencesForm /> : <CompanyThemeCard />
}

function EmployeePreferencesForm() {
  const { preferences, savePreferences } = usePreferences()
  const t = useMessages()
  const [draft, setDraft] = useState<Preferences>(preferences)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDraft(preferences)
  }, [preferences])

  const hasChanges = (Object.keys(draft) as (keyof Preferences)[]).some((key) => draft[key] !== preferences[key])

  const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) =>
    setDraft((current) => ({ ...current, [key]: value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)

    try {
      await savePreferences(draft)
      toast.success(t.preferences.saved)
    } catch (error) {
      toastApiError(error, t.preferences.saveFailed, { showCode: false })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <PaletteIcon className="size-5" />
            <div>
              <CardTitle>{t.preferences.appearance}</CardTitle>
              <CardDescription>{t.preferences.appearanceDescription}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ThemeSelect value={draft.theme} onChange={(theme) => update("theme", theme)} />

          <div className="space-y-2">
            <Label htmlFor="language">{t.preferences.language}</Label>
            <Select value={draft.language} onValueChange={(value) => update("language", value as Language)}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">{t.preferences.languages.es}</SelectItem>
                <SelectItem value="en">{t.preferences.languages.en}</SelectItem>
                <SelectItem value="pt">{t.preferences.languages.pt}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <DollarSignIcon className="size-5" />
            <div>
              <CardTitle>{t.preferences.financial}</CardTitle>
              <CardDescription>{t.preferences.financialDescription}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">{t.preferences.currency}</Label>
            <Select value={draft.currency} onValueChange={(value) => update("currency", value as Currency)}>
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ARS">ARS ($)</SelectItem>
                <SelectItem value="USD">USD (US$)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="BRL">BRL (R$)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t.preferences.currencyHint}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateFormat">{t.preferences.dateFormat}</Label>
            <Select value={draft.dateFormat} onValueChange={(value) => update("dateFormat", value as DateFormat)}>
              <SelectTrigger id="dateFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dmy">{t.preferences.dateFormats.dmy}</SelectItem>
                <SelectItem value="mdy">{t.preferences.dateFormats.mdy}</SelectItem>
                <SelectItem value="ymd">{t.preferences.dateFormats.ymd}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" disabled={!hasChanges || saving} onClick={() => setDraft(preferences)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={!hasChanges || saving}>
              {saving ? t.preferences.saving : t.preferences.save}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

/** La empresa no tiene preferencias guardadas: el tema queda solo en este navegador. */
function CompanyThemeCard() {
  const { theme, setTheme } = useTheme()
  const t = useMessages()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <PaletteIcon className="size-5" />
          <div>
            <CardTitle>{t.preferences.appearance}</CardTitle>
            <CardDescription>{t.preferences.appearanceDescription}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ThemeSelect value={(theme as ThemePreference | undefined) ?? "system"} onChange={setTheme} />
      </CardContent>
    </Card>
  )
}

function ThemeSelect({ value, onChange }: { value: ThemePreference; onChange: (theme: ThemePreference) => void }) {
  const t = useMessages()

  return (
    <div className="space-y-2">
      <Label htmlFor="theme">{t.preferences.theme}</Label>
      <Select value={value} onValueChange={(next) => onChange(next as ThemePreference)}>
        <SelectTrigger id="theme">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">{t.preferences.themes.light}</SelectItem>
          <SelectItem value="dark">{t.preferences.themes.dark}</SelectItem>
          <SelectItem value="system">{t.preferences.themes.system}</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{t.preferences.themeHints[value]}</p>
    </div>
  )
}
