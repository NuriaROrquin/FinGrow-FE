"use client"

import { formatDateTime } from "@/lib/format"
import { useMessages } from "@/lib/i18n"

interface LastSyncProps {
  lastSyncedAt?: string | null
  /** Telegram y WhatsApp no sincronizan: reciben mensajes, y el último cuenta como su actividad. */
  kind?: "sync" | "activity"
}

export function LastSync({ lastSyncedAt, kind = "sync" }: LastSyncProps) {
  const t = useMessages()
  const [format, never] =
    kind === "sync" ? [t.common.lastSync, t.common.neverSynced] : [t.common.lastActivity, t.common.neverActive]

  return <p className="text-sm text-muted-foreground">{lastSyncedAt ? format(formatDateTime(lastSyncedAt)) : never}</p>
}
