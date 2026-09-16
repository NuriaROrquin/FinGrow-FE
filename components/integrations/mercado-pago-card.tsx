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

import { formatLinkedDate } from "./link-code-integration-card"

const PROVIDER = "mercadopago"
const RESULT_PARAM = "mercadopago"

const LINK_ERRORS: Record<string, string> = {
  "Integrations.MercadoPago.Denied": "No autorizaste la conexión en Mercado Pago. Podés volver a intentar cuando quieras.",
  "Integrations.MercadoPago.InvalidState": "La vinculación venció o no se inició desde FinGrow. Volvé a intentar.",
  "Integrations.MercadoPago.ExchangeFailed": "Mercado Pago no entregó las credenciales. Volvé a intentar en unos minutos.",
}

const FEATURES = [
  "Tus compras, pagos y transferencias entran solos cada hora",
  "Cada movimiento llega como pendiente para que lo revises antes de que cuente",
  "Los cobros que recibís se registran como ingresos",
]

export function MercadoPagoCard() {
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
        toastApiError(error, "No pudimos consultar el estado de Mercado Pago.")
        setIntegration(NOT_LINKED)
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const url = new URL(window.location.href)
    const result = url.searchParams.get(RESULT_PARAM) as MercadoPagoLinkResult | null
    if (result === null) return

    if (result === "linked") {
      toast.success("Mercado Pago vinculado", {
        description: "Tus movimientos de los últimos 90 días van a aparecer en unos minutos como pendientes.",
      })
    } else {
      const reason = url.searchParams.get("reason") ?? ""
      toast.error("No pudimos vincular Mercado Pago", {
        description: LINK_ERRORS[reason] ?? "Volvé a intentar en unos minutos.",
      })
    }

    url.searchParams.delete(RESULT_PARAM)
    url.searchParams.delete("reason")
    window.history.replaceState(window.history.state, "", url.toString())
  }, [])

  const start = async () => {
    setStarting(true)
    try {
      const { authorizationUrl } = await startMercadoPagoLink()
      window.location.assign(authorizationUrl)
    } catch (error) {
      toastApiError(error, "No pudimos iniciar la vinculación. Intentá de nuevo.")
      setStarting(false)
    }
  }

  const sync = async () => {
    setSyncing(true)
    try {
      const summary = await syncMercadoPago()
      toast.success(
        summary.imported === 0
          ? "No hay movimientos nuevos"
          : `${summary.imported} ${summary.imported === 1 ? "movimiento nuevo" : "movimientos nuevos"} para revisar`,
      )
    } catch (error) {
      toastApiError(error, "No pudimos sincronizar Mercado Pago. Intentá de nuevo.")
    } finally {
      setSyncing(false)
    }
  }

  const unlink = async () => {
    setUnlinking(true)
    try {
      await unlinkIntegration(PROVIDER)
      setIntegration(NOT_LINKED)
      toast.success("Mercado Pago desvinculado")
    } catch (error) {
      toastApiError(error, "No pudimos desvincular Mercado Pago. Intentá de nuevo.")
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
              <CardDescription>Tus movimientos de Mercado Pago se sincronizan solos</CardDescription>
            </div>
          </div>
          {linked && (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="size-3" />
              Vinculado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {integration === null ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> Consultando el estado de Mercado Pago...
          </div>
        ) : linked ? (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Cuenta de Mercado Pago <span className="font-mono">{integration.externalAccountId}</span> vinculada
                {integration.linkedAt && ` el ${formatLinkedDate(integration.linkedAt)}`}. Los movimientos nuevos se
                traen cada hora y aparecen como pendientes en Transacciones.
              </AlertDescription>
            </Alert>
            <div className="flex flex-wrap gap-2">
              <Button onClick={sync} disabled={busy} variant="outline">
                {syncing ? <Spinner className="mr-2" /> : <RefreshCw className="size-4 mr-2" />}
                Sincronizar ahora
              </Button>
              <Button onClick={start} disabled={busy} variant="outline">
                {starting && <Spinner className="mr-2" />}
                Volver a autorizar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" disabled={busy} className="text-destructive">
                    {unlinking ? <Spinner className="mr-2" /> : <Unlink className="size-4 mr-2" />}
                    Desvincular
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Desvincular Mercado Pago?</AlertDialogTitle>
                    <AlertDialogDescription>
                      FinGrow deja de leer tu cuenta de Mercado Pago y borra la autorización. Los movimientos que ya
                      se importaron no se pierden.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={unlink}>Desvincular</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ) : (
          <>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Te llevamos a Mercado Pago para que autorices a FinGrow a leer tus movimientos. No vemos tu contraseña
                y podés revocar el permiso cuando quieras, desde acá o desde Mercado Pago.
              </AlertDescription>
            </Alert>
            <Button onClick={start} disabled={busy} className="w-full sm:w-auto gap-2">
              {starting ? <Spinner /> : <ExternalLink className="size-4" />}
              Conectar Mercado Pago
            </Button>
          </>
        )}

        <Separator />

        <div className="space-y-2">
          <h4 className="text-sm font-medium">¿Qué hace la vinculación?</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {FEATURES.map((feature) => (
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
