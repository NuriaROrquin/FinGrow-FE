"use client"

import { MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" aria-label={`Acciones de ${transaction.description}`}>
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() => {
            onEdit?.(transaction)
          }}
        >
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            onDelete?.(transaction)
          }}
        >
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
