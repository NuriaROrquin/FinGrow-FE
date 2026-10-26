"use client"

import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { TransactionDto } from "@/lib/api/transactions"
import { useMessages } from "@/lib/i18n"

export function TransactionActionsMenu({
  transaction,
  onEdit,
  onDelete,
}: {
  transaction: TransactionDto
  onEdit?: (transaction: TransactionDto) => void
  onDelete?: (transaction: TransactionDto) => void
}) {
  const t = useMessages().transactions

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-foreground"
        aria-label={t.editAria(transaction.description)}
        title={t.edit}
        onClick={() => onEdit?.(transaction)}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-rose-500 dark:hover:text-rose-300"
        aria-label={t.deleteAria(transaction.description)}
        title={transaction.status === "Eliminated" ? t.alreadyDeleted : t.delete}
        disabled={transaction.status === "Eliminated"}
        onClick={() => onDelete?.(transaction)}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}
