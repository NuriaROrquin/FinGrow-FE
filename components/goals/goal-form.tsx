"use client"

import type React from "react"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { currencyLabels } from "@/components/budgets/budget-month"
import { createGoal, GOAL_NAME_MAX_LENGTH, toastApiError, updateGoal, type GoalDto } from "@/lib/api"
import type { Currency } from "@/lib/api/transactions"
import { useMessages } from "@/lib/i18n"
import { usePreferences } from "@/lib/preferences-context"

function todayLocal(): string {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60 * 1000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10)
}

export function GoalForm({
  goal,
  onSaved,
  onClose,
}: {
  goal?: GoalDto
  onSaved?: (goal: GoalDto) => void
  onClose: () => void
}) {
  const messages = useMessages()
  const t = messages.goals
  const isEditing = goal !== undefined
  const { preferences } = usePreferences()
  const [name, setName] = useState(goal?.name ?? "")
  const [targetAmount, setTargetAmount] = useState(goal ? String(goal.targetAmount) : "")
  const [currency, setCurrency] = useState<Currency>(goal?.currency ?? preferences.currency)
  const [deadline, setDeadline] = useState(goal?.deadline ?? "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    try {
      const details = { name: name.trim(), targetAmount: parseFloat(targetAmount), deadline }
      const saved = isEditing
        ? await updateGoal(goal.id, details)
        : await createGoal({ ...details, currency })
      onSaved?.(saved)
      toast.success(isEditing ? t.updated(saved.name) : t.created(saved.name))
      onClose()
    } catch (error) {
      // Si el validador del backend rechaza la fecha o el monto, el mensaje ya viene en castellano.
      toastApiError(error, isEditing ? t.updateFailed : t.createFailed)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="goal-name">{t.name}</Label>
        <Input
          id="goal-name"
          placeholder={t.namePlaceholder}
          maxLength={GOAL_NAME_MAX_LENGTH}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="goal-target">{t.targetAmount}</Label>
          <Input
            id="goal-target"
            type="number"
            placeholder="0.00"
            step="0.01"
            min="0.01"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal-currency">{t.currency}</Label>
          <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)} disabled={isEditing}>
            <SelectTrigger id="goal-currency" title={isEditing ? t.currencyLocked : undefined}>
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
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="goal-deadline">{t.deadline}</Label>
        <Input
          id="goal-deadline"
          type="date"
          min={todayLocal()}
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          required
        />
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          {messages.common.cancel}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t.saving : isEditing ? t.saveChanges : t.create}
        </Button>
      </div>
    </form>
  )
}
