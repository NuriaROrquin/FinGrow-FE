"use client"

import { useCallback, useEffect, useState } from "react"
import { BellIcon, SendIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import {
  changeNotificationChannel,
  changeNotificationTypePreference,
  listNotificationChannels,
  listNotificationTypePreferences,
  toastApiError,
  type NotificationChannel,
  type NotificationChannelDto,
  type NotificationType,
  type NotificationTypePreferenceDto,
} from "@/lib/api"
import { useMessages } from "@/lib/i18n"

interface Preferences {
  types: NotificationTypePreferenceDto[]
  channels: NotificationChannelDto[]
}

/**
 * Qué alertas recibe el empleado (HU-05) y por dónde. Conviven: el tipo decide si la alerta
 * existe (apagado, no llega a ningún canal ni a la bandeja) y el canal decide por dónde viaja.
 * Cada cambio se guarda al instante; si falla, el switch vuelve a su valor anterior.
 */
export function NotificationPreferences() {
  const t = useMessages()
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [failed, setFailed] = useState(false)
  const [saving, setSaving] = useState<ReadonlySet<string>>(new Set())

  const load = useCallback(async (signal?: AbortSignal) => {
    setFailed(false)

    try {
      const [types, channels] = await Promise.all([
        listNotificationTypePreferences(signal),
        listNotificationChannels(signal),
      ])
      setPreferences({ types, channels })
    } catch (error) {
      if (signal?.aborted) return
      toastApiError(error, t.settings.notifications.loadFailed)
      setFailed(true)
    }
  }, [t])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)

    return () => controller.abort()
  }, [load])

  const setBusy = (key: string, busy: boolean) =>
    setSaving((current) => {
      const next = new Set(current)
      if (busy) next.add(key)
      else next.delete(key)
      return next
    })

  const changeType = async (type: NotificationType, isEnabled: boolean) => {
    const key = `type:${type}`
    setBusy(key, true)
    setPreferences((current) => current && withType(current, type, isEnabled))

    try {
      await changeNotificationTypePreference(type, isEnabled)
    } catch (error) {
      setPreferences((current) => current && withType(current, type, !isEnabled))
      toastApiError(error, t.settings.notifications.saveFailed)
    } finally {
      setBusy(key, false)
    }
  }

  const changeChannel = async (channel: NotificationChannel, isEnabled: boolean) => {
    const key = `channel:${channel}`
    setBusy(key, true)
    setPreferences((current) => current && withChannel(current, channel, isEnabled))

    try {
      await changeNotificationChannel(channel, isEnabled)
    } catch (error) {
      setPreferences((current) => current && withChannel(current, channel, !isEnabled))
      toastApiError(error, t.settings.notifications.saveFailed)
    } finally {
      setBusy(key, false)
    }
  }

  if (failed) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between gap-4 py-6">
          <p className="text-sm text-muted-foreground">{t.settings.notifications.loadFailed}</p>
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
          {t.settings.notifications.loading}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <BellIcon className="size-5" />
            <div>
              <CardTitle>{t.settings.notifications.alertTypes.title}</CardTitle>
              <CardDescription>{t.settings.notifications.alertTypes.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {preferences.types.map((preference, index) => {
            const text = t.settings.notifications.alertTypes[preference.type]
            const id = `notification-type-${preference.type}`

            return (
              <div key={preference.type} className="space-y-6">
                {index > 0 && <Separator />}
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor={id}>{text.label}</Label>
                    <p className="text-sm text-muted-foreground">{text.hint}</p>
                  </div>
                  <Switch
                    id={id}
                    checked={preference.isEnabled}
                    disabled={saving.has(`type:${preference.type}`)}
                    onCheckedChange={(checked) => void changeType(preference.type, checked)}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <SendIcon className="size-5" />
            <div>
              <CardTitle>{t.settings.notifications.channels.title}</CardTitle>
              <CardDescription>{t.settings.notifications.channels.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {preferences.channels.map((channel, index) => {
            const text = t.settings.notifications.channels[channel.channel]
            const id = `notification-channel-${channel.channel}`

            return (
              <div key={channel.channel} className="space-y-6">
                {index > 0 && <Separator />}
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor={id}>{text.label}</Label>
                    <p className="text-sm text-muted-foreground">{text.hint}</p>
                    {channel.isConfigurable && !channel.isConnected && (
                      <p className="text-sm text-muted-foreground">{t.settings.notifications.channels.notConnected}</p>
                    )}
                  </div>
                  {channel.isConfigurable ? (
                    <Switch
                      id={id}
                      checked={channel.isEnabled}
                      disabled={saving.has(`channel:${channel.channel}`)}
                      onCheckedChange={(checked) => void changeChannel(channel.channel, checked)}
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">{t.settings.notifications.channels.alwaysOn}</span>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </>
  )
}

function withType(preferences: Preferences, type: NotificationType, isEnabled: boolean): Preferences {
  return {
    ...preferences,
    types: preferences.types.map((preference) => (preference.type === type ? { ...preference, isEnabled } : preference)),
  }
}

function withChannel(preferences: Preferences, channel: NotificationChannel, isEnabled: boolean): Preferences {
  return {
    ...preferences,
    channels: preferences.channels.map((existing) => (existing.channel === channel ? { ...existing, isEnabled } : existing)),
  }
}
