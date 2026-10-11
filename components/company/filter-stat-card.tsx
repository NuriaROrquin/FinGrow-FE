"use client"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function FilterStatCard({
  label,
  value,
  hint,
  valueClassName,
  isLoading,
  isSelected,
  onSelect,
}: {
  label: string
  value: number
  hint?: string
  valueClassName?: string
  isLoading: boolean
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className="rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card
        className={cn(
          "h-full py-4 transition-colors hover:border-primary/50 sm:py-6",
          isSelected && "border-primary ring-1 ring-primary",
        )}
      >
        <CardHeader className="px-3 pb-3 sm:px-6">
          <CardDescription className="text-xs sm:text-sm">{label}</CardDescription>
          <CardTitle className={cn("text-2xl sm:text-3xl", valueClassName)}>
            {isLoading ? <Skeleton className="h-9 w-12" /> : value}
          </CardTitle>
          {hint && !isLoading && <p className="text-xs text-muted-foreground">{hint}</p>}
        </CardHeader>
      </Card>
    </button>
  )
}
