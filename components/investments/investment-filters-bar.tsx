"use client"

import type React from "react"

import { SearchIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ASSET_NAME_MAX_LENGTH,
  investmentSortFieldLabels,
  investmentTypeLabels,
  type InvestmentListQuery,
  type InvestmentPerformance,
  type InvestmentSortField,
  type InvestmentType,
  type SortDirection,
} from "@/lib/api"
import type { Currency } from "@/lib/api/transactions"

export interface InvestmentFilterValues {
  search: string
  type: InvestmentType | "all"
  currency: Currency | "all"
  quote: "all" | "quoted" | "unquoted"
  performance: InvestmentPerformance | "all"
  purchasedFrom: string
  purchasedTo: string
  minInvested: string
  maxInvested: string
  sortBy: InvestmentSortField
  sortDirection: SortDirection
}

export const defaultInvestmentFilters: InvestmentFilterValues = {
  search: "",
  type: "all",
  currency: "all",
  quote: "all",
  performance: "all",
  purchasedFrom: "",
  purchasedTo: "",
  minInvested: "",
  maxInvested: "",
  sortBy: "PurchasedOn",
  sortDirection: "Descending",
}

const currencyOptions: Currency[] = ["ARS", "USD", "EUR", "BRL"]

const quoteLabels: Record<InvestmentFilterValues["quote"], string> = {
  all: "Todas",
  quoted: "Solo cotizadas",
  unquoted: "Solo sin cotizar",
}

const performanceLabels: Record<InvestmentFilterValues["performance"], string> = {
  all: "Todos",
  Gain: "Con ganancia",
  Loss: "Con pérdida",
}

const sortDirectionLabels: Record<SortDirection, string> = {
  Descending: "Descendente",
  Ascending: "Ascendente",
}

function toAmount(value: string): number | undefined {
  if (value.trim() === "") {
    return undefined
  }

  const amount = Number(value)
  return Number.isFinite(amount) ? amount : undefined
}

export function hasActiveFilters(values: InvestmentFilterValues): boolean {
  return (
    values.search.trim() !== "" ||
    values.type !== "all" ||
    values.currency !== "all" ||
    values.quote !== "all" ||
    values.performance !== "all" ||
    values.purchasedFrom !== "" ||
    values.purchasedTo !== "" ||
    values.minInvested.trim() !== "" ||
    values.maxInvested.trim() !== ""
  )
}

export function filtersError(values: InvestmentFilterValues): string | null {
  if (values.purchasedFrom && values.purchasedTo && values.purchasedFrom > values.purchasedTo) {
    return "La fecha de compra desde no puede ser posterior a la fecha hasta."
  }

  const minInvested = toAmount(values.minInvested)
  const maxInvested = toAmount(values.maxInvested)

  if ((minInvested ?? 0) < 0 || (maxInvested ?? 0) < 0) {
    return "El capital no puede ser negativo."
  }

  if (minInvested !== undefined && maxInvested !== undefined && minInvested > maxInvested) {
    return "El capital mínimo no puede ser mayor que el máximo."
  }

  return null
}

export function toListQuery(
  values: InvestmentFilterValues,
  pageNumber: number,
  pageSize: number,
): InvestmentListQuery {
  return {
    pageNumber,
    pageSize,
    search: values.search.trim() || undefined,
    type: values.type === "all" ? undefined : values.type,
    currency: values.currency === "all" ? undefined : values.currency,
    purchasedFrom: values.purchasedFrom || undefined,
    purchasedTo: values.purchasedTo || undefined,
    minInvested: toAmount(values.minInvested),
    maxInvested: toAmount(values.maxInvested),
    quoted: values.quote === "all" ? undefined : values.quote === "quoted",
    performance: values.performance === "all" ? undefined : values.performance,
    sortBy: values.sortBy,
    sortDirection: values.sortDirection,
  }
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  )
}

export function InvestmentFiltersBar({
  values,
  onChange,
  onClear,
  error,
}: {
  values: InvestmentFilterValues
  onChange: (values: InvestmentFilterValues) => void
  onClear: () => void
  error: string | null
}) {
  const update = <Key extends keyof InvestmentFilterValues>(key: Key, value: InvestmentFilterValues[Key]) =>
    onChange({ ...values, [key]: value })

  return (
    <div className="mb-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <div className="sm:col-span-2">
          <Field id="investment-filter-search" label="Buscar">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="investment-filter-search"
                className="pl-9"
                placeholder="Nombre del activo"
                maxLength={ASSET_NAME_MAX_LENGTH}
                value={values.search}
                onChange={(event) => update("search", event.target.value)}
              />
            </div>
          </Field>
        </div>

        <Field id="investment-filter-type" label="Tipo de activo">
          <Select value={values.type} onValueChange={(value) => update("type", value as InvestmentFilterValues["type"])}>
            <SelectTrigger id="investment-filter-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(investmentTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field id="investment-filter-currency" label="Moneda">
          <Select
            value={values.currency}
            onValueChange={(value) => update("currency", value as InvestmentFilterValues["currency"])}
          >
            <SelectTrigger id="investment-filter-currency" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {currencyOptions.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field id="investment-filter-quote" label="Cotización">
          <Select value={values.quote} onValueChange={(value) => update("quote", value as InvestmentFilterValues["quote"])}>
            <SelectTrigger id="investment-filter-quote" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(quoteLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field id="investment-filter-performance" label="Resultado">
          <Select
            value={values.performance}
            onValueChange={(value) => update("performance", value as InvestmentFilterValues["performance"])}
          >
            <SelectTrigger id="investment-filter-performance" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(performanceLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field id="investment-filter-from" label="Compra desde">
          <Input
            id="investment-filter-from"
            type="date"
            value={values.purchasedFrom}
            onChange={(event) => update("purchasedFrom", event.target.value)}
          />
        </Field>

        <Field id="investment-filter-to" label="Compra hasta">
          <Input
            id="investment-filter-to"
            type="date"
            value={values.purchasedTo}
            onChange={(event) => update("purchasedTo", event.target.value)}
          />
        </Field>

        <Field id="investment-filter-min" label="Capital mínimo">
          <Input
            id="investment-filter-min"
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={values.minInvested}
            onChange={(event) => update("minInvested", event.target.value)}
          />
        </Field>

        <Field id="investment-filter-max" label="Capital máximo">
          <Input
            id="investment-filter-max"
            type="number"
            min="0"
            step="0.01"
            placeholder="Sin límite"
            value={values.maxInvested}
            onChange={(event) => update("maxInvested", event.target.value)}
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Field id="investment-filter-sort" label="Ordenar por">
          <Select value={values.sortBy} onValueChange={(value) => update("sortBy", value as InvestmentSortField)}>
            <SelectTrigger id="investment-filter-sort" className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(investmentSortFieldLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field id="investment-filter-direction" label="Dirección">
          <Select
            value={values.sortDirection}
            onValueChange={(value) => update("sortDirection", value as SortDirection)}
          >
            <SelectTrigger id="investment-filter-direction" className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(sortDirectionLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {hasActiveFilters(values) && (
          <Button type="button" variant="ghost" onClick={onClear}>
            <XIcon className="size-4" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
