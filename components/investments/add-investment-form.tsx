"use client"

import type React from "react"

import { useState } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ASSET_NAME_MAX_LENGTH,
  investmentTypeLabels,
  toastApiError,
  type CreateInvestmentPayload,
  type InvestmentType,
} from "@/lib/api"
import type { Currency } from "@/lib/api/transactions"

const currencyLabels: Record<Currency, string> = {
  ARS: "ARS ($)",
  USD: "USD ($)",
  EUR: "EUR (€)",
  BRL: "BRL (R$)",
}

function todayForDateInput(): string {
  return format(new Date(), "yyyy-MM-dd")
}

export function AddInvestmentForm({
  onAdd,
  onClose,
}: {
  onAdd: (payload: CreateInvestmentPayload) => Promise<void>
  onClose: () => void
}) {
  const [type, setType] = useState<InvestmentType | "">("")
  const [assetName, setAssetName] = useState("")
  const [investedAmount, setInvestedAmount] = useState("")
  const [currency, setCurrency] = useState<Currency>("ARS")
  const [purchasedOn, setPurchasedOn] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!type) {
      return
    }

    setIsSubmitting(true)
    try {
      await onAdd({
        assetName: assetName.trim(),
        type,
        investedAmount: Number(investedAmount),
        currency,
        purchasedOn,
      })
      onClose()
    } catch (error) {
      toastApiError(error, "No se pudo registrar la inversión.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="investment-type">Tipo de activo</Label>
        <Select value={type} onValueChange={(value) => setType(value as InvestmentType)} required>
          <SelectTrigger id="investment-type">
            <SelectValue placeholder="Seleccioná el tipo" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(investmentTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="investment-asset">Nombre del activo</Label>
        <Input
          id="investment-asset"
          placeholder="ej. AL30, Apple, Bitcoin"
          maxLength={ASSET_NAME_MAX_LENGTH}
          value={assetName}
          onChange={(e) => setAssetName(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="investment-amount">Capital invertido</Label>
          <Input
            id="investment-amount"
            type="number"
            placeholder="0.00"
            step="0.01"
            min="0.01"
            value={investedAmount}
            onChange={(e) => setInvestedAmount(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="investment-currency">Moneda</Label>
          <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
            <SelectTrigger id="investment-currency">
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
        <Label htmlFor="investment-date">Fecha de compra</Label>
        <Input
          id="investment-date"
          type="date"
          max={todayForDateInput()}
          value={purchasedOn}
          onChange={(e) => setPurchasedOn(e.target.value)}
          required
        />
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Agregar Inversión"}
        </Button>
      </div>
    </form>
  )
}
