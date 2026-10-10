"use client"

import { Copy, ExternalLink, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useMessages } from "@/lib/i18n"

import { formatLinkedDate, LinkCodeIntegrationCard } from "./link-code-integration-card"

export const TELEGRAM_BOT_USERNAME = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "").replace(/^@/, "")

export function TelegramCard() {
  const t = useMessages()

  return (
    <LinkCodeIntegrationCard
      provider="telegram"
      name="Telegram"
      icon={<Send className="size-5 text-blue-500" />}
      description={t.telegram.description}
      intro={t.telegram.intro}
      codeStepLabel={t.telegram.codeStep}
      openStep={(linkCode, expired, copy) => (
        <div className="space-y-2">
          <Label>{t.telegram.openStep}</Label>
          <div className="flex gap-2">
            <Input value={`@${TELEGRAM_BOT_USERNAME}`} readOnly />
            <Button variant="outline" size="icon" onClick={() => copy(`@${TELEGRAM_BOT_USERNAME}`)}>
              <Copy className="size-4" />
            </Button>
            <Button variant="outline" asChild disabled={expired}>
              <a href={telegramLink(linkCode.code)} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4 mr-2" />
                {t.common.open}
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t.telegram.openHint}</p>
        </div>
      )}
      linkedDescription={(integration) => (
        <>
          {t.telegram.linkedPrefix}
          {integration.linkedAt && t.linkCode.since(formatLinkedDate(integration.linkedAt))}
          {t.telegram.linkedMiddle}
          <span className="font-medium">@{TELEGRAM_BOT_USERNAME}</span>
          {t.telegram.linkedSuffix}
        </>
      )}
      relinkLabel={t.telegram.relink}
      unlinkWarning={() => t.telegram.unlinkWarning}
      features={[t.linkCode.expenseExample, t.telegram.quickLinkFeature, t.linkCode.reviewFeature]}
    />
  )
}

function telegramLink(code: string): string {
  return `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${encodeURIComponent(code)}`
}
