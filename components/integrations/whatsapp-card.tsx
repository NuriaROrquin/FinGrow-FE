"use client"

import { Copy, ExternalLink, MessageCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { formatLinkedDate, LinkCodeIntegrationCard } from "./link-code-integration-card"

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ""

export function WhatsAppCard() {
  return (
    <LinkCodeIntegrationCard
      provider="whatsapp"
      name="WhatsApp"
      icon={<MessageCircle className="size-5 text-green-500" />}
      description="Registrá gastos escribiendo o mandando un audio por WhatsApp"
      intro="Vinculá tu número para que FinGrow reconozca tus mensajes. Generá un código, mandalo por WhatsApp y listo: vence a los 10 minutos y sirve una sola vez."
      codeStepLabel="Paso 1: Mandá este código al número de FinGrow"
      openStep={(linkCode, expired, copy) => (
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
      )}
      linkedDescription={(integration) => (
        <>
          Tu número <span className="font-medium">{integration.externalAccountId}</span> está vinculado
          {integration.linkedAt && ` desde el ${formatLinkedDate(integration.linkedAt)}`}. Escribile a FinGrow por
          WhatsApp y tus gastos quedan registrados.
        </>
      )}
      relinkLabel="Vincular otro número"
      unlinkWarning={(integration) =>
        `FinGrow va a dejar de reconocer los mensajes de ${integration.externalAccountId}. Los gastos que ya registraste no se borran. Podés volver a vincular el número cuando quieras.`
      }
      features={[
        'Registrar gastos: "Gasté $500 en el súper"',
        "Mandar un audio en lugar de escribir",
        "Revisar cada movimiento propuesto antes de que cuente",
      ]}
    />
  )
}

function whatsAppLink(code: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}?text=${encodeURIComponent(code)}`
}
