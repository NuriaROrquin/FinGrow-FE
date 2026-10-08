"use client"

import { CircleHelp, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { ConfidenceLevel, TransactionType } from "@/lib/api/transactions"
import { useMessages } from "@/lib/i18n"

const levelClassNames: Record<ConfidenceLevel, string> = {
  High: "border-emerald-400/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-300",
  Medium: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  Low: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
}

const levelIcons = {
  High: ShieldCheck,
  Medium: ShieldQuestion,
  Low: ShieldAlert,
} as const

export function ConfidenceBadge({
  level,
  type,
}: {
  level: ConfidenceLevel | null
  type: TransactionType
}) {
  const t = useMessages().pendingInbox

  if (level === null) {
    const isIncome = type === "Income"

    return (
      <Badge
        variant="outline"
        className="gap-1 rounded-full font-medium text-muted-foreground"
        title={isIncome ? t.confidenceHelpNoSuggestion : t.confidenceHelpNoData}
      >
        <CircleHelp className="size-3" aria-hidden="true" />
        {isIncome ? t.confidenceNoSuggestion : t.confidenceNoData}
      </Badge>
    )
  }

  const Icon = levelIcons[level]
  const label = { High: t.confidenceHigh, Medium: t.confidenceMedium, Low: t.confidenceLow }[level]
  const help = { High: t.confidenceHelpHigh, Medium: t.confidenceHelpMedium, Low: t.confidenceHelpLow }[level]

  return (
    <Badge variant="outline" className={`gap-1 rounded-full font-medium ${levelClassNames[level]}`} title={help}>
      <Icon className="size-3" aria-hidden="true" />
      {label}
    </Badge>
  )
}
