"use client"

import type React from "react"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { isApiError, setBudgetLimit, toastApiError, type BudgetDto } from "@/lib/api"
import { expenseCategoryLabels, type ExpenseCategory } from "@/lib/api/transactions"
import { expenseCategoryIcons, type YearMonth } from "./budget-month"

/**
 * Devuelve el mensaje de error del monto, o `null` si es válido.
 *
 * Es la misma regla que aplica el backend; se repite acá para avisar antes de mandar la
 * request. Si el backend igual rechaza el valor, se muestra su mensaje en el mismo lugar.
 */
function validateAmount(raw: string): string | null {
  if (raw.trim() === "") {
    return "Ingresá el límite de la categoría."
  }

  const amount = Number(raw)

  if (!Number.isFinite(amount)) {
    return "El límite tiene que ser un número."
  }

  if (amount <= 0) {
    return "El límite tiene que ser un número mayor a cero."
  }

  return null
}

export function BudgetLimitForm({
  period,
  currency,
  category: fixedCategory,
  initialAmount,
  availableCategories = [],
  onSaved,
  onBudgetMissing,
  onClose,
}: {
  period: YearMonth
  currency: string | null
  /** Categoría que se edita. Sin ella, el formulario agrega una categoría nueva. */
  category?: ExpenseCategory
  initialAmount?: number
  /** Categorías que todavía no tienen límite; solo se usan al agregar. */
  availableCategories?: ExpenseCategory[]
  onSaved: (budget: BudgetDto) => void
  /** El presupuesto ya no existe (por ejemplo, se borró desde otra pestaña). */
  onBudgetMissing: () => void
  onClose: () => void
}) {
  const isEditing = fixedCategory !== undefined
  const [category, setCategory] = useState<ExpenseCategory | "">(fixedCategory ?? "")
  const [amount, setAmount] = useState(initialAmount !== undefined ? String(initialAmount) : "")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (category === "") {
      setError("Elegí una categoría.")
      return
    }

    const amountError = validateAmount(amount)
    if (amountError) {
      setError(amountError)
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      const budget = await setBudgetLimit(period.year, period.month, { category, amount: Number(amount) })
      onSaved(budget)
      toast.success(
        isEditing
          ? `Límite de ${expenseCategoryLabels[category]} actualizado`
          : `Límite de ${expenseCategoryLabels[category]} agregado`,
      )
      onClose()
    } catch (err) {
      if (isApiError(err) && err.status === 400) {
        setError(err.description)
        return
      }

      toastApiError(err, "No se pudo guardar el límite.")

      if (isApiError(err) && err.status === 404) {
        onBudgetMissing()
        onClose()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {fixedCategory !== undefined ? (
        <p className="flex items-center gap-2 text-sm">
          <span className="text-2xl">{expenseCategoryIcons[fixedCategory]}</span>
          <span className="font-medium">{expenseCategoryLabels[fixedCategory]}</span>
        </p>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="limit-category">Categoría</Label>
          <Select
            value={category}
            onValueChange={(value) => {
              setCategory(value as ExpenseCategory)
              setError(null)
            }}
          >
            <SelectTrigger id="limit-category" className="w-full">
              <SelectValue placeholder="Elegí una categoría" />
            </SelectTrigger>
            <SelectContent>
              {availableCategories.map((option) => (
                <SelectItem key={option} value={option}>
                  {expenseCategoryIcons[option]} {expenseCategoryLabels[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="limit-amount">Límite mensual{currency ? ` (${currency})` : ""}</Label>
        <Input
          id="limit-amount"
          type="number"
          inputMode="decimal"
          placeholder="0.00"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value)
            setError(null)
          }}
          aria-invalid={error !== null}
          aria-describedby={error ? "limit-error" : undefined}
        />
        {error && (
          <p id="limit-error" role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  )
}