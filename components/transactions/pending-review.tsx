"use client"

import { useState } from "react"
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
import { ReviewPendingDialog } from "@/components/transactions/review-pending-dialog"
import { isApiError } from "@/lib/api/errors"
import { toastApiError } from "@/lib/api/notify"
import {
  confirmTransaction,
  discardTransaction,
  type ConfirmTransactionPayload,
  type PendingTransactionDto,
} from "@/lib/api/transactions"
import { useMessages } from "@/lib/i18n"

function wasAlreadyReviewed(error: unknown): boolean {
  return isApiError(error) && (error.status === 404 || error.status === 409)
}

export interface PendingReview {
  reviewing: PendingTransactionDto | null
  toDiscard: PendingTransactionDto | null
  isConfirming: boolean
  isDiscarding: boolean
  open: (transaction: PendingTransactionDto) => void
  close: () => void
  requestDiscard: (transaction: PendingTransactionDto) => void
  cancelDiscard: () => void
  confirm: (transaction: PendingTransactionDto, payload: ConfirmTransactionPayload) => Promise<void>
  discard: () => Promise<void>
}

export function usePendingReview({
  onRemoved,
  onConfirmed,
}: {
  onRemoved: (id: string) => void
  onConfirmed: () => void
}): PendingReview {
  const t = useMessages().pendingInbox
  const [reviewing, setReviewing] = useState<PendingTransactionDto | null>(null)
  const [toDiscard, setToDiscard] = useState<PendingTransactionDto | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isDiscarding, setIsDiscarding] = useState(false)

  const confirm = async (transaction: PendingTransactionDto, payload: ConfirmTransactionPayload) => {
    if (isConfirming) return
    setIsConfirming(true)

    try {
      await confirmTransaction(transaction.id, payload)
      onRemoved(transaction.id)
      setReviewing(null)
      onConfirmed()
      toast.success(t.confirmedToast, { description: t.confirmedToastDescription })
    } catch (error) {
      if (wasAlreadyReviewed(error)) {
        onRemoved(transaction.id)
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

  const discard = async () => {
    if (!toDiscard || isDiscarding) return
    setIsDiscarding(true)

    try {
      await discardTransaction(toDiscard.id)
      onRemoved(toDiscard.id)
      setToDiscard(null)
      setReviewing(null)
      toast.success(t.discardedToast, { description: t.discardedToastDescription })
    } catch (error) {
      if (wasAlreadyReviewed(error)) {
        onRemoved(toDiscard.id)
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

  return {
    reviewing,
    toDiscard,
    isConfirming,
    isDiscarding,
    open: setReviewing,
    close: () => setReviewing(null),
    requestDiscard: setToDiscard,
    cancelDiscard: () => setToDiscard(null),
    confirm,
    discard,
  }
}

export function PendingReviewDialogs({ review }: { review: PendingReview }) {
  const messages = useMessages()
  const t = messages.pendingInbox

  return (
    <>
      <ReviewPendingDialog
        key={review.reviewing?.id ?? "closed"}
        transaction={review.reviewing}
        isSubmitting={review.isConfirming}
        onConfirm={review.confirm}
        onDiscard={review.requestDiscard}
        onClose={review.close}
      />

      <AlertDialog
        open={review.toDiscard !== null}
        onOpenChange={(open) => {
          if (!open && !review.isDiscarding) review.cancelDiscard()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.discardTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {review.toDiscard ? t.discardWarning(review.toDiscard.description) : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={review.isDiscarding}>{messages.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={review.isDiscarding}
              onClick={(event) => {
                event.preventDefault()
                void review.discard()
              }}
            >
              {review.isDiscarding ? t.discarding : t.discardConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
