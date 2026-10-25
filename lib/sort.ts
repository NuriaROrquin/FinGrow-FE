export type SortDirection = "asc" | "desc"

export interface SortState<Field extends string> {
  field: Field
  direction: SortDirection
}

export type SortValue = string | number | Date | null

export type SortAccessors<Row, Field extends string> = Record<Field, (row: Row) => SortValue>

export function compareText(a: string, b: string): number {
  return a.localeCompare(b, "es", { sensitivity: "base" })
}

function compareValues(a: string | number | Date, b: string | number | Date): number {
  if (typeof a === "number" && typeof b === "number") {
    return a - b
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime()
  }

  return compareText(String(a), String(b))
}

export function sortRows<Row, Field extends string>(
  rows: readonly Row[],
  sort: SortState<Field> | null,
  accessors: SortAccessors<Row, Field>,
  tieBreaker: (a: Row, b: Row) => number = () => 0,
): Row[] {
  if (!sort) {
    return [...rows]
  }

  const valueOf = accessors[sort.field]
  const direction = sort.direction === "asc" ? 1 : -1

  return [...rows].sort((a, b) => {
    const left = valueOf(a)
    const right = valueOf(b)

    if (left === null || right === null) {
      return left === right ? tieBreaker(a, b) : left === null ? 1 : -1
    }

    return compareValues(left, right) * direction || tieBreaker(a, b)
  })
}

export function toggleSort<Field extends string>(
  current: SortState<Field> | null,
  field: Field,
  descendingFirst: readonly Field[] = [],
): SortState<Field> {
  if (current?.field === field) {
    return { field, direction: current.direction === "asc" ? "desc" : "asc" }
  }

  return { field, direction: descendingFirst.includes(field) ? "desc" : "asc" }
}

export function toDate(value: string | null): Date | null {
  return value === null ? null : new Date(value)
}
