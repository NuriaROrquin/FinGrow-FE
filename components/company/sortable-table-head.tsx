"use client"

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export function SortableTableHead<Field extends string>({
  label,
  field,
  sortField,
  sortDirection,
  onSort,
  className,
}: {
  label: string
  field: Field
  sortField: Field
  sortDirection: "asc" | "desc"
  onSort: (field: Field) => void
  className?: string
}) {
  const isActive = sortField === field
  const Icon = !isActive ? ArrowUpDown : sortDirection === "asc" ? ArrowUp : ArrowDown

  return (
    <TableHead
      className={className}
      aria-sort={isActive ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className="-ml-2 inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {label}
        <Icon className={cn("size-3.5", isActive ? "text-foreground" : "text-muted-foreground/60")} />
      </button>
    </TableHead>
  )
}
