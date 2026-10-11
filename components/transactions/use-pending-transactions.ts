"use client"

import { useCallback, useEffect, useState } from "react"

import { listPendingTransactions, type PendingTransactionDto } from "@/lib/api/transactions"

export interface PendingTransactionsState {
  items: PendingTransactionDto[]
  isLoading: boolean
  hasError: boolean
  reload: () => void
  remove: (id: string) => void
}

export function usePendingTransactions(): PendingTransactionsState {
  const [items, setItems] = useState<PendingTransactionDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    listPendingTransactions(controller.signal)
      .then((response) => {
        setItems(response.items)
        setHasError(false)
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setHasError(true)
      })
      .finally(() => {
        if (controller.signal.aborted) return
        setIsLoading(false)
      })

    return () => controller.abort()
  }, [reloadKey])

  const reload = useCallback(() => {
    setIsLoading(true)
    setHasError(false)
    setReloadKey((key) => key + 1)
  }, [])

  const remove = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  return { items, isLoading, hasError, reload, remove }
}
