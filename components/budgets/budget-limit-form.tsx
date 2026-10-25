"use client"

import type React from "react"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { isApiError, setBudgetLimit, toastApiError, type BudgetDto } from "@/lib/api"
import type { ExpenseCategory } from "@/lib/api/transactions"
import { useMessages, type Messages } from "@/lib/i18n"
import { expenseCategoryIcons, type YearMonth } from "./budget-month"

function validateAmount(raw: string, t: Messages["budgets"]): string | null {
  if (raw.trim() === "") {
    return t.limitRequired
  }

  const amount = Number(raw)

  if (!Number.isFinite(amount)) {
    return t.limitNotNumber
  }

  if (amount <= 0) {
    return t.limitNotPositive
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
  category?: ExpenseCategory
  initialAmount?: number
  availableCategories?: ExpenseCategory[]
  onSaved: (budget: BudgetDto) => void
  onBudgetMissing: () => void
  onClose: () => void
}) {
  const messages = useMessages()
  const t = messages.budgets
  const categoryLabels = messages.labels.expenseCategories
  const isEditing = fixedCategory !== undefined
  const [category, setCategory] = useState<ExpenseCategory | "">(fixedCategory ?? "")
  const [amount, setAmount] = useState(initialAmount !== undefined ? String(initialAmount) : "")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (category === "") {
      setError(t.pickCategory)
      return
    }

    const amountError = validateAmount(amount, t)
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
        isEditing ? t.limitUpdated(categoryLabels[category]) : t.limitAdded(categoryLabels[category]),
      )
      onClose()
    } catch (err) {
      if (isApiError(err) && err.status === 400) {
        setError(err.description)
        return
      }

      toastApiError(err, t.limitSaveFailed)

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
          <span className="font-medium">{categoryLabels[fixedCategory]}</span>
        </p>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="limit-category">{t.category}</Label>
          <Select
            value={category}
            onValueChange={(value) => {
              setCategory(value as ExpenseCategory)
              setError(null)
            }}
          >
            <SelectTrigger id="limit-category" className="w-full">
              <SelectValue placeholder={t.pickCategoryPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {availableCategories.map((option) => (
                <SelectItem key={option} value={option}>
                  {expenseCategoryIcons[option]} {categoryLabels[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="limit-amount">{t.monthlyLimit}{currency ? ` (${currency})` : ""}</Label>
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
          {messages.common.cancel}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t.saving : t.save}
        </Button>
      </div>
    </form>
  )
}