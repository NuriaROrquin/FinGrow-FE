"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ReceiptField, type UploadedReceipt } from "@/components/transactions/receipt-field"
import { useToast } from "@/hooks/use-toast"
import {
  type CreateTransactionPayload,
  type Currency,
  type ExpenseCategory,
  type IncomeCategory,
  type PaymentMethod,
  type TransactionStatus,
  type TransactionDto,
} from "@/lib/api/transactions"
import { isApiError } from "@/lib/api/errors"
import { useMessages } from "@/lib/i18n"
import { usePreferences } from "@/lib/preferences-context"

const currencyLabels: Record<Currency, string> = {
  ARS: "ARS ($)",
  USD: "USD ($)",
  EUR: "EUR (€)",
  BRL: "BRL (R$)",
}

function getInitialFormValues(transaction: TransactionDto | null | undefined, defaultCurrency: Currency) {
  if (!transaction) {
    return {
      transactionType: "Expense" as const,
      currency: defaultCurrency,
      amount: "",
      description: "",
      category: "",
      date: "",
      paymentMethod: "" as PaymentMethod | "",
    }
  }

  return {
    transactionType: transaction.type,
    currency: transaction.currency,
    amount: String(transaction.amount),
    description: transaction.description,
    category: transaction.category,
    date: String(transaction.occurredOn).slice(0, 10),
    paymentMethod: transaction.paymentMethod as PaymentMethod | "",
  }
}

