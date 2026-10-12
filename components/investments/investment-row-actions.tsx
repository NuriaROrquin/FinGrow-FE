"use client"

import type { ReactNode } from "react"
import { GraduationCapIcon, PencilIcon, Trash2 } from "lucide-react"
import { investmentTypeTopics } from "@/components/investments/investment-type-topics"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { InvestmentDto, InvestmentType } from "@/lib/api"

function ActionButton({
  label,
  ariaLabel,
  className,
  onClick,
  children,
}: {
  label: string
  ariaLabel: string
  className?: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className={className} aria-label={ariaLabel} onClick={onClick}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

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
      <ActionButton
        label={learnLabel}
        ariaLabel={learnLabel}
        className="size-8"
        onClick={() => onLearn(investment.type)}
      >
        <GraduationCapIcon className="size-4" />
      </ActionButton>
      <ActionButton
        label="Editar inversión"
        ariaLabel={`Editar ${investment.assetName}`}
        className="size-8"
        onClick={() => onEdit(investment)}
      >
        <PencilIcon className="size-4" />
      </ActionButton>
      <ActionButton
        label="Eliminar inversión"
        ariaLabel={`Eliminar ${investment.assetName}`}
        className="size-8 text-destructive hover:text-destructive"
        onClick={() => onDelete(investment)}
      >
        <Trash2 className="size-4" />
      </ActionButton>
    </div>
  )
}
