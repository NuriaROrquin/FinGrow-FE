"use client"

import { PencilIcon, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { InvestmentDto } from "@/lib/api"

export function InvestmentRowActions({
  investment,
  onEdit,
  onDelete,
}: {
  investment: InvestmentDto
  onEdit: (investment: InvestmentDto) => void
  onDelete: (investment: InvestmentDto) => void
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        title="Editar"
        aria-label={`Editar ${investment.assetName}`}
        onClick={() => onEdit(investment)}
      >
        <PencilIcon className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-destructive hover:text-destructive"
        title="Eliminar"
        aria-label={`Eliminar ${investment.assetName}`}
        onClick={() => onDelete(investment)}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}
