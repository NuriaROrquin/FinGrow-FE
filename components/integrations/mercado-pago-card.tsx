"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, ExternalLink, Info, RefreshCw, Unlink, Wallet } from "lucide-react"
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
  startMercadoPagoLink,
  syncMercadoPago,
  toastApiError,
  unlinkIntegration,
  type Integration,
  type MercadoPagoLinkResult,
} from "@/lib/api"
import { useMessages } from "@/lib/i18n"

import { formatLinkedDate } from "./link-code-integration-card"

const PROVIDER = "mercadopago"
const RESULT_PARAM = "mercadopago"

export function MercadoPagoCard() {
  const t = useMessages()
  const [integration, setIntegration] = useState<Integration | null>(null)
  const [starting, setStarting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [unlinking, setUnlinking] = useState(false)
  const linked = integration?.linked ?? false

  useEffect(() => {
    const controller = new AbortController()

    getIntegration(PROVIDER, controller.signal)
      .then(setIntegration)
      .catch((error) => {
        if (controller.signal.aborted) return
        toastApiError(error, t.mercadoPago.statusFailed)
        setIntegration(NOT_LINKED)
      })

    return () => controller.abort()
  }, [t])

  useEffect(() => {
    const url = new URL(window.location.href)
    const result = url.searchParams.get(RESULT_PARAM) as MercadoPagoLinkResult | null
    if (result === null) return

    if (result === "linked") {
      toast.success(t.mercadoPago.linkedToast, {
        description: t.mercadoPago.linkedToastDescription,
      })
    } else {
      const reason = url.searchParams.get("reason") ?? ""
      toast.error(t.mercadoPago.linkFailedToast, {
        description: t.mercadoPago.linkErrors[reason] ?? t.mercadoPago.retryLater,
      })
    }

    url.searchParams.delete(RESULT_PARAM)
    url.searchParams.delete("reason")
    window.history.replaceState(window.history.state, "", url.toString())
  }, [t])

  const start = async () => {
    setStarting(true)
    try {
      const { authorizationUrl } = await startMercadoPagoLink()
      window.location.assign(authorizationUrl)
    } catch (error) {
      toastApiError(error, t.mercadoPago.startFailed)
      setStarting(false)
    }
  }

  const sync = async () => {
    setSyncing(true)
    try {
      const summary = await syncMercadoPago()
      toast.success(
        summary.imported === 0 ? t.mercadoPago.noNewMovements : t.mercadoPago.newMovements(summary.imported),
      )
    } catch (error) {
      toastApiError(error, t.mercadoPago.syncFailed)
    } finally {
      setSyncing(false)
    }
  }

  const unlink = async () => {
    setUnlinking(true)
    try {
      await unlinkIntegration(PROVIDER)
      setIntegration(NOT_LINKED)
      toast.success(t.mercadoPago.unlinkedToast)
    } catch (error) {
      toastApiError(error, t.mercadoPago.unlinkFailed)
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
            <Wallet className="size-5 text-cyan-500" />
            <div>
              <CardTitle>Mercado Pago</CardTitle>
              <CardDescription>{t.mercadoPago.description}</CardDescription>
            </div>
          </div>
          {linked && (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="size-3" />
              {t.common.linked}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {integration === null ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> {t.mercadoPago.checking}
          </div>
        ) : linked ? (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                {t.mercadoPago.linkedPrefix}
                <span className="font-mono">{integration.externalAccountId}</span>
                {t.mercadoPago.linkedMiddle}
                {integration.linkedAt && t.mercadoPago.linkedOn(formatLinkedDate(integration.linkedAt))}
                {t.mercadoPago.linkedSuffix}
              </AlertDescription>
            </Alert>
            <div className="flex flex-wrap gap-2">
              <Button onClick={sync} disabled={busy} variant="outline">
                {syncing ? <Spinner className="mr-2" /> : <RefreshCw className="size-4 mr-2" />}
                {t.mercadoPago.syncNow}
              </Button>
              <Button onClick={start} disabled={busy} variant="outline">
                {starting && <Spinner className="mr-2" />}
                {t.mercadoPago.reauthorize}
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
                    <AlertDialogTitle>{t.mercadoPago.unlinkTitle}</AlertDialogTitle>
                    <AlertDialogDescription>{t.mercadoPago.unlinkWarning}</AlertDialogDescription>
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
              <AlertDescription>{t.mercadoPago.intro}</AlertDescription>
            </Alert>
            <Button onClick={start} disabled={busy} className="w-full sm:w-auto gap-2">
              {starting ? <Spinner /> : <ExternalLink className="size-4" />}
              {t.mercadoPago.connect}
            </Button>
          </>
        )}

        <Separator />

        <div className="space-y-2">
          <h4 className="text-sm font-medium">{t.mercadoPago.whatItDoes}</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {t.mercadoPago.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <CheckCircle2 className="size-3" /> {feature}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
