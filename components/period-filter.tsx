"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatDateText } from "@/lib/format"

export type PeriodDateRange = {
  dateFrom: string
  dateTo: string
}

export function formatDateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function parseDateInput(value: string): Date {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function getCurrentMonthStart(): string {
  const now = new Date()
  return formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1))
}

export function getToday(): string {
  return formatDateInput(new Date())
}

function getMonthEnd(date: Date): string {
  return formatDateInput(new Date(date.getFullYear(), date.getMonth() + 1, 0))
}

export function getInclusiveMonthCount(dateFrom: string, dateTo: string): number {
  const from = parseDateInput(dateFrom)
  const to = parseDateInput(dateTo)
  return Math.max(
    1,
    (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth() + 1,
  )
}

type PeriodFilterProps = {
  dateFrom: string
  dateTo: string
  onChange: (range: PeriodDateRange) => void
}

export function PeriodFilter({ dateFrom, dateTo, onChange }: PeriodFilterProps) {
  const [customDateFrom, setCustomDateFrom] = useState(dateFrom)
  const [customDateTo, setCustomDateTo] = useState(dateTo)
  const [isCustomPeriodOpen, setIsCustomPeriodOpen] = useState(false)
  const periodLabel = formatDateText(parseDateInput(dateFrom), { month: "long", year: "numeric" })

  const changePeriod = (offset: number) => {
    const currentPeriod = parseDateInput(dateFrom)
    const nextPeriod = new Date(currentPeriod.getFullYear(), currentPeriod.getMonth() + offset, 1)
    onChange({
      dateFrom: formatDateInput(nextPeriod),
      dateTo: getMonthEnd(nextPeriod),
    })
  }

  const applyCustomPeriod = () => {
    if (!customDateFrom || !customDateTo || customDateFrom > customDateTo) return

    onChange({ dateFrom: customDateFrom, dateTo: customDateTo })
    setIsCustomPeriodOpen(false)
  }

  return (
    <div className="w-full max-w-3xl space-y-3">
      <Label className="text-xs text-muted-foreground">Período</Label>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Período anterior"
          title="Período anterior"
          onClick={() => changePeriod(-1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div className="min-w-48 rounded-md border border-border/60 bg-card px-3 py-2 text-center text-sm font-medium capitalize">
          {periodLabel}
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Período siguiente"
          title="Período siguiente"
          onClick={() => changePeriod(1)}
        >
          <ChevronRight className="size-4" />
        </Button>
        <Popover
          open={isCustomPeriodOpen}
          onOpenChange={(open) => {
            if (open) {
              setCustomDateFrom(dateFrom)
              setCustomDateTo(dateTo)
            }
            setIsCustomPeriodOpen(open)
          }}
        >
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Personalizar período" title="Personalizar período">
              <MoreHorizontal className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 space-y-4">
            <div>
              <p className="font-medium">Personalizar período</p>
              <p className="text-sm text-muted-foreground">Elegí el rango de fechas.</p>
            </div>
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="period-filter-date-from">Desde</Label>
                <Input
                  id="period-filter-date-from"
                  type="date"
                  value={customDateFrom}
                  max={customDateTo || undefined}
                  onChange={(event) => setCustomDateFrom(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="period-filter-date-to">Hasta</Label>
                <Input
                  id="period-filter-date-to"
                  type="date"
                  value={customDateTo}
                  min={customDateFrom || undefined}
                  onChange={(event) => setCustomDateTo(event.target.value)}
                />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={applyCustomPeriod}
              disabled={!customDateFrom || !customDateTo || customDateFrom > customDateTo}
            >
              Aplicar período
            </Button>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
