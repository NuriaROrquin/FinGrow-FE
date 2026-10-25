"use client"

import { InfoIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useMessages } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function InvestmentDisclaimer({ className }: { className?: string }) {
  const t = useMessages().educationContent

  return (
    <Alert className={cn("border-primary/20 bg-primary/5", className)}>
      <InfoIcon className="text-primary" />
      <AlertTitle>{t.disclaimerTitle}</AlertTitle>
      <AlertDescription>{t.disclaimer}</AlertDescription>
    </Alert>
  )
}
