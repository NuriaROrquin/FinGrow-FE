"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type {
  CreateTransactionPayload,
  Currency,
  ExpenseCategory,
  IncomeCategory,
  PaymentMethod,
} from "@/lib/api/transactions"

const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  Alimentos: "Alimentos",
  Transporte: "Transporte",
  Vivienda: "Vivienda",
  Servicios: "Servicios",
  Salud: "Salud",
  Educacion: "Educación",
  Entretenimiento: "Entretenimiento",
  Indumentaria: "Indumentaria",
  AhorroInversion: "Ahorro e Inversión",
  Otros: "Otros",
}

const incomeCategoryLabels: Record<IncomeCategory, string> = {
  Salario: "Salario",
  Freelance: "Freelance",
  Inversiones: "Inversiones",
  Regalo: "Regalo",
  Otros: "Otros",
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  Cash: "Efectivo",
  CreditCard: "Tarjeta de Crédito",
  DebitCard: "Tarjeta de Débito",
  BankTransfer: "Transferencia Bancaria",
  DigitalWallet: "Billetera Digital",
}

const currencyLabels: Record<Currency, string> = {
  ARS: "ARS ($)",
  USD: "USD ($)",
  EUR: "EUR (€)",
  BRL: "BRL (R$)",
}

export function AddTransactionForm({
  onAdd,
  onClose,
}: {
  onAdd: (payload: CreateTransactionPayload) => Promise<void>
  onClose: () => void
}) {
  const [transactionType, setTransactionType] = useState<"Income" | "Expense">("Expense")
  const [currency, setCurrency] = useState<Currency>("ARS")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [date, setDate] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const categoryLabels = transactionType === "Expense" ? expenseCategoryLabels : incomeCategoryLabels

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!paymentMethod) {
      return
    }

    setIsSubmitting(true)
    try {
      await onAdd({
        type: transactionType,
        amount: parseFloat(amount),
        currency,
        expenseCategory: transactionType === "Expense" ? (category as ExpenseCategory) : null,
        incomeCategory: transactionType === "Income" ? (category as IncomeCategory) : null,
        description,
        occurredOn: date,
        paymentMethod,
      })
      onClose()
    } catch (error) {
      toast({
        title: "No se pudo guardar la transacción",
        description: error instanceof Error ? error.message : "Intenta de nuevo en unos segundos.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs
        value={transactionType}
        onValueChange={(value) => {
          setTransactionType(value as "Income" | "Expense")
          setCategory("")
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
            onChange={(e) => setAmount(e.target.value)}
            required
          />
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
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categoría</Label>
        <Select value={category} onValueChange={setCategory} required>
          <SelectTrigger id="category">
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Fecha</Label>
        <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment">Método de Pago</Label>
        <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)} required>
          <SelectTrigger id="payment">
            <SelectValue placeholder="Selecciona método de pago" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(paymentMethodLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Agregar Transacción"}
        </Button>
      </div>
    </form>
  )
}
