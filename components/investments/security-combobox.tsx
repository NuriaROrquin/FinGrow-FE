"use client"

import type React from "react"

import { useId, useState } from "react"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

export interface SecurityOption {
  value: string
  label: string
  detail?: string | null
  trailing?: string
}

export function SecurityCombobox({
  id,
  value,
  options,
  isSearching,
  placeholder,
  maxLength,
  onValueChange,
  onSelect,
}: {
  id: string
  value: string
  options: SecurityOption[]
  isSearching: boolean
  placeholder?: string
  maxLength?: number
  onValueChange: (value: string) => void
  onSelect: (option: SecurityOption) => void
}) {
  const listId = useId()
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const showList = isOpen && options.length > 0
  const highlighted = showList && activeIndex >= 0 && activeIndex < options.length ? activeIndex : -1

  const select = (option: SecurityOption) => {
    onSelect(option)
    setIsOpen(false)
    setActiveIndex(-1)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((index) => Math.min(index + 1, options.length - 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === "Enter" && highlighted >= 0) {
      event.preventDefault()
      select(options[highlighted])
    }
  }

  return (
    <div className="relative">
      <Input
        id={id}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={highlighted >= 0 ? `${listId}-${highlighted}` : undefined}
        autoComplete="off"
        placeholder={placeholder}
        maxLength={maxLength}
        value={value}
        className={cn(isSearching && "pr-8")}
        onChange={(event) => {
          onValueChange(event.target.value)
          setIsOpen(true)
          setActiveIndex(-1)
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={handleKeyDown}
      />
      {isSearching && (
        <Spinner className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground" />
      )}
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === highlighted}
              title={option.detail ? `${option.label} · ${option.detail}` : option.label}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                index === highlighted && "bg-accent text-accent-foreground",
              )}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => select(option)}
            >
              <span className={cn("font-medium", option.detail ? "shrink-0" : "min-w-0 truncate")}>{option.label}</span>
              {option.detail && <span className="min-w-0 truncate text-muted-foreground">{option.detail}</span>}
              {option.trailing && (
                <span className="ml-auto shrink-0 pl-2 text-xs tabular-nums text-muted-foreground">{option.trailing}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