export function AddTransactionForm({
  mode = "create",
  initialTransaction = null,
  preloadedReceipt = null,
  onSubmit,
  onClose,
}: {
  mode?: "create" | "edit"
  initialTransaction?: TransactionDto | null
  preloadedReceipt?: UploadedReceipt | null
  onSubmit: (payload: CreateTransactionPayload, options: { removeReceipt: boolean }) => Promise<void>
  onClose: () => void
}) {
  const [transactionType, setTransactionType] = useState<"Income" | "Expense">(
    initialTransaction?.type ?? "Expense",
  )
  const { preferences } = usePreferences()
  const [currency, setCurrency] = useState<Currency>(initialTransaction?.currency ?? preferences.currency)
  const [amount, setAmount] = useState(initialTransaction ? String(initialTransaction.amount) : "")
  const [description, setDescription] = useState(initialTransaction?.description ?? "")
  const [category, setCategory] = useState(
    initialTransaction ? getInitialFormValues(initialTransaction, preferences.currency).category : "",
  )
  const [date, setDate] = useState(initialTransaction ? String(initialTransaction.occurredOn).slice(0, 10) : "")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">(initialTransaction?.paymentMethod ?? "")
  const [status, setStatus] = useState<TransactionStatus>(initialTransaction?.status ?? "Confirmed")
  const [lockedStatus, setLockedStatus] = useState<TransactionStatus | null>(
    initialTransaction?.status === "Confirmed" ? "Confirmed" : null,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [receiptId, setReceiptId] = useState<string | null>(preloadedReceipt?.id ?? null)
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false)
  const [removesExistingReceipt, setRemovesExistingReceipt] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const { toast } = useToast()
  const t = useMessages()

  const categoryLabels = transactionType === "Expense" ? t.labels.expenseCategories : t.labels.incomeCategories

  useEffect(() => {
    const nextValues = getInitialFormValues(initialTransaction, preferences.currency)
    setTransactionType(nextValues.transactionType)
    setCurrency(nextValues.currency)
    setAmount(nextValues.amount)
    setDescription(nextValues.description)
    setCategory(nextValues.category)
    setDate(nextValues.date)
    setPaymentMethod(nextValues.paymentMethod)
    setStatus(initialTransaction?.status ?? "Confirmed")
    setLockedStatus(initialTransaction?.status === "Confirmed" ? "Confirmed" : null)
    setFieldErrors({})
    setGeneralError(null)
    setReceiptId(preloadedReceipt?.id ?? null)
    setIsUploadingReceipt(false)
    setRemovesExistingReceipt(false)
  }, [initialTransaction, preloadedReceipt, preferences.currency])

  const handleCategoryChange = (nextCategory: string) => {
    setCategory(nextCategory)
    setFieldErrors((previous) => ({ ...previous, category: "" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!paymentMethod) {
      setFieldErrors((previous) => ({ ...previous, paymentMethod: "Seleccioná un método de pago." }))
      return
    }

    if (mode === "edit" && lockedStatus === "Confirmed" && status !== "Confirmed") {
      setGeneralError("Una transacción confirmada no puede volver a estado Pending.")
      return
    }

    setIsSubmitting(true)
    setFieldErrors({})
    setGeneralError(null)

    try {
      await onSubmit({
        type: transactionType,
        amount: Number(amount),
        currency,
        expenseCategory: transactionType === "Expense" ? (category as ExpenseCategory) : null,
        incomeCategory: transactionType === "Income" ? (category as IncomeCategory) : null,
        description: description.trim(),
        occurredOn: date,
        paymentMethod,
        status: mode === "edit" ? status : "Confirmed",
        ...(receiptId ? { receiptId } : {}),
      }, { removeReceipt: removesExistingReceipt && !receiptId })

      onClose()
    } catch (error) {
      if (isApiError(error)) {
        const nextFieldErrors = Object.fromEntries(
          Object.entries(error.fieldErrors ?? {}).map(([key, values]) => [key, values[0]]),
        )

        if (Object.keys(nextFieldErrors).length > 0) {
          setFieldErrors(nextFieldErrors)
          setGeneralError(null)
        } else {
          setFieldErrors({})
          setGeneralError(error.description)
        }

        if (error.status === 404) {
          toast({
            title: "Movimiento no encontrado",
            description: "El movimiento no existe o no pertenece a este usuario.",
            variant: "destructive",
          })
        } else if (error.status === 400 && Object.keys(nextFieldErrors).length > 0) {
          toast({
            title: "Validación del formulario",
            description: "Revisá los campos marcados antes de guardar.",
            variant: "destructive",
          })
        } else {
          toast({
            title: mode === "edit" ? "No se pudo actualizar la transacción" : "No se pudo guardar la transacción",
            description: error.description,
            variant: "destructive",
          })
        }

        return
      }

      const message = error instanceof Error ? error.message : "Intenta de nuevo en unos segundos."
      setGeneralError(message)
      toast({
        title: mode === "edit" ? "No se pudo actualizar la transacción" : "No se pudo guardar la transacción",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {generalError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {generalError}
        </div>
      )}

      <Tabs
        value={transactionType}
        onValueChange={(value) => {
          const nextType = value as "Income" | "Expense"
          setTransactionType(nextType)
          setCategory("")
          setFieldErrors((previous) => ({ ...previous, category: "" }))
        }}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="Expense">Gasto</TabsTrigger>
          <TabsTrigger value="Income">Ingreso</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="amount">Monto</Label>
          <Input
            id="amount"
            type="number"
            placeholder="0.00"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setFieldErrors((previous) => ({ ...previous, amount: "" }))
            }}
            aria-invalid={Boolean(fieldErrors.amount)}
          />
          {fieldErrors.amount && <p className="text-xs text-destructive">{fieldErrors.amount}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Moneda</Label>
          <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
            <SelectTrigger id="currency">
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
        <Label htmlFor="description">Descripción</Label>
        <Input
          id="description"
          placeholder="Ingresa descripción"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
            setFieldErrors((previous) => ({ ...previous, description: "" }))
          }}
          aria-invalid={Boolean(fieldErrors.description)}
        />
        {fieldErrors.description && <p className="text-xs text-destructive">{fieldErrors.description}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categoría</Label>
        <Select value={category} onValueChange={handleCategoryChange}>
          <SelectTrigger id="category" aria-invalid={Boolean(fieldErrors.category)}>
            <SelectValue placeholder="Selecciona categoría" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors.category && <p className="text-xs text-destructive">{fieldErrors.category}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Fecha</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value)
            setFieldErrors((previous) => ({ ...previous, occurredOn: "" }))
          }}
          aria-invalid={Boolean(fieldErrors.occurredOn)}
        />
        {fieldErrors.occurredOn && <p className="text-xs text-destructive">{fieldErrors.occurredOn}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment">Método de Pago</Label>
        <Select
          value={paymentMethod}
          onValueChange={(value) => {
            setPaymentMethod(value as PaymentMethod)
            setFieldErrors((previous) => ({ ...previous, paymentMethod: "" }))
          }}
        >
          <SelectTrigger id="payment" aria-invalid={Boolean(fieldErrors.paymentMethod)}>
            <SelectValue placeholder="Selecciona método de pago" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(t.labels.paymentMethods).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors.paymentMethod && <p className="text-xs text-destructive">{fieldErrors.paymentMethod}</p>}
      </div>

      <ReceiptField
        key={initialTransaction?.id ?? preloadedReceipt?.id ?? "new"}
        existingReceiptId={mode === "edit" ? initialTransaction?.receiptId ?? null : null}
        uploaded={mode === "create" ? preloadedReceipt : null}
        onChange={setReceiptId}
        onRemoveExisting={() => setRemovesExistingReceipt(true)}
        onUploadingChange={setIsUploadingReceipt}
        disabled={isSubmitting}
      />

      {mode === "edit" && (
        <div className="space-y-2 rounded-md border border-border/70 bg-muted/30 p-3">
          <Label htmlFor="transaction-status">Estado</Label>
          <div className="flex items-center gap-3">
            <span className={`text-sm ${status === "Pending" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              Pendiente
            </span>
            <Switch
              id="transaction-status"
              checked={status === "Confirmed"}
              disabled={isSubmitting || lockedStatus === "Confirmed"}
              onCheckedChange={(checked) => {
                if (lockedStatus === "Confirmed" && !checked) {
                  return
                }

                setStatus(checked ? "Confirmed" : "Pending")
              }}
              aria-label="Cambiar estado de la transacción"
            />
            <span className={`text-sm ${status === "Confirmed" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              Confirmada
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {lockedStatus === "Confirmed"
              ? "Esta transacción ya está confirmada y no puede volver a pendiente."
              : "Puedes pasar de pendiente a confirmada."}
          </p>
        </div>
      )}

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || isUploadingReceipt}>
          {isSubmitting
            ? "Guardando..."
            : isUploadingReceipt
              ? "Subiendo comprobante..."
              : mode === "edit"
                ? "Guardar cambios"
                : "Agregar Transacción"}
        </Button>
      </div>
    </form>
  )
}
