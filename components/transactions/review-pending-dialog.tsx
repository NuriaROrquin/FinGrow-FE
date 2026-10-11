"use client"

import type React from "react"
import { useState } from "react"
import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfidenceBadge } from "@/components/transactions/confidence-badge"
import {
  expenseCategoryLabels,
  incomeCategoryLabels,
  paymentMethodLabels,
  type ConfirmTransactionPayload,
  type Currency,
  type ExpenseCategory,
  type IncomeCategory,
  type PaymentMethod,
  type PendingTransactionDto,
  type TransactionType,
} from "@/lib/api/transactions"
import { useMessages } from "@/lib/i18n"

const currencies: Currency[] = ["ARS", "USD", "EUR", "BRL"]

type FieldName = "amount" | "description" | "category" | "date" | "paymentMethod"

interface FormValues {
  type: TransactionType
  amount: string
  currency: Currency
  description: string
  category: string
  date: string
  paymentMethod: PaymentMethod | ""
}

function toFormValues(transaction: PendingTransactionDto): FormValues {
  return {
    type: transaction.type,
    amount: String(transaction.amount),
    currency: transaction.currency,
    description: transaction.description,
    category: transaction.category,
    date: String(transaction.occurredOn).slice(0, 10),
    paymentMethod: transaction.paymentMethod,
  }
}

export function ReviewPendingDialog({
  transaction,
  isSubmitting,
  onConfirm,
  onDiscard,
  onClose,
}: {
  transaction: PendingTransactionDto | null
  isSubmitting: boolean
  onConfirm: (transaction: PendingTransactionDto, payload: ConfirmTransactionPayload) => void
  onDiscard: (transaction: PendingTransactionDto) => void
  onClose: () => void
}) {
  const messages = useMessages()
  const t = messages.pendingInbox
  const [values, setValues] = useState<FormValues | null>(transaction ? toFormValues(transaction) : null)
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({})

  if (!transaction || !values) {
    return null
  }

  const categoryLabels: Record<string, string> = values.type === "Expense" ? expenseCategoryLabels : incomeCategoryLabels
  const sourceLabel = t.sources[transaction.source] ?? transaction.source
  const keepsAiSuggestion = values.type === transaction.type && values.category === transaction.category

  const update = (changes: Partial<FormValues>, clearedField?: FieldName) => {
    setValues((current) => (current ? { ...current, ...changes } : current))
    if (clearedField) {
      setErrors((current) => ({ ...current, [clearedField]: undefined }))
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    const amount = Number(values.amount)
    const description = values.description.trim()
    const nextErrors: Partial<Record<FieldName, string>> = {}

    if (!Number.isFinite(amount) || amount <= 0) nextErrors.amount = t.requiredAmount
    if (!description) nextErrors.description = t.requiredDescription
    if (!values.category || !(values.category in categoryLabels)) nextErrors.category = t.requiredCategory
    if (!values.date) nextErrors.date = t.requiredDate
    if (!values.paymentMethod) nextErrors.paymentMethod = t.requiredPaymentMethod

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0 || !values.paymentMethod) return

    onConfirm(transaction, {
      type: values.type,
      amount,
      currency: values.currency,
      expenseCategory: values.type === "Expense" ? (values.category as ExpenseCategory) : null,
      incomeCategory: values.type === "Income" ? (values.category as IncomeCategory) : null,
      description,
      occurredOn: values.date,
      paymentMethod: values.paymentMethod,
    })
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose()
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.reviewTitle}</DialogTitle>
          <DialogDescription>{t.reviewDescription(sourceLabel)}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Tabs
            value={values.type}
            onValueChange={(value) => update({ type: value as TransactionType, category: "" }, "category")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="Expense">{t.typeExpense}</TabsTrigger>
              <TabsTrigger value="Income">{t.typeIncome}</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="review-amount">{t.fieldAmount}</Label>
              <Input
                id="review-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={values.amount}
                onChange={(event) => update({ amount: event.target.value }, "amount")}
                aria-invalid={Boolean(errors.amount)}
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-currency">{t.fieldCurrency}</Label>
              <Select value={values.currency} onValueChange={(value) => update({ currency: value as Currency })}>
                <SelectTrigger id="review-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-description">{t.fieldDescription}</Label>
            <Input
              id="review-description"
              maxLength={300}
              value={values.description}
              onChange={(event) => update({ description: event.target.value }, "description")}
              aria-invalid={Boolean(errors.description)}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-category">{t.fieldCategory}</Label>
            <Select value={values.category} onValueChange={(value) => update({ category: value }, "category")}>
              <SelectTrigger id="review-category" aria-invalid={Boolean(errors.category)}>
                <SelectValue placeholder={t.categoryPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
            {keepsAiSuggestion && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {transaction.aiConfidenceLevel !== null && (
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="size-3" aria-hidden="true" />
                    {t.aiSuggested}
                  </span>
                )}
                <ConfidenceBadge level={transaction.aiConfidenceLevel} type={transaction.type} />
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="review-date">{t.fieldDate}</Label>
              <Input
                id="review-date"
                type="date"
                value={values.date}
                onChange={(event) => update({ date: event.target.value }, "date")}
                aria-invalid={Boolean(errors.date)}
              />
              {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-payment-method">{t.fieldPaymentMethod}</Label>
              <Select
                value={values.paymentMethod}
                onValueChange={(value) => update({ paymentMethod: value as PaymentMethod }, "paymentMethod")}
              >
                <SelectTrigger id="review-payment-method" aria-invalid={Boolean(errors.paymentMethod)}>
                  <SelectValue placeholder={t.paymentMethodPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentMethodLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.paymentMethod && <p className="text-xs text-destructive">{errors.paymentMethod}</p>}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="text-rose-600 hover:text-rose-700 dark:text-rose-300"
              onClick={() => onDiscard(transaction)}
              disabled={isSubmitting}
            >
              {t.discard}
            </Button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                {messages.common.cancel}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t.confirming : t.confirm}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
