"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { useMessages } from "@/lib/i18n"
import type { Currency } from "@/lib/api/transactions"

export function OtherCurrencyNotice({ currencies }: { currencies: Currency[] }) {
  const t = useMessages()
  if (currencies.length === 0) return null

  return (
    <Alert className="border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800/70 dark:bg-amber-950/40 dark:text-amber-100">
      <AlertDescription className="text-amber-950 dark:text-amber-100">
        {t.otherCurrencyNotice.description(currencies.join(", "))}
      </AlertDescription>
    </Alert>
  )
}
