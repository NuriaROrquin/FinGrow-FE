"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, Inbox, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SortableTableHead } from "@/components/ui/sortable-table-head"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ConfidenceBadge } from "@/components/transactions/confidence-badge"
import { PendingReviewDialogs, usePendingReview } from "@/components/transactions/pending-review"
import { getCategoryIcon } from "@/components/transactions/transaction-icons"
import type { PendingTransactionsState } from "@/components/transactions/use-pending-transactions"
import {
  expenseCategoryLabels,
  incomeCategoryLabels,
  type ConfidenceLevel,
  type PendingTransactionDto,
} from "@/lib/api/transactions"
import { formatDate, formatMoney } from "@/lib/format"
import { useMessages } from "@/lib/i18n"
import { sortRows, toDate, toggleSort, type SortAccessors, type SortState } from "@/lib/sort"

const headClassName = "py-3 pr-2 text-left align-middle whitespace-nowrap"
const cellClassName = "py-3 pr-2 align-middle whitespace-nowrap"

type PendingSortField = "occurredOn" | "type" | "description" | "category" | "confidence" | "source" | "amount"

const confidenceRank: Record<ConfidenceLevel, number> = { Low: 0, Medium: 1, High: 2 }

function signedAmount(transaction: PendingTransactionDto): number {
  return transaction.type === "Income" ? Math.abs(transaction.amount) : -Math.abs(transaction.amount)
}

function categoryLabel(transaction: PendingTransactionDto): string {
  const labels: Record<string, string> = transaction.type === "Expense" ? expenseCategoryLabels : incomeCategoryLabels

  return labels[transaction.category] ?? transaction.category
}

export function PendingInbox({
  pending,
  onConfirmed,
  className,
}: {
  pending: PendingTransactionsState
  onConfirmed: () => void
  className?: string
}) {
  const t = useMessages().pendingInbox
  const { items, isLoading, hasError, reload, remove } = pending
  const review = usePendingReview({ onRemoved: remove, onConfirmed })
  const [sort, setSort] = useState<SortState<PendingSortField> | null>(null)

  const sortedItems = useMemo(() => {
    const accessors: SortAccessors<PendingTransactionDto, PendingSortField> = {
      occurredOn: (transaction) => toDate(transaction.occurredOn),
      type: (transaction) => (transaction.type === "Income" ? t.typeIncome : t.typeExpense),
      description: (transaction) => transaction.description,
      category: categoryLabel,
      confidence: (transaction) =>
        transaction.aiConfidenceLevel === null ? null : confidenceRank[transaction.aiConfidenceLevel],
      source: (transaction) => t.sources[transaction.source] ?? transaction.source,
      amount: signedAmount,
    }

    return sortRows(items, sort, accessors)
  }, [items, sort, t])

  const handleSort = (field: PendingSortField) =>
    setSort((current) => toggleSort(current, field, ["occurredOn", "amount"]))

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t.loading}</p>
        ) : hasError ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center text-sm text-muted-foreground">
            <span>{t.loadFailed}</span>
            <Button variant="outline" size="sm" onClick={reload}>
              {t.retry}
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Inbox className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="font-medium text-foreground">{t.emptyTitle}</p>
            <p className="text-sm text-muted-foreground">{t.emptyDescription}</p>
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <Table className="w-full table-auto">
                <TableHeader>
                  <TableRow>
                    <SortableTableHead
                      className={headClassName}
                      label={t.columnDate}
                      field="occurredOn"
                      sort={sort}
                      onSort={handleSort}
                    />
                    <SortableTableHead
                      className={headClassName}
                      label={t.columnType}
                      field="type"
                      sort={sort}
                      onSort={handleSort}
                    />
                    <SortableTableHead
                      className={headClassName}
                      label={t.columnDescription}
                      field="description"
                      sort={sort}
                      onSort={handleSort}
                    />
                    <SortableTableHead
                      className={headClassName}
                      label={t.columnCategory}
                      field="category"
                      sort={sort}
                      onSort={handleSort}
                    />
                    <SortableTableHead
                      className={headClassName}
                      label={t.columnConfidence}
                      field="confidence"
                      sort={sort}
                      onSort={handleSort}
                    />
                    <SortableTableHead
                      className={headClassName}
                      label={t.columnSource}
                      field="source"
                      sort={sort}
                      onSort={handleSort}
                    />
                    <SortableTableHead
                      className={headClassName}
                      label={t.columnAmount}
                      field="amount"
                      sort={sort}
                      onSort={handleSort}
                    />
                    <TableHead className={headClassName}>{t.columnActions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((transaction) => {
                    const label = categoryLabel(transaction)
                    const CategoryIcon = getCategoryIcon(transaction.category)

                    return (
                      <TableRow key={transaction.id}>
                        <TableCell className={`${cellClassName} font-medium`}>
                          {formatDate(transaction.occurredOn)}
                        </TableCell>
                        <TableCell className={cellClassName}>
                          {transaction.type === "Income" ? t.typeIncome : t.typeExpense}
                        </TableCell>
                        <TableCell className={`${cellClassName} max-w-[240px]`}>
                          <span className="block truncate" title={transaction.description}>
                            {transaction.description}
                          </span>
                        </TableCell>
                        <TableCell className={cellClassName}>
                          <div className="flex items-center gap-2" title={label}>
                            <CategoryIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <span className="truncate text-sm text-foreground">{label}</span>
                          </div>
                        </TableCell>
                        <TableCell className={cellClassName}>
                          <ConfidenceBadge
                            level={transaction.aiConfidenceLevel}
                            type={transaction.type}
                            subject={transaction.source === "ReceiptScan" ? "reading" : "category"}
                          />
                        </TableCell>
                        <TableCell className={`${cellClassName} text-muted-foreground`}>
                          {t.sources[transaction.source] ?? transaction.source}
                        </TableCell>
                        <TableCell className={cellClassName}>
                          <span
                            className={`font-semibold ${transaction.type === "Income" ? "text-emerald-500 dark:text-emerald-300" : "text-rose-500 dark:text-rose-300"}`}
                          >
                            {transaction.type === "Income" ? "+" : "-"}
                            {formatMoney(Math.abs(transaction.amount), transaction.currency)}
                          </span>
                        </TableCell>
                        <TableCell className={cellClassName}>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              aria-label={t.reviewAria(transaction.description)}
                              onClick={() => review.open(transaction)}
                            >
                              <CheckCircle2 className="size-4" aria-hidden="true" />
                              {t.review}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-rose-500 dark:hover:text-rose-300"
                              aria-label={t.discardAria(transaction.description)}
                              title={t.discard}
                              onClick={() => review.requestDiscard(transaction)}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            <p className="mt-4 border-t pt-4 text-sm font-medium text-foreground">{t.count(items.length)}</p>
          </>
        )}
      </CardContent>

      <PendingReviewDialogs review={review} />
    </Card>
  )
}
