"use client"

import type React from "react"

import { useState } from "react"
import { toast } from "sonner"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createBudget, isApiError, toastApiError, type BudgetDto } from "@/lib/api"
import { expenseCategoryLabels, type Currency, type ExpenseCategory } from "@/lib/api/transactions"
import { expenseCategoryIcons, formatYearMonth, type YearMonth } from "./budget-month"
import { usePreferences } from "@/lib/preferences-context"

const currencyLabels: Record<Currency, string> = {
  ARS: "ARS ($)",
  USD: "USD ($)",
  EUR: "EUR (€)",
  BRL: "BRL (R$)",
}

const allCategories = Object.keys(expenseCategoryLabels) as ExpenseCategory[]

interface LimitRow {
  key: number
  category: ExpenseCategory | ""
  amount: string
}

export function CreateBudgetForm({
  period,
  onCreated,
  onConflict,
  onClose,
}: {
  period: YearMonth
  onCreated: (budget: BudgetDto) => void
  onConflict: () => void
  onClose: () => void
}) {
  const { preferences } = usePreferences()
  const [currency, setCurrency] = useState<Currency>(preferences.currency)
  const [rows, setRows] = useState<LimitRow[]>([{ key: 0, category: "", amount: "" }])
  const [nextKey, setNextKey] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const usedCategories = new Set(rows.map((row) => row.category).filter(Boolean))

  const updateRow = (key: number, changes: Partial<Omit<LimitRow, "key">>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...changes } : row)))

  const addRow = () => {
    setRows((current) => [...current, { key: nextKey, category: "", amount: "" }])
    setNextKey((key) => key + 1)
  }

  const removeRow = (key: number) => setRows((current) => current.filter((row) => row.key !== key))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rows.some((row) => row.category === "")) {
      toast.error("Elegí una categoría en cada fila, o quitá las que no uses.")
      return
    }

    setIsSubmitting(true)
    try {
      const budget = await createBudget({
        year: period.year,
        month: period.month,
        currency,
        limits: rows.map((row) => ({
          category: row.category as ExpenseCategory,
          amount: parseFloat(row.amount),
        })),
      })
      onCreated(budget)
      toast.success(`Presupuesto de ${formatYearMonth(period)} creado`)
      onClose()
    } catch (error) {
      toastApiError(error, "No se pudo crear el presupuesto.")

      if (isApiError(error) && error.status === 409) {
        onConflict()
        onClose()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="budget-currency">Moneda</Label>
        <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
          <SelectTrigger id="budget-currency" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(currencyLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Todos los topes del presupuesto van en la misma moneda.</p>
      </div>

      <div className="space-y-2">
        <Label>Topes por categoría</Label>
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div key={row.key} className="flex items-center gap-2">
              <Select
                value={row.category}
                onValueChange={(value) => updateRow(row.key, { category: value as ExpenseCategory })}
              >
                <SelectTrigger aria-label={`Categoría ${index + 1}`} className="flex-1">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  {allCategories
                    .filter((category) => category === row.category || !usedCategories.has(category))
                    .map((category) => (
                      <SelectItem key={category} value={category}>
                        {expenseCategoryIcons[category]} {expenseCategoryLabels[category]}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Input
                aria-label={`Tope ${index + 1}`}
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0.01"
                className="w-36"
                value={row.amount}
                onChange={(e) => updateRow(row.key, { amount: e.target.value })}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Quitar categoría"
                onClick={() => removeRow(row.key)}
                disabled={rows.length === 1}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={rows.length >= allCategories.length}
        >
          <PlusIcon className="size-4" />
          Agregar categoría
        </Button>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Crear Presupuesto"}
        </Button>
      </div>
    </form>
  )
}