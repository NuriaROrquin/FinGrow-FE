"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Copy, ExternalLink, Info, MessageCircle } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { requestWhatsAppLinkCode, toastApiError, type WhatsAppLinkCode } from "@/lib/api"

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ""

export function WhatsAppCard() {
  const [linkCode, setLinkCode] = useState<WhatsAppLinkCode | null>(null)
  const [loading, setLoading] = useState(false)
  const secondsLeft = useCountdown(linkCode?.expiresAt)
  const expired = linkCode !== null && secondsLeft === 0

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
        <div className="flex items-center gap-3">
          <MessageCircle className="size-5 text-green-500" />
          <div>
            <CardTitle>WhatsApp</CardTitle>
            <CardDescription>Registrá gastos escribiendo o mandando un audio por WhatsApp</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Vinculá tu número para que FinGrow reconozca tus mensajes. Generá un código, mandalo por
            WhatsApp y listo: vence a los 10 minutos y sirve una sola vez.
          </AlertDescription>
        </Alert>

        {linkCode === null ? (
          <Button onClick={generateCode} disabled={loading} className="w-full sm:w-auto">
            {loading && <Spinner className="mr-2" />}
            Vincular WhatsApp
          </Button>
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

            {expired && (
              <Button onClick={generateCode} disabled={loading} variant="outline">
                {loading && <Spinner className="mr-2" />}
                Generar otro código
              </Button>
            )}
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
