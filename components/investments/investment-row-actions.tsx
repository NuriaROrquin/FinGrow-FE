"use client"

import { GraduationCapIcon, PencilIcon, Trash2 } from "lucide-react"
import { investmentTypeTopics } from "@/components/investments/investment-type-topics"
import { Button } from "@/components/ui/button"
import type { InvestmentDto, InvestmentType } from "@/lib/api"

export function InvestmentRowActions({
  investment,
  onLearn,
  onEdit,
  onDelete,
}: {
  investment: InvestmentDto
  onLearn: (type: InvestmentType) => void
  onEdit: (investment: InvestmentDto) => void
  onDelete: (investment: InvestmentDto) => void
}) {
  const learnLabel = `Aprender sobre ${investmentTypeTopics[investment.type]}`

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        title={learnLabel}
        aria-label={learnLabel}
        onClick={() => onLearn(investment.type)}
      >
        <GraduationCapIcon className="size-4" />
      </Button>
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
