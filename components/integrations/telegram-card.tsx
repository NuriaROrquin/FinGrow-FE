"use client"

import { Copy, ExternalLink, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { formatLinkedDate, LinkCodeIntegrationCard } from "./link-code-integration-card"

const TELEGRAM_BOT_USERNAME = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "").replace(/^@/, "")

export function TelegramCard() {
  return (
    <LinkCodeIntegrationCard
      provider="telegram"
      name="Telegram"
      icon={<Send className="size-5 text-blue-500" />}
      description="Registrá gastos escribiéndole al bot de FinGrow"
      intro="Vinculá tu Telegram para que FinGrow reconozca tus mensajes. Generá un código, mandáselo al bot y listo: vence a los 10 minutos y sirve una sola vez."
      codeStepLabel="Paso 1: Mandá este código al bot de FinGrow"
      openStep={(linkCode, expired, copy) => (
        <div className="space-y-2">
          <Label>Paso 2: Abrí el bot y tocá Iniciar</Label>
          <div className="flex gap-2">
            <Input value={`@${TELEGRAM_BOT_USERNAME}`} readOnly />
            <Button variant="outline" size="icon" onClick={() => copy(`@${TELEGRAM_BOT_USERNAME}`)}>
              <Copy className="size-4" />
            </Button>
            <Button variant="outline" asChild disabled={expired}>
              <a href={telegramLink(linkCode.code)} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4 mr-2" />
                Abrir
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Al abrirlo desde acá el código va solo; si ya tenés el chat, pegalo y mandalo. Te contestamos por el
            mismo chat cuando quede vinculado.
          </p>
        </div>
      )}
      linkedDescription={(integration) => (
        <>
          Tu chat de Telegram está vinculado
          {integration.linkedAt && ` desde el ${formatLinkedDate(integration.linkedAt)}`}. Escribile a{" "}
          <span className="font-medium">@{TELEGRAM_BOT_USERNAME}</span> y tus gastos quedan registrados.
        </>
      )}
      relinkLabel="Vincular otro chat"
      unlinkWarning={() =>
        "FinGrow va a dejar de reconocer los mensajes de tu chat de Telegram. Los gastos que ya registraste no se borran. Podés volver a vincularlo cuando quieras."
      }
      features={[
        'Registrar gastos: "Gasté $500 en el súper"',
        "Vincular con un toque: Abrir y después Iniciar",
        "Revisar cada movimiento propuesto antes de que cuente",
      ]}
    />
  )
}

function telegramLink(code: string): string {
  return `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${encodeURIComponent(code)}`
}
