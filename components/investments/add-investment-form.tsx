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
  SYMBOL_MAX_LENGTH,
  investmentTypeLabels,
  isQuotedOnExchange,
  toastApiError,
  type CreateInvestmentPayload,
  type InvestmentDto,
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

function quantityLabel(type: InvestmentType | ""): string {
  return type === "Bond" ? "Cantidad de nominales" : "Cantidad de unidades"
}

export function AddInvestmentForm({
  initialInvestment,
  onSubmit,
  onClose,
}: {
  initialInvestment?: InvestmentDto | null
  onSubmit: (payload: CreateInvestmentPayload) => Promise<void>
  onClose: () => void
}) {
  const isEditing = Boolean(initialInvestment)
  const [type, setType] = useState<InvestmentType | "">(initialInvestment?.type ?? "")
  const [assetName, setAssetName] = useState(initialInvestment?.assetName ?? "")
  const [investedAmount, setInvestedAmount] = useState(initialInvestment ? String(initialInvestment.investedAmount) : "")
  const [currency, setCurrency] = useState<Currency>(initialInvestment?.currency ?? "ARS")
  const [purchasedOn, setPurchasedOn] = useState(initialInvestment?.purchasedOn ?? "")
  const [symbol, setSymbol] = useState(initialInvestment?.symbol ?? "")
  const [quantity, setQuantity] = useState(initialInvestment?.quantity != null ? String(initialInvestment.quantity) : "")
  const [trackingError, setTrackingError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canBeQuoted = type !== "" && isQuotedOnExchange(type)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!type) {
      return
    }

    const trimmedSymbol = canBeQuoted ? symbol.trim().toUpperCase() : ""
    const trimmedQuantity = canBeQuoted ? quantity.trim() : ""

    if ((trimmedSymbol === "") !== (trimmedQuantity === "")) {
      setTrackingError("Para cotizar la inversión completá el símbolo y la cantidad, o dejá los dos vacíos.")
      return
    }

    setTrackingError(null)
    setIsSubmitting(true)
    try {
      await onSubmit({
        assetName: assetName.trim(),
        type,
        investedAmount: Number(investedAmount),
        currency,
        purchasedOn,
        symbol: trimmedSymbol || null,
        quantity: trimmedQuantity ? Number(trimmedQuantity) : null,
      })
      onClose()
    } catch (error) {
      toastApiError(error, isEditing ? "No se pudo actualizar la inversión." : "No se pudo registrar la inversión.")
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

      {canBeQuoted && (
        <div className="space-y-3 rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">Cotización automática (opcional)</p>
            <p className="text-xs text-muted-foreground">
              Con el símbolo y la cantidad le ponemos precio de mercado todos los días hábiles con el cierre de BYMA.
              Usá la variante de la moneda de la inversión: AL30 en pesos, AL30D en dólares.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="investment-symbol">Símbolo</Label>
              <Input
                id="investment-symbol"
                placeholder="ej. AL30, YPFD, SPY"
                maxLength={SYMBOL_MAX_LENGTH}
                pattern="[A-Za-z0-9]+"
                title="Solo letras y números"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="investment-quantity">{quantityLabel(type)}</Label>
              <Input
                id="investment-quantity"
                type="number"
                placeholder="0"
                step="any"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </div>
          {trackingError && <p className="text-sm text-destructive">{trackingError}</p>}
        </div>
      )}

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : isEditing ? "Guardar cambios" : "Agregar Inversión"}
        </Button>
      </div>
    </form>
  )
}
