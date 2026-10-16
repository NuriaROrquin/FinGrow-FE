"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle2, ExternalLink, Info, Mail, RefreshCw, Unlink } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
  getIntegration,
  NOT_LINKED,
  startGmailLink,
  syncGmail,
  toastApiError,
  unlinkIntegration,
  type GmailLinkResult,
  type Integration,
} from "@/lib/api"
import { useMessages } from "@/lib/i18n"

import { LastSync } from "./last-sync"
import { formatLinkedDate, LINKED_ICON_CLASS } from "./link-code-integration-card"

const PROVIDER = "gmail"
const RESULT_PARAM = "gmail"

export function GmailCard() {
  const t = useMessages()
  const [integration, setIntegration] = useState<Integration | null>(null)
  const [starting, setStarting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [unlinking, setUnlinking] = useState(false)
  const linked = integration?.linked ?? false
  const failed = integration?.status === "Error"

  useEffect(() => {
    const controller = new AbortController()

    getIntegration(PROVIDER, controller.signal)
      .then(setIntegration)
      .catch((error) => {
        if (controller.signal.aborted) return
        toastApiError(error, t.gmail.statusFailed)
        setIntegration(NOT_LINKED)
      })

    return () => controller.abort()
  }, [t])

  useEffect(() => {
    const url = new URL(window.location.href)
    const result = url.searchParams.get(RESULT_PARAM) as GmailLinkResult | null
    if (result === null) return

    if (result === "linked") {
      toast.success(t.gmail.linkedToast, {
        description: t.gmail.linkedToastDescription,
      })
    } else {
      const reason = url.searchParams.get("reason") ?? ""
      toast.error(t.gmail.linkFailedToast, {
        description: t.gmail.linkErrors[reason] ?? t.gmail.retryLater,
      })
    }

    url.searchParams.delete(RESULT_PARAM)
    url.searchParams.delete("reason")
    window.history.replaceState(window.history.state, "", url.toString())
  }, [t])

  const start = async () => {
    setStarting(true)
    try {
      const { authorizationUrl } = await startGmailLink()
      window.location.assign(authorizationUrl)
    } catch (error) {
      toastApiError(error, t.gmail.startFailed)
      setStarting(false)
    }
  }

  const sync = async () => {
    setSyncing(true)
    try {
      const summary = await syncGmail()
      toast.success(summary.imported === 0 ? t.gmail.noNewBills : t.gmail.newBills(summary.imported), {
        description: summary.remaining > 0 ? t.gmail.remaining(summary.remaining) : undefined,
      })
    } catch (error) {
      toastApiError(error, t.gmail.syncFailed)
    } finally {
      setSyncing(false)
      // Si Google rechazó el acceso, la integración quedó con error: se refleja sin recargar la página.
      getIntegration(PROVIDER)
        .then(setIntegration)
        .catch(() => undefined)
    }
  }

  const unlink = async () => {
    setUnlinking(true)
    try {
      await unlinkIntegration(PROVIDER)
      setIntegration(NOT_LINKED)
      toast.success(t.gmail.unlinkedToast)
    } catch (error) {
      toastApiError(error, t.gmail.unlinkFailed)
    } finally {
      setUnlinking(false)
    }
  }

  const busy = starting || syncing || unlinking

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="size-5 text-red-500" />
            <div>
              <CardTitle>Gmail</CardTitle>
              <CardDescription>{t.gmail.description}</CardDescription>
            </div>
          </div>
          {linked &&
            (failed ? (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="size-3" />
                {t.gmail.failedBadge}
              </Badge>
            ) : (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="size-3" />
                {t.common.linked}
              </Badge>
            ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {integration === null ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> {t.gmail.checking}
          </div>
        ) : linked ? (
          <div className="space-y-4">
            {failed ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{integration.errorReason ?? t.gmail.failed}</AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <CheckCircle2 className={LINKED_ICON_CLASS} />
                <AlertDescription>
                  {t.gmail.linkedPrefix}
                  <span className="font-medium">{integration.externalAccountId}</span>
                  {t.gmail.linkedMiddle}
                  {integration.linkedAt && t.gmail.linkedOn(formatLinkedDate(integration.linkedAt))}
                  {t.gmail.linkedSuffix}
                </AlertDescription>
              </Alert>
            )}
            <LastSync lastSyncedAt={integration.lastSyncedAt} />
            <div className="flex flex-wrap gap-2">
              {!failed && (
                <Button onClick={sync} disabled={busy} variant="outline">
                  {syncing ? <Spinner className="mr-2" /> : <RefreshCw className="size-4 mr-2" />}
                  {t.gmail.syncNow}
                </Button>
              )}
              <Button onClick={start} disabled={busy} variant={failed ? "default" : "outline"}>
                {starting && <Spinner className="mr-2" />}
                {t.gmail.reauthorize}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" disabled={busy} className="text-destructive">
                    {unlinking ? <Spinner className="mr-2" /> : <Unlink className="size-4 mr-2" />}
                    {t.common.unlink}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t.gmail.unlinkTitle}</AlertDialogTitle>
                    <AlertDialogDescription>{t.gmail.unlinkWarning}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                    <AlertDialogAction onClick={unlink}>{t.common.unlink}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ) : (
          <>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>{t.gmail.intro}</AlertDescription>
            </Alert>
            <Button onClick={start} disabled={busy} className="w-full sm:w-auto gap-2">
              {starting ? <Spinner /> : <ExternalLink className="size-4" />}
              {t.gmail.connect}
            </Button>
          </>
        )}

        <Separator />

        <div className="space-y-2">
          <h4 className="text-sm font-medium">{t.gmail.detectedTitle}</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {t.gmail.detected.map((service) => (
              <li key={service} className="flex items-center gap-2">
                <CheckCircle2 className="size-3" /> {service}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
