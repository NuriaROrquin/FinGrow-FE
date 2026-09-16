"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Copy, ExternalLink, Info, MessageCircle } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
  getWhatsAppIntegration,
  requestWhatsAppLinkCode,
  toastApiError,
  type WhatsAppIntegration,
  type WhatsAppLinkCode,
} from "@/lib/api"

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ""

// Mientras hay un código vigente, consultamos cada tanto si el número ya quedó
// vinculado: el enlace ocurre por WhatsApp, así que la web no se entera sola.
const LINK_POLL_INTERVAL_MS = 5_000

const NOT_LINKED: WhatsAppIntegration = { linked: false, phoneNumber: null, linkedAt: null }

export function WhatsAppCard() {
  // null = todavía no sabemos si está vinculado (cargando).
  const [integration, setIntegration] = useState<WhatsAppIntegration | null>(null)
  const [linkCode, setLinkCode] = useState<WhatsAppLinkCode | null>(null)
  const [loading, setLoading] = useState(false)
  const secondsLeft = useCountdown(linkCode?.expiresAt)
  const expired = linkCode !== null && secondsLeft === 0
  const linked = integration?.linked ?? false

  useEffect(() => {
    const controller = new AbortController()

    getWhatsAppIntegration(controller.signal)
      .then(setIntegration)
      .catch((error) => {
        if (controller.signal.aborted) return
        toastApiError(error, "No pudimos consultar el estado de WhatsApp.")
        setIntegration(NOT_LINKED)
      })

    return () => controller.abort()
  }, [])

  const awaitingLink = linkCode !== null && !expired
  const linkedAtBeforeCode = integration?.linkedAt ?? null

  useEffect(() => {
    if (!awaitingLink) return

    const controller = new AbortController()
    const interval = setInterval(async () => {
      try {
        const current = await getWhatsAppIntegration(controller.signal)
        // Un relink cambia linkedAt aunque el número sea el mismo.
        if (current.linked && current.linkedAt !== linkedAtBeforeCode) {
          setIntegration(current)
          setLinkCode(null)
          toast.success("WhatsApp vinculado")
        }
      } catch {
        // Si falla un sondeo, el siguiente lo vuelve a intentar.
      }
    }, LINK_POLL_INTERVAL_MS)

    return () => {
      clearInterval(interval)
      controller.abort()
    }
  }, [awaitingLink, linkedAtBeforeCode])

  const generateCode = async () => {
    setLoading(true)
    try {
      setLinkCode(await requestWhatsAppLinkCode())
    } catch (error) {
      toastApiError(error, "No pudimos generar el código. Intentá de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copiado al portapapeles")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="size-5 text-green-500" />
            <div>
              <CardTitle>WhatsApp</CardTitle>
              <CardDescription>Registrá gastos escribiendo o mandando un audio por WhatsApp</CardDescription>
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
            <Spinner /> Consultando el estado de WhatsApp...
          </div>
        ) : linked && linkCode === null ? (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Tu número <span className="font-medium">{integration.phoneNumber}</span> está vinculado
                {integration.linkedAt && ` desde el ${formatDate(integration.linkedAt)}`}. Escribile a FinGrow por
                WhatsApp y tus gastos quedan registrados.
              </AlertDescription>
            </Alert>
            <Button onClick={generateCode} disabled={loading} variant="outline" className="w-full sm:w-auto">
              {loading && <Spinner className="mr-2" />}
              Vincular otro número
            </Button>
          </div>
        ) : linkCode === null ? (
          <>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Vinculá tu número para que FinGrow reconozca tus mensajes. Generá un código, mandalo por
                WhatsApp y listo: vence a los 10 minutos y sirve una sola vez.
              </AlertDescription>
            </Alert>
            <Button onClick={generateCode} disabled={loading} className="w-full sm:w-auto">
              {loading && <Spinner className="mr-2" />}
              Vincular WhatsApp
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Paso 1: Mandá este código al número de FinGrow</Label>
              <div className="flex gap-2">
                <Input value={formatCode(linkCode.code)} readOnly className="font-mono text-lg tracking-widest" />
                <Button variant="outline" size="icon" onClick={() => copy(linkCode.code)} disabled={expired}>
                  <Copy className="size-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {expired ? "El código venció." : `Vence en ${formatCountdown(secondsLeft)}`}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Paso 2: Abrí el chat con FinGrow</Label>
              <div className="flex gap-2">
                <Input value={WHATSAPP_NUMBER} readOnly />
                <Button variant="outline" size="icon" onClick={() => copy(WHATSAPP_NUMBER)}>
                  <Copy className="size-4" />
                </Button>
                <Button variant="outline" asChild disabled={expired}>
                  <a href={whatsAppLink(linkCode.code)} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4 mr-2" />
                    Abrir
                  </a>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Te contestamos por el mismo chat cuando el número quede vinculado.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {expired && (
                <Button onClick={generateCode} disabled={loading} variant="outline">
                  {loading && <Spinner className="mr-2" />}
                  Generar otro código
                </Button>
              )}
              {linked && (
                <Button onClick={() => setLinkCode(null)} variant="ghost">
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        )}

        <Separator />

        <div className="space-y-2">
          <h4 className="text-sm font-medium">¿Qué podés hacer por WhatsApp?</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="size-3" /> Registrar gastos: &quot;Gasté $500 en el súper&quot;
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="size-3" /> Mandar un audio en lugar de escribir
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="size-3" /> Revisar cada movimiento propuesto antes de que cuente
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

function useCountdown(expiresAt: string | undefined): number {
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    if (!expiresAt) {
      setSecondsLeft(0)
      return
    }

    const deadline = new Date(expiresAt).getTime()
    const tick = () => setSecondsLeft(Math.max(0, Math.floor((deadline - Date.now()) / 1000)))

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  return secondsLeft
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
}

function formatCode(code: string): string {
  return `${code.slice(0, 4)} ${code.slice(4)}`
}

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${rest.toString().padStart(2, "0")}`
}

function whatsAppLink(code: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}?text=${encodeURIComponent(code)}`
}
