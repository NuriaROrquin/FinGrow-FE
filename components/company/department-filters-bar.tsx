"use client"

import { SearchIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FilterField } from "@/components/company/filter-field"
import {
  departmentManagerLabels,
  departmentStaffLabels,
  departmentStatusLabels,
  hasActiveDepartmentFilters,
  type DepartmentFilterValues,
} from "@/components/company/department-filters"

function OptionsSelect<Value extends string>({
  id,
  value,
  labels,
  onChange,
}: {
  id: string
  value: Value
  labels: Record<Value, string>
  onChange: (value: Value) => void
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as Value)}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(labels) as [Value, string][]).map(([option, label]) => (
          <SelectItem key={option} value={option}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function DepartmentFiltersBar({
  values,
  onChange,
  onClear,
}: {
  values: DepartmentFilterValues
  onChange: (values: DepartmentFilterValues) => void
  onClear: () => void
}) {
  const update = <Key extends keyof DepartmentFilterValues>(key: Key, value: DepartmentFilterValues[Key]) =>
    onChange({ ...values, [key]: value })

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]">
      <FilterField id="department-filter-search" label="Buscar" className="col-span-2 lg:col-span-1">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="department-filter-search"
            className="pl-9"
            placeholder="Nombre o responsable"
            value={values.search}
            onChange={(event) => update("search", event.target.value)}
          />
        </div>
      </FilterField>

      <FilterField id="department-filter-status" label="Estado" className="col-span-2 sm:col-span-1">
        <OptionsSelect
          id="department-filter-status"
          value={values.status}
          labels={departmentStatusLabels}
          onChange={(status) => update("status", status)}
        />
      </FilterField>

      <FilterField id="department-filter-staff" label="Empleados" className="col-span-2 sm:col-span-1">
        <OptionsSelect
          id="department-filter-staff"
          value={values.staff}
          labels={departmentStaffLabels}
          onChange={(staff) => update("staff", staff)}
        />
      </FilterField>

      <FilterField id="department-filter-manager" label="Responsable" className="col-span-2 sm:col-span-1">
        <OptionsSelect
          id="department-filter-manager"
          value={values.manager}
          labels={departmentManagerLabels}
          onChange={(manager) => update("manager", manager)}
        />
      </FilterField>

      {hasActiveDepartmentFilters(values) && (
        <div className="col-span-2 flex items-end sm:col-span-1">
          <Button type="button" variant="ghost" className="w-full lg:w-auto" onClick={onClear}>
            <XIcon className="size-4" />
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  )
}
