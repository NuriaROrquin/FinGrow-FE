"use client"

import { useState } from "react"
import { CheckCircle2, Inbox, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ConfidenceBadge } from "@/components/transactions/confidence-badge"
import { ReviewPendingDialog } from "@/components/transactions/review-pending-dialog"
import { getCategoryIcon } from "@/components/transactions/transaction-icons"
import type { PendingTransactionsState } from "@/components/transactions/use-pending-transactions"
import { isApiError } from "@/lib/api/errors"
import { toastApiError } from "@/lib/api/notify"
import {
  confirmTransaction,
  discardTransaction,
  expenseCategoryLabels,
  incomeCategoryLabels,
  type ConfirmTransactionPayload,
  type PendingTransactionDto,
} from "@/lib/api/transactions"
import { formatDate, formatMoney } from "@/lib/format"
import { useMessages } from "@/lib/i18n"

const headClassName = "py-3 pr-2 text-left align-middle whitespace-nowrap"
const cellClassName = "py-3 pr-2 align-middle whitespace-nowrap"

function categoryLabel(transaction: PendingTransactionDto): string {
  const labels: Record<string, string> = transaction.type === "Expense" ? expenseCategoryLabels : incomeCategoryLabels

  return labels[transaction.category] ?? transaction.category
}

function wasAlreadyReviewed(error: unknown): boolean {
  return isApiError(error) && (error.status === 404 || error.status === 409)
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
  const messages = useMessages()
  const t = messages.pendingInbox
  const [reviewing, setReviewing] = useState<PendingTransactionDto | null>(null)
  const [toDiscard, setToDiscard] = useState<PendingTransactionDto | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isDiscarding, setIsDiscarding] = useState(false)

  const { items, isLoading, hasError, reload, remove } = pending

  const handleConfirm = async (transaction: PendingTransactionDto, payload: ConfirmTransactionPayload) => {
    if (isConfirming) return
    setIsConfirming(true)

    try {
      await confirmTransaction(transaction.id, payload)
      remove(transaction.id)
      setReviewing(null)
      onConfirmed()
      toast.success(t.confirmedToast, { description: t.confirmedToastDescription })
    } catch (error) {
      if (wasAlreadyReviewed(error)) {
        remove(transaction.id)
        setReviewing(null)
        onConfirmed()
        toast.info(t.alreadyReviewed)
      } else {
        toastApiError(error, t.confirmFailed)
      }
    } finally {
      setIsConfirming(false)
    }
  }

  const handleDiscard = async () => {
    if (!toDiscard || isDiscarding) return
    setIsDiscarding(true)

    try {
      await discardTransaction(toDiscard.id)
      remove(toDiscard.id)
      setToDiscard(null)
      setReviewing(null)
      toast.success(t.discardedToast, { description: t.discardedToastDescription })
    } catch (error) {
      if (wasAlreadyReviewed(error)) {
        remove(toDiscard.id)
        setToDiscard(null)
        setReviewing(null)
        onConfirmed()
        toast.info(t.alreadyReviewed)
      } else {
        toastApiError(error, t.discardFailed)
      }
    } finally {
      setIsDiscarding(false)
    }
  }

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
                    <TableHead className={headClassName}>{t.columnDate}</TableHead>
                    <TableHead className={headClassName}>{t.columnType}</TableHead>
                    <TableHead className={headClassName}>{t.columnDescription}</TableHead>
                    <TableHead className={headClassName}>{t.columnCategory}</TableHead>
                    <TableHead className={headClassName}>{t.columnConfidence}</TableHead>
                    <TableHead className={headClassName}>{t.columnSource}</TableHead>
                    <TableHead className={headClassName}>{t.columnAmount}</TableHead>
                    <TableHead className={headClassName}>{t.columnActions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((transaction) => {
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
                          <ConfidenceBadge level={transaction.aiConfidenceLevel} type={transaction.type} />
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
                              onClick={() => setReviewing(transaction)}
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
                              onClick={() => setToDiscard(transaction)}
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

      <ReviewPendingDialog
        key={reviewing?.id ?? "closed"}
        transaction={reviewing}
        isSubmitting={isConfirming}
        onConfirm={handleConfirm}
        onDiscard={setToDiscard}
        onClose={() => setReviewing(null)}
      />

      <AlertDialog
        open={toDiscard !== null}
        onOpenChange={(open) => {
          if (!open && !isDiscarding) setToDiscard(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.discardTitle}</AlertDialogTitle>
            <AlertDialogDescription>{toDiscard ? t.discardWarning(toDiscard.description) : ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDiscarding}>{messages.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDiscarding}
              onClick={(event) => {
                event.preventDefault()
                void handleDiscard()
              }}
            >
              {isDiscarding ? t.discarding : t.discardConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
