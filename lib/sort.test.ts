import { describe, expect, it } from "vitest"

import { sortRows, toDate, toggleSort, type SortAccessors } from "./sort"

interface Row {
  name: string
  amount: number
  date: string | null
}

const accessors: SortAccessors<Row, "name" | "amount" | "date"> = {
  name: (row) => row.name,
  amount: (row) => row.amount,
  date: (row) => toDate(row.date),
}

const names = (rows: Row[]) => rows.map((row) => row.name)

describe("sortRows", () => {
  it("compares amounts as numbers, not as text", () => {
    const rows = [
      { name: "a", amount: 100, date: null },
      { name: "b", amount: 9, date: null },
      { name: "c", amount: -20, date: null },
    ]

    expect(names(sortRows(rows, { field: "amount", direction: "asc" }, accessors))).toEqual(["c", "b", "a"])
    expect(names(sortRows(rows, { field: "amount", direction: "desc" }, accessors))).toEqual(["a", "b", "c"])
  })

  it("compares dates as dates", () => {
    const rows = [
      { name: "march", amount: 0, date: "2026-03-01" },
      { name: "december", amount: 0, date: "2025-12-31T23:00:00Z" },
      { name: "october", amount: 0, date: "2026-10-18T10:53:59-03:00" },
    ]

    expect(names(sortRows(rows, { field: "date", direction: "asc" }, accessors))).toEqual([
      "december",
      "march",
      "october",
    ])
  })

  it("sorts text alphabetically in Spanish, ignoring case and accents", () => {
    const rows = ["Zeta", "ñandú", "Árbol", "nube", "ola", "arco"].map((name) => ({ name, amount: 0, date: null }))

    expect(names(sortRows(rows, { field: "name", direction: "asc" }, accessors))).toEqual([
      "Árbol",
      "arco",
      "nube",
      "ñandú",
      "ola",
      "Zeta",
    ])
  })

  it("keeps empty values at the end in both directions", () => {
    const rows = [
      { name: "empty", amount: 0, date: null },
      { name: "old", amount: 0, date: "2024-01-01" },
      { name: "new", amount: 0, date: "2026-01-01" },
    ]

    expect(names(sortRows(rows, { field: "date", direction: "asc" }, accessors))).toEqual(["old", "new", "empty"])
    expect(names(sortRows(rows, { field: "date", direction: "desc" }, accessors))).toEqual(["new", "old", "empty"])
  })

  it("breaks ties with the tie breaker", () => {
    const rows = [
      { name: "b", amount: 1, date: null },
      { name: "a", amount: 1, date: null },
    ]

    expect(
      names(sortRows(rows, { field: "amount", direction: "asc" }, accessors, (x, y) => x.name.localeCompare(y.name))),
    ).toEqual(["a", "b"])
  })

  it("keeps the original order without a sort and never mutates the input", () => {
    const rows = [
      { name: "b", amount: 2, date: null },
      { name: "a", amount: 1, date: null },
    ]

    expect(names(sortRows(rows, null, accessors))).toEqual(["b", "a"])
    sortRows(rows, { field: "name", direction: "asc" }, accessors)
    expect(names(rows)).toEqual(["b", "a"])
  })
})

describe("toggleSort", () => {
  it("inverts the direction when the same column is clicked again", () => {
    expect(toggleSort({ field: "name", direction: "asc" }, "name")).toEqual({ field: "name", direction: "desc" })
    expect(toggleSort({ field: "name", direction: "desc" }, "name")).toEqual({ field: "name", direction: "asc" })
  })

  it("starts a new column ascending, unless it is listed as descending first", () => {
    expect(toggleSort(null, "name", ["date"])).toEqual({ field: "name", direction: "asc" })
    expect(toggleSort({ field: "name", direction: "asc" }, "date", ["date"])).toEqual({
      field: "date",
      direction: "desc",
    })
  })
})
