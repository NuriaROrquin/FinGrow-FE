"use client"

import type { ReactNode } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { TableHead } from "@/components/ui/table"
import type { SortState } from "@/lib/sort"
import { cn } from "@/lib/utils"

export function SortableTableHead<Field extends string>({
  label,
  field,
  sort,
  onSort,
  align = "left",
  className,
}: {
  label: ReactNode
  field: Field
  sort: SortState<Field> | null
  onSort: (field: Field) => void
  align?: "left" | "right"
  className?: string
}) {
  const isActive = sort?.field === field
  const Icon = !isActive ? ArrowUpDown : sort.direction === "asc" ? ArrowUp : ArrowDown

  return (
    <TableHead
      className={cn(align === "right" && "text-right", className)}
      aria-sort={isActive ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          align === "right" ? "-mr-2" : "-ml-2",
        )}
      >
        {label}
        <Icon
          aria-hidden="true"
          className={cn("size-3.5 shrink-0", isActive ? "text-foreground" : "text-muted-foreground/60")}
        />
      </button>
    </TableHead>
  )
}
