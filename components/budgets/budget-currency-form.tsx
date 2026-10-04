"use client"

import type React from "react"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { changeBudgetCurrency, isApiError, toastApiError, type BudgetDto } from "@/lib/api"
import type { Currency } from "@/lib/api/transactions"
import { currencyLabels, type YearMonth } from "./budget-month"

export function BudgetCurrencyForm({
  period,
  currentCurrency,
  onSaved,
  onBudgetMissing,
  onClose,
}: {
  period: YearMonth
  currentCurrency: Currency | null
  onSaved: (budget: BudgetDto) => void
  onBudgetMissing: () => void
  onClose: () => void
}) {
  const [currency, setCurrency] = useState<Currency | "">(currentCurrency ?? "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isUnchanged = currency === "" || currency === currentCurrency

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (currency === "" || currency === currentCurrency) return

    setIsSubmitting(true)
    try {
      const budget = await changeBudgetCurrency(period.year, period.month, currency)
      onSaved(budget)
      toast.success(`El presupuesto ahora está en ${currency}`)
      onClose()
    } catch (error) {
      toastApiError(error, "No se pudo cambiar la moneda.")

      if (isApiError(error) && error.status === 404) {
        onBudgetMissing()
        onClose()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="budget-new-currency">Moneda</Label>
        <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
          <SelectTrigger id="budget-new-currency" className="w-full">
            <SelectValue placeholder="Elegí una moneda" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(currencyLabels) as Currency[]).map((option) => (
              <SelectItem key={option} value={option}>
                {currencyLabels[option]}
                {option === currentCurrency ? " · actual" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        <li>Los montos de los límites se conservan: no se convierten a la moneda nueva.</li>
        <li>Lo gastado pasa a sumar solo tus movimientos en la moneda elegida.</li>
        <li>Tus movimientos no se modifican ni se borran.</li>
      </ul>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || isUnchanged}>
          {isSubmitting ? "Guardando..." : "Cambiar moneda"}
        </Button>
      </div>
    </form>
  )
}