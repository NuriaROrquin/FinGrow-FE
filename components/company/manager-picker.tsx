"use client"

import { useMemo, useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { CompanyEmployeeDto, DepartmentManagerDto } from "@/lib/api"
import { useMessages } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface ManagerOption {
  id: string
  fullName: string
  email: string | null
  departmentName: string | null
  isActive: boolean
}

export function ManagerPicker({
  id,
  employees,
  currentManager,
  value,
  onChange,
  disabled,
}: {
  id: string
  employees: CompanyEmployeeDto[]
  currentManager: DepartmentManagerDto | null
  value: string | null
  onChange: (managerId: string | null) => void
  disabled?: boolean
}) {
  const t = useMessages().departments
  const [open, setOpen] = useState(false)

  const options = useMemo<ManagerOption[]>(() => {
    const active = employees
      .filter((employee) => employee.isActive)
      .map((employee) => ({
        id: employee.id,
        fullName: employee.fullName,
        email: employee.email,
        departmentName: employee.departmentName,
        isActive: true,
      }))

    const keepsCurrent = currentManager !== null && !active.some((option) => option.id === currentManager.id)
    const current = keepsCurrent
      ? [{ id: currentManager.id, fullName: currentManager.fullName, email: null, departmentName: null, isActive: currentManager.isActive }]
      : []

    return [...current, ...active].sort((a, b) => a.fullName.localeCompare(b.fullName, "es", { sensitivity: "base" }))
  }, [employees, currentManager])

  const selected = options.find((option) => option.id === value) ?? null

  const choose = (managerId: string | null) => {
    onChange(managerId)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? selected.fullName : t.noManager}
            {selected && !selected.isActive && <span className="text-muted-foreground">{t.withoutAccess}</span>}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[260px] p-0" align="start">
        <Command>
          <CommandInput placeholder={t.searchManager} />
          <CommandList>
            <CommandEmpty>{t.noActiveEmployees}</CommandEmpty>
            <CommandGroup>
              <CommandItem value={t.noManager} onSelect={() => choose(null)}>
                <Check className={cn("size-4", value === null ? "opacity-100" : "opacity-0")} />
                <span className="italic">{t.noManager}</span>
              </CommandItem>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={`${option.fullName} ${option.email ?? ""}`}
                  onSelect={() => choose(option.id)}
                >
                  <Check className={cn("size-4", value === option.id ? "opacity-100" : "opacity-0")} />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">
                      {option.fullName}
                      {!option.isActive && <span className="text-muted-foreground">{t.withoutAccess}</span>}
                    </span>
                    {(option.email || option.departmentName) && (
                      <span className="truncate text-xs text-muted-foreground">
                        {[option.email, option.departmentName].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
