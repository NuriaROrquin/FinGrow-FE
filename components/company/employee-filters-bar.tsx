"use client"

import { useState } from "react"
import { ChevronsUpDown, SearchIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FilterField } from "@/components/company/filter-field"
import {
  hasActiveFilters,
  lastLoginFilterLabels,
  NO_DEPARTMENT_FILTER,
  statusFilterLabels,
  type EmployeeFilterValues,
  type EmployeeStatusFilter,
  type LastLoginFilter,
} from "@/components/company/employee-filters"

export interface DepartmentFilterOption {
  id: string
  name: string
  employees: number
  isActive: boolean
}

function departmentsSummary(selected: string[], options: DepartmentFilterOption[]): string {
  if (selected.length === 0) {
    return "Todos"
  }

  if (selected.length > 2) {
    return `${selected.length} departamentos`
  }

  return options
    .filter((option) => selected.includes(option.id))
    .map((option) => option.name)
    .join(", ")
}

export function EmployeeFiltersBar({
  values,
  departmentOptions,
  onChange,
  onClear,
  error,
}: {
  values: EmployeeFilterValues
  departmentOptions: DepartmentFilterOption[]
  onChange: (values: EmployeeFilterValues) => void
  onClear: () => void
  error: string | null
}) {
  const [isDepartmentPickerOpen, setIsDepartmentPickerOpen] = useState(false)

  const update = <Key extends keyof EmployeeFilterValues>(key: Key, value: EmployeeFilterValues[Key]) =>
    onChange({ ...values, [key]: value })

  const toggleDepartment = (id: string) =>
    update(
      "departments",
      values.departments.includes(id)
        ? values.departments.filter((department) => department !== id)
        : [...values.departments, id],
    )

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 2xl:grid-cols-[minmax(0,2fr)_repeat(5,minmax(0,1fr))_auto]">
        <div className="col-span-2 2xl:col-span-1">
          <FilterField id="employee-filter-search" label="Buscar">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="employee-filter-search"
                className="pl-9"
                placeholder="Nombre, email o teléfono"
                value={values.search}
                onChange={(event) => update("search", event.target.value)}
              />
            </div>
          </FilterField>
        </div>

        <FilterField id="employee-filter-department" label="Departamento">
          <Popover open={isDepartmentPickerOpen} onOpenChange={setIsDepartmentPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                id="employee-filter-department"
                variant="outline"
                role="combobox"
                aria-expanded={isDepartmentPickerOpen}
                className="w-full justify-between font-normal"
              >
                <span className="truncate">{departmentsSummary(values.departments, departmentOptions)}</span>
                <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[240px] p-0" align="start">
              <Command>
                {departmentOptions.length > 6 && <CommandInput placeholder="Buscar departamento..." />}
                <CommandList>
                  <CommandEmpty>No hay departamentos con ese nombre.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem value="Todos" onSelect={() => update("departments", [])}>
                      <Checkbox checked={values.departments.length === 0} tabIndex={-1} />
                      Todos
                    </CommandItem>
                    {departmentOptions.map((option) => (
                      <CommandItem
                        key={option.id}
                        value={option.name}
                        onSelect={() => toggleDepartment(option.id)}
                      >
                        <Checkbox checked={values.departments.includes(option.id)} tabIndex={-1} />
                        <span className={option.id === NO_DEPARTMENT_FILTER ? "italic" : undefined}>{option.name}</span>
                        {!option.isActive && <span className="text-xs text-muted-foreground">(inactivo)</span>}
                        <span className="ml-auto text-xs tabular-nums text-muted-foreground">{option.employees}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </FilterField>

        <FilterField id="employee-filter-status" label="Estado">
          <Select value={values.status} onValueChange={(value) => update("status", value as EmployeeStatusFilter)}>
            <SelectTrigger id="employee-filter-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusFilterLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField id="employee-filter-last-login" label="Último ingreso" className="col-span-2 sm:col-span-1">
          <Select value={values.lastLogin} onValueChange={(value) => update("lastLogin", value as LastLoginFilter)}>
            <SelectTrigger id="employee-filter-last-login" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(lastLoginFilterLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField id="employee-filter-hired-from" label="Alta desde" className="col-span-2 sm:col-span-1">
          <Input
            id="employee-filter-hired-from"
            type="date"
            max={values.hiredTo || undefined}
            value={values.hiredFrom}
            onChange={(event) => update("hiredFrom", event.target.value)}
          />
        </FilterField>

        <FilterField id="employee-filter-hired-to" label="Alta hasta" className="col-span-2 sm:col-span-1">
          <Input
            id="employee-filter-hired-to"
            type="date"
            min={values.hiredFrom || undefined}
            value={values.hiredTo}
            onChange={(event) => update("hiredTo", event.target.value)}
          />
        </FilterField>

        {hasActiveFilters(values) && (
          <div className="col-span-2 flex items-end sm:col-span-1">
            <Button type="button" variant="ghost" className="w-full lg:w-auto" onClick={onClear}>
              <XIcon className="size-4" />
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
