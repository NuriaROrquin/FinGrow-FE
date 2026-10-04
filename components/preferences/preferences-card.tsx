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
import { usePreferences } from "@/lib/preferences-context"

export function PreferencesCard() {
  const { role } = useAuth()

  return role === "empleado" ? <EmployeePreferencesForm /> : <CompanyThemeCard />
}

function EmployeePreferencesForm() {
  const { preferences, savePreferences } = usePreferences()
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
      toast.success("Preferencias guardadas")
    } catch (error) {
      toastApiError(error, "No pudimos guardar tus preferencias.", { showCode: false })
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
              <CardTitle>Apariencia</CardTitle>
              <CardDescription>Personaliza cómo se ve la aplicación</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ThemeSelect value={draft.theme} onChange={(theme) => update("theme", theme)} />

          <div className="space-y-2">
            <Label htmlFor="language">Idioma</Label>
            <Select value={draft.language} onValueChange={(value) => update("language", value as Language)}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="en">Inglés</SelectItem>
                <SelectItem value="pt">Portugués</SelectItem>
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
              <CardTitle>Preferencias Financieras</CardTitle>
              <CardDescription>Configura tus ajustes financieros</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Moneda</Label>
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
            <p className="text-xs text-muted-foreground">
              Es la moneda con la que se abren tus resúmenes y formularios. Cada movimiento se sigue mostrando en la
              moneda en que se registró.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateFormat">Formato de Fecha</Label>
            <Select value={draft.dateFormat} onValueChange={(value) => update("dateFormat", value as DateFormat)}>
              <SelectTrigger id="dateFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dmy">DD/MM/AAAA</SelectItem>
                <SelectItem value="mdy">MM/DD/AAAA</SelectItem>
                <SelectItem value="ymd">AAAA-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" disabled={!hasChanges || saving} onClick={() => setDraft(preferences)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!hasChanges || saving}>
              {saving ? "Guardando..." : "Guardar Preferencias"}
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <PaletteIcon className="size-5" />
          <div>
            <CardTitle>Apariencia</CardTitle>
            <CardDescription>Personaliza cómo se ve la aplicación</CardDescription>
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
  return (
    <div className="space-y-2">
      <Label htmlFor="theme">Tema</Label>
      <Select value={value} onValueChange={(next) => onChange(next as ThemePreference)}>
        <SelectTrigger id="theme">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">Claro</SelectItem>
          <SelectItem value="dark">Oscuro</SelectItem>
          <SelectItem value="system">Sistema</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {value === "system"
          ? "El tema se ajusta automáticamente según la configuración de tu sistema"
          : value === "dark"
            ? "Tema oscuro"
            : "Tema claro"}
      </p>
    </div>
  )
}
