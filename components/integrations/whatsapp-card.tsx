"use client"

import { Copy, ExternalLink, MessageCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useMessages } from "@/lib/i18n"

import { formatLinkedDate, LinkCodeIntegrationCard } from "./link-code-integration-card"

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ""

export function WhatsAppCard() {
  const t = useMessages()

  return (
    <LinkCodeIntegrationCard
      provider="whatsapp"
      name="WhatsApp"
      icon={<MessageCircle className="size-5 text-green-500" />}
      description={t.whatsapp.description}
      intro={t.whatsapp.intro}
      codeStepLabel={t.whatsapp.codeStep}
      openStep={(linkCode, expired, copy) => (
        <div className="space-y-2">
          <Label>{t.whatsapp.openStep}</Label>
          <div className="flex gap-2">
            <Input value={WHATSAPP_NUMBER} readOnly />
            <Button variant="outline" size="icon" onClick={() => copy(WHATSAPP_NUMBER)}>
              <Copy className="size-4" />
            </Button>
            <Button variant="outline" asChild disabled={expired}>
              <a href={whatsAppLink(linkCode.code)} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4 mr-2" />
                {t.common.open}
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t.whatsapp.openHint}</p>
        </div>
      )}
      linkedDescription={(integration) => (
        <>
          {t.whatsapp.linkedPrefix}
          <span className="font-medium">{integration.externalAccountId}</span>
          {t.whatsapp.linkedMiddle}
          {integration.linkedAt && t.linkCode.since(formatLinkedDate(integration.linkedAt))}
          {t.whatsapp.linkedSuffix}
        </>
      )}
      relinkLabel={t.whatsapp.relink}
      unlinkWarning={(integration) => t.whatsapp.unlinkWarning(integration.externalAccountId ?? "")}
      features={[t.linkCode.expenseExample, t.whatsapp.audioFeature, t.linkCode.reviewFeature]}
    />
  )
}

function whatsAppLink(code: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}?text=${encodeURIComponent(code)}`
}
