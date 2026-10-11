"use client"

import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { TransactionDto } from "@/lib/api/transactions"

export function TransactionActionsMenu({
  transaction,
  onEdit,
  onDelete,
}: {
  transaction: TransactionDto
  onEdit?: (transaction: TransactionDto) => void
  onDelete?: (transaction: TransactionDto) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-foreground"
        aria-label={`Editar ${transaction.description}`}
        title="Editar"
        onClick={() => onEdit?.(transaction)}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-rose-500 dark:hover:text-rose-300"
        aria-label={`Eliminar ${transaction.description}`}
        title="Eliminar"
        onClick={() => onDelete?.(transaction)}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}
