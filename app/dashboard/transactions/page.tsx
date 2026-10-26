"use client"

import type React from "react"

import { useState, useRef, useEffect, useLayoutEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { SortableTableHead } from "@/components/ui/sortable-table-head"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  PlusIcon,
  SearchIcon,
  DownloadIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ScanLine,
  Send,
  CheckCircle2,
  Check,
  ChevronsUpDown,
  Info,
  ScaleIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  createTransaction,
  deleteTransaction,
  exportTransactions,
  getTransactionSummary,
  listTransactions,
  type Currency,
  type ExpenseCategory,
  type IncomeCategory,
  type PaymentMethod,
  type PendingTransactionDto,
  type TransactionDto,
  type TransactionListStatus,
  type TransactionSortField,
  type TransactionSummaryResponse,
  type TransactionsResponse,
  removeTransactionReceipt,
  updateTransaction,
} from "@/lib/api/transactions"
import { AddTransactionForm } from "@/components/transactions/add-transaction-form"
import { TransactionActionsMenu } from "@/components/transactions/transaction-actions-menu"
import { PendingInbox } from "@/components/transactions/pending-inbox"
import { PendingReviewDialogs, usePendingReview } from "@/components/transactions/pending-review"
import type { UploadedReceipt } from "@/components/transactions/receipt-field"
import { ScanReceiptDialog } from "@/components/transactions/scan-receipt-dialog"
import { usePendingTransactions } from "@/components/transactions/use-pending-transactions"
import { TELEGRAM_BOT_USERNAME } from "@/components/integrations/telegram-card"
import { getCategoryIcon, getPaymentMethodIcon } from "@/components/transactions/transaction-icons"
import { isApiError } from "@/lib/api/errors"
import {
  PeriodFilter,
  getCurrentMonthStart,
  getToday,
} from "@/components/period-filter"
import { formatDate, formatMoney } from "@/lib/format"
import { usePreferences } from "@/lib/preferences-context"
import { useMessages } from "@/lib/i18n"
import { toggleSort, type SortState } from "@/lib/sort"
import { OtherCurrencyNotice } from "@/components/transactions/other-currency-notice"

const emptyTransactionsResponse: TransactionsResponse = {
  items: [],
  pageNumber: 1,
  pageSize: 10,
  totalCount: 0,
  totalPages: 1,
}

const emptyTransactionSummary: TransactionSummaryResponse = {
  currencies: {},
  otherCurrencies: [],
}

const transactionStatusFilterValues: TransactionListStatus[] = ["Confirmed", "Eliminated"]
const defaultTransactionStatuses: TransactionListStatus[] = ["Confirmed"]

const defaultTransactionSort: SortState<TransactionSortField> = { field: "OccurredOn", direction: "desc" }

type TransactionsView = "movements" | "pending"

const transactionTableHeadClassName = "py-3 pr-2 text-left align-middle whitespace-nowrap"
const transactionTableCellClassName = "py-3 pr-2 align-middle whitespace-nowrap"

export default function TransactionsPage() {
  const searchParams = useSearchParams()
  const t = useMessages()
  const tx = t.transactions
  // Métodos de pago para el filtro, ordenados alfabéticamente en el idioma elegido
  const paymentMethodFilterOptions = (Object.entries(t.labels.paymentMethods) as [PaymentMethod, string][]).sort(
    ([, labelA], [, labelB]) => labelA.localeCompare(labelB),
  )
  const transactionStatusFilterOptions = transactionStatusFilterValues.map(
    (status) => [status, t.labels.transactionStatuses[status]] as const,
  )
  const pending = usePendingTransactions()
  const [activeView, setActiveView] = useState<TransactionsView>(
    searchParams.get("view") === "pending" ? "pending" : "movements",
  )
  const [listRefreshKey, setListRefreshKey] = useState(0)
  const [transactionsResponse, setTransactionsResponse] = useState(emptyTransactionsResponse)
  const [transactionSummary, setTransactionSummary] = useState(emptyTransactionSummary)
  const [summaryRefreshKey, setSummaryRefreshKey] = useState(0)
  const [isSummaryReady, setIsSummaryReady] = useState(false)
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "Income" | "Expense">("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState<TransactionListStatus[]>(defaultTransactionStatuses)
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("all")
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false)
  const [isStatusPickerOpen, setIsStatusPickerOpen] = useState(false)
  const [dateFrom, setDateFrom] = useState(() => getCurrentMonthStart())
  const [dateTo, setDateTo] = useState(() => getToday())
  const { preferences } = usePreferences()
  const [summaryCurrency, setSummaryCurrency] = useState<"ARS" | "USD">(preferences.currency === "USD" ? "USD" : "ARS")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sort, setSort] = useState<SortState<TransactionSortField>>(defaultTransactionSort)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<TransactionDto | null>(null)
  const [transactionToDelete, setTransactionToDelete] = useState<TransactionDto | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isScanDialogOpen, setIsScanDialogOpen] = useState(false)
  const [preloadedReceipt, setPreloadedReceipt] = useState<UploadedReceipt | null>(null)
  const summaryRequestKey = useRef<string | null>(null)
  const scrollPositionRef = useRef<number | null>(null)
  const { toast } = useToast()

  useLayoutEffect(() => {
    const scrollPosition = scrollPositionRef.current
    if (scrollPosition === null) return

    const frameId = window.requestAnimationFrame(() => {
      window.scrollTo({ top: scrollPosition, left: window.scrollX, behavior: "auto" })
      scrollPositionRef.current = null
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [
    currentPage,
    dateFrom,
    dateTo,
    filterCategory,
    filterPaymentMethod,
    filterStatus,
    filterType,
    pageSize,
    searchQuery,
    sort,
  ])

  useEffect(() => {
    const requestKey = `${summaryRefreshKey}|${dateFrom}|${dateTo}`
    if (summaryRequestKey.current === requestKey) return
    summaryRequestKey.current = requestKey

    getTransactionSummary({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })
      .then(setTransactionSummary)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        toast({
          title: tx.summaryLoadFailed,
          description: error instanceof Error ? error.message : tx.tryAgainShortly,
          variant: "destructive",
        })
      })
      .finally(() => {
        setIsSummaryReady(true)
      })
  }, [dateFrom, dateTo, summaryRefreshKey, toast, tx])

  useEffect(() => {
    const view = searchParams.get("view")
    if (view) setActiveView(view === "pending" ? "pending" : "movements")
  }, [searchParams])

  useEffect(() => {
    if (searchParams.get("mode") === "ocr") {
      setIsScanDialogOpen(true)
    }
  }, [searchParams])

  // Carga el listado real desde la API 
  useEffect(() => {
    if (!isSummaryReady) return

    const search = searchQuery.trim()
    if (search.length > 0 && search.length < 3) return

    const timeoutId = window.setTimeout(() => {
      setIsLoadingTransactions(true)
      const apiType = filterType === "all" ? undefined : filterType
      listTransactions(currentPage, pageSize, {
        search: search || undefined,
        type: apiType,
        expenseCategory:
          filterType === "Expense" && filterCategory !== "all"
            ? (filterCategory as ExpenseCategory)
            : undefined,
        incomeCategory:
          filterType === "Income" && filterCategory !== "all"
            ? (filterCategory as IncomeCategory)
            : undefined,
        status: filterStatus.length > 0 ? filterStatus : undefined,
        paymentMethod: filterPaymentMethod === "all" ? undefined : (filterPaymentMethod as PaymentMethod),
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy: sort.field,
        sortDirection: sort.direction === "asc" ? "Ascending" : "Descending",
      })
        .then(setTransactionsResponse)
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return
          toast({
            title: tx.listLoadFailed,
            description: error instanceof Error ? error.message : tx.tryAgainShortly,
            variant: "destructive",
          })
        })
        .finally(() => {
          setIsLoadingTransactions(false)
        })
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [
    currentPage,
    dateFrom,
    dateTo,
    filterCategory,
    filterPaymentMethod,
    filterStatus,
    filterType,
    isSummaryReady,
    listRefreshKey,
    pageSize,
    searchQuery,
    sort,
    toast,
    tx,
  ])

  useEffect(() => {
    if (isAddDialogOpen || isScanDialogOpen) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      document.body.style.pointerEvents = ""
      document.body.style.overflow = ""
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [isAddDialogOpen, isScanDialogOpen])

  const transactions = transactionsResponse.items
  const filteredTransactions = transactions
  const categoryFilterOptions = filterType === "Expense"
    ? Object.entries(t.labels.expenseCategories)
    : filterType === "Income"
      ? Object.entries(t.labels.incomeCategories)
      : []

  const defaultDateFrom = getCurrentMonthStart()
  const defaultDateTo = getToday()
  const shouldShowPagination = transactionsResponse.totalPages > 1
  const visibleResultsStart = transactionsResponse.totalCount === 0 ? 0 : (transactionsResponse.pageNumber - 1) * pageSize + 1
  const visibleResultsEnd = transactionsResponse.totalCount === 0 ? 0 : Math.min(transactionsResponse.pageNumber * pageSize, transactionsResponse.totalCount)

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    filterType !== "all" ||
    filterCategory !== "all" ||
    filterStatus.length !== defaultTransactionStatuses.length ||
    defaultTransactionStatuses.some((status) => !filterStatus.includes(status)) ||
    filterPaymentMethod !== "all" ||
    dateFrom !== defaultDateFrom ||
    dateTo !== defaultDateTo

  const clearFilters = () => {
    setSearchQuery("")
    setFilterType("all")
    setFilterCategory("all")
    setFilterStatus([...defaultTransactionStatuses])
    setFilterPaymentMethod("all")
    setDateFrom(defaultDateFrom)
    setDateTo(defaultDateTo)
    setCurrentPage(1)
  }

  const handleSort = (field: TransactionSortField) => {
    setSort((current) => toggleSort(current, field, ["OccurredOn", "Amount"]))
    setCurrentPage(1)
  }

  const closeTransactionDialog = () => {
    setIsAddDialogOpen(false)
    setEditingTransaction(null)
    setPreloadedReceipt(null)
  }

  const openCreateTransactionDialog = (receipt: UploadedReceipt | null = null) => {
    setEditingTransaction(null)
    setPreloadedReceipt(receipt)
    setIsAddDialogOpen(true)
  }

  const openEditTransactionDialog = (transaction: TransactionDto) => {
    setEditingTransaction(transaction)
    setIsAddDialogOpen(true)
  }

  const openDeleteTransactionDialog = (transaction: TransactionDto) => {
    if (transaction.status !== "Pending" && transaction.status !== "Confirmed") return

    setTransactionToDelete(transaction)
    setIsDeleteDialogOpen(true)
  }

  const closeDeleteTransactionDialog = () => {
    if (isDeleting) return

    setIsDeleteDialogOpen(false)
    setTransactionToDelete(null)
  }

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete || isDeleting) return

    setIsDeleting(true)

    try {
      await deleteTransaction(transactionToDelete.id)
      setTransactionsResponse((previous) => ({
        ...previous,
        items: previous.items.filter((item) => item.id !== transactionToDelete.id),
        totalCount: Math.max(0, previous.totalCount - 1),
      }))
      setSummaryRefreshKey((key) => key + 1)
      setIsDeleteDialogOpen(false)
      setTransactionToDelete(null)
      if (transactionsResponse.items.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1)
      }
      toast({
        title: tx.deletedToast,
        description: tx.deletedToastDescription,
      })
    } catch (error) {
      toast({
        title: error instanceof Error && isApiError(error) && error.status === 404
          ? tx.notFound
          : tx.deleteFailed,
        description: error instanceof Error && isApiError(error) && error.status === 404
          ? tx.notFoundDescription
          : error instanceof Error
            ? error.message
            : tx.tryAgainShortly,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePendingConfirmed = () => {
    setSummaryRefreshKey((key) => key + 1)
    setListRefreshKey((key) => key + 1)
  }

  const scanReview = usePendingReview({ onRemoved: pending.remove, onConfirmed: handlePendingConfirmed })

  const handleReceiptProposed = (proposal: PendingTransactionDto) => {
    pending.reload()
    scanReview.open(proposal)
  }

  const handleTransactionDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      closeTransactionDialog()
    }
  }

  const changePeriod = (nextDateFrom: string, nextDateTo: string) => {
    setDateFrom(nextDateFrom)
    setDateTo(nextDateTo)
    setCurrentPage(1)
    setSummaryRefreshKey((key) => key + 1)
  }

  const selectedSummary = transactionSummary.currencies?.[summaryCurrency] ?? {
    income: 0,
    expenses: 0,
    balance: 0,
    transactions: 0,
    incomeTransactions: 0,
    expenseTransactions: 0,
  }
  const formatCurrency = (amount: number, currency: Currency) => formatMoney(amount, currency)

  const handleExport = async () => {
    if (isExporting) return

    setIsExporting(true)

    try {
      const blob = await exportTransactions({
        search: searchQuery.trim() || undefined,
        type: filterType === "all" ? undefined : filterType,
        expenseCategory:
          filterType === "Expense" && filterCategory !== "all"
            ? (filterCategory as ExpenseCategory)
            : undefined,
        incomeCategory:
          filterType === "Income" && filterCategory !== "all"
            ? (filterCategory as IncomeCategory)
            : undefined,
        status: filterStatus.length > 0 ? filterStatus : undefined,
        paymentMethod: filterPaymentMethod === "all" ? undefined : (filterPaymentMethod as PaymentMethod),
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      const dateFromForFilename = dateFrom.replaceAll("-", "") || tx.exportNoDate
      const dateToForFilename = dateTo.replaceAll("-", "") || tx.exportNoDate

      link.href = url
      link.download = `${tx.exportFileName}_${dateFromForFilename}_${dateToForFilename}.xlsx`
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      toast({
        title: tx.exportFailed,
        description: error instanceof Error ? error.message : tx.tryAgainShortly,
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex w-full max-w-full flex-col space-y-6 overflow-x-hidden pr-1 sm:pr-2">
      <div className="contents">
        <div className="order-0">
          <h1 className="text-3xl font-bold text-balance">{tx.title}</h1>
          <p className="text-muted-foreground mt-1">{tx.subtitle}</p>
        </div>

          <div className="order-4 grid w-full grid-cols-1 gap-2 py-3 sm:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="w-full" onClick={() => setIsScanDialogOpen(true)}>
              <ScanLine className="size-4" />
              {t.receiptScan.button}
            </Button>
            <ScanReceiptDialog
              open={isScanDialogOpen}
              onOpenChange={setIsScanDialogOpen}
              onProposed={handleReceiptProposed}
              onManualEntry={openCreateTransactionDialog}
            />

            {TELEGRAM_BOT_USERNAME && (
              <Button variant="outline" className="w-full" asChild>
                <a href={`https://t.me/${TELEGRAM_BOT_USERNAME}`} target="_blank" rel="noopener noreferrer">
                  <Send className="size-4" />
                  {tx.telegramMessage}
                </a>
              </Button>
            )}

            <Dialog open={isAddDialogOpen} onOpenChange={handleTransactionDialogChange}>
              <Button className="w-full" onClick={() => openCreateTransactionDialog()}>
                <PlusIcon className="size-4" />
                {tx.add}
              </Button>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingTransaction ? tx.editTitle : tx.addTitle}</DialogTitle>
                  <DialogDescription>
                    {editingTransaction ? tx.editDescription : tx.addDescription}
                  </DialogDescription>
                </DialogHeader>
                <AddTransactionForm
                  mode={editingTransaction ? "edit" : "create"}
                  initialTransaction={editingTransaction}
                  preloadedReceipt={editingTransaction ? null : preloadedReceipt}
                  onSubmit={async (payload, { removeReceipt }) => {
                    if (editingTransaction) {
                      let updated = await updateTransaction(editingTransaction.id, payload)

                      if (removeReceipt) {
                        await removeTransactionReceipt(editingTransaction.id)
                        updated = { ...updated, receiptId: null }
                      }

                      setTransactionsResponse((previous) => ({
                        ...previous,
                        items: previous.items.map((item) => (item.id === updated.id ? updated : item)),
                      }))
                      setSummaryRefreshKey((key) => key + 1)
                      toast({
                        title: tx.updatedToast,
                        description: tx.updatedToastDescription,
                      })
                      return
                    }

                    const created = await createTransaction(payload)
                    setTransactionsResponse((previous) => ({
                      ...previous,
                      items: [created, ...previous.items].slice(0, pageSize),
                      totalCount: previous.totalCount + 1,
                    }))
                    setSummaryRefreshKey((key) => key + 1)
                    toast({
                      title: tx.savedToast,
                      description: tx.savedToastDescription,
                    })
                  }}
                  onClose={closeTransactionDialog}
                />
              </DialogContent>
            </Dialog>

            <AlertDialog
              open={isDeleteDialogOpen}
              onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                  closeDeleteTransactionDialog()
                }
              }}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{tx.deleteTitle}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {tx.deleteWarning(
                      transactionToDelete?.description ?? "",
                      transactionToDelete ? formatMoney(transactionToDelete.amount, transactionToDelete.currency) : "",
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>{t.common.cancel}</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                    onClick={(event) => {
                      event.preventDefault()
                      void handleDeleteTransaction()
                    }}
                  >
                    {isDeleting ? tx.deleting : tx.confirm}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
              </div>
      </div>

      <div className="order-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PeriodFilter dateFrom={dateFrom} dateTo={dateTo} onChange={({ dateFrom: nextDateFrom, dateTo: nextDateTo }) => changePeriod(nextDateFrom, nextDateTo)} />
        <Tabs value={summaryCurrency} onValueChange={(value) => setSummaryCurrency(value as "ARS" | "USD")} className="w-fit">
          <TabsList>
            <TabsTrigger value="ARS">{t.common.currencyArs}</TabsTrigger>
            <TabsTrigger value="USD">{t.common.currencyUsd}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Alert className="order-2 border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800/70 dark:bg-sky-950/40 dark:text-sky-100">
        <AlertDescription className="flex flex-wrap items-center gap-1.5 text-sky-900 dark:text-sky-100">
          <span>{tx.pendingNotice}</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 rounded-full text-sky-700 hover:bg-sky-100 hover:text-sky-800 dark:text-sky-300 dark:hover:bg-sky-900/60 dark:hover:text-sky-100"
                aria-label={tx.totalsHelpAria}
              >
                <Info className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 text-sm">
              <p className="font-medium">{tx.totalsHelpTitle}</p>
              <p className="mt-1 text-muted-foreground">
                {tx.totalsHelpPrefix}
                <strong className="text-foreground">{tx.totalsHelpConfirmed}</strong>
                {tx.totalsHelpMiddle}
                <strong className="text-foreground">{tx.totalsHelpPending}</strong>
                {tx.totalsHelpSuffix}
              </p>
            </PopoverContent>
          </Popover>
        </AlertDescription>
      </Alert>

      <div className="order-2">
        <OtherCurrencyNotice currencies={transactionSummary.otherCurrencies ?? []} />
      </div>

      <div className="order-3 grid gap-4 md:grid-cols-3">
        <Card className="border border-border bg-card shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <ArrowUpIcon className="size-5 shrink-0 text-muted-foreground" />
              <div>
                <CardDescription className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {tx.income}
                </CardDescription>
                <CardTitle className="mt-1 text-2xl text-foreground">{formatCurrency(selectedSummary.income, summaryCurrency)}</CardTitle>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <ArrowUpIcon className="size-3.5" />
              <span>{tx.incomeCount(selectedSummary.incomeTransactions)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <ArrowDownIcon className="size-5 shrink-0 text-muted-foreground" />
              <div>
                <CardDescription className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {tx.expenses}
                </CardDescription>
                <CardTitle className="mt-1 text-2xl text-foreground">{formatCurrency(selectedSummary.expenses, summaryCurrency)}</CardTitle>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <ArrowDownIcon className="size-3.5" />
              <span>{tx.expenseCount(selectedSummary.expenseTransactions)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <ScaleIcon className="size-5 shrink-0 text-muted-foreground" />
              <div>
                <CardDescription className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {tx.netBalance}
                </CardDescription>
                <CardTitle className="mt-1 text-2xl text-foreground">{formatCurrency(selectedSummary.balance, summaryCurrency)}</CardTitle>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              {selectedSummary.balance >= 0 ? <ArrowUpIcon className="size-3.5" /> : <ArrowDownIcon className="size-3.5" />}
              <span>{tx.totalCount(selectedSummary.transactions)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs
        value={activeView}
        onValueChange={(value) => setActiveView(value as TransactionsView)}
        className="order-5"
      >
        <TabsList>
          <TabsTrigger value="movements">{t.pendingInbox.tabMovements}</TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            {t.pendingInbox.tabPending}
            {pending.items.length > 0 && (
              <Badge
                variant="secondary"
                className="rounded-full px-2"
                aria-label={t.pendingInbox.count(pending.items.length)}
              >
                {pending.items.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeView === "pending" && (
        <PendingInbox pending={pending} onConfirmed={handlePendingConfirmed} className="order-5" />
      )}

      <Card className={activeView === "movements" ? "order-5" : "hidden"}>
        <CardHeader>
          <CardTitle>{tx.historyTitle}</CardTitle>
          <CardDescription>{tx.historyDescription}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,1fr))_auto]">
              <div className="flex min-w-0 flex-col gap-1 lg:col-span-2 xl:col-span-1">
                <Label htmlFor="search-query" className="text-xs text-muted-foreground">
                  {tx.search}
                </Label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search-query"
                    placeholder={tx.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full border-border/70 bg-card pl-9"
                  />
                </div>
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <Label className="text-xs text-muted-foreground">{tx.status}</Label>
                <Popover open={isStatusPickerOpen} onOpenChange={setIsStatusPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={isStatusPickerOpen} className="w-full justify-between bg-card font-normal">
                      <span className="truncate">
                        {filterStatus.length === 0
                          ? tx.noStatus
                          : filterStatus.length === transactionStatusFilterOptions.length
                            ? tx.all
                            : transactionStatusFilterOptions
                                .filter(([value]) => filterStatus.includes(value))
                                .map(([, label]) => label)
                                .join(", ")}
                      </span>
                      <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[200px] p-0">
                    <Command>
                      <CommandList>
                        <CommandGroup>
                          <CommandItem
                            value={tx.all}
                            onSelect={() => {
                              setFilterStatus((current) =>
                                current.length === transactionStatusFilterOptions.length
                                  ? [...defaultTransactionStatuses]
                                  : transactionStatusFilterOptions.map(([value]) => value),
                              )
                              setCurrentPage(1)
                            }}
                          >
                            <Checkbox
                              checked={filterStatus.length === transactionStatusFilterOptions.length}
                              tabIndex={-1}
                            />
                            {tx.all}
                          </CommandItem>
                          {transactionStatusFilterOptions.map(([value, label]) => (
                            <CommandItem
                              key={value}
                              value={label}
                              onSelect={() => {
                                setFilterStatus((current) =>
                                  current.includes(value)
                                    ? current.filter((status) => status !== value)
                                    : [...current, value],
                                )
                                setCurrentPage(1)
                              }}
                            >
                              <Checkbox checked={filterStatus.includes(value)} tabIndex={-1} />
                              {label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <Label className="text-xs text-muted-foreground">{tx.paymentMethod}</Label>
                <Select value={filterPaymentMethod} onValueChange={(value) => {
                  setFilterPaymentMethod(value)
                  setCurrentPage(1)
                }}>
                  <SelectTrigger className="w-full bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{tx.all}</SelectItem>
                    {paymentMethodFilterOptions.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <Label className="text-xs text-muted-foreground">{tx.type}</Label>
                <Select value={filterType} onValueChange={(value) => {
                  setFilterType(value as "all" | "Income" | "Expense")
                  setFilterCategory("all")
                  setCurrentPage(1)
                }}>
                  <SelectTrigger className="w-full bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{tx.all}</SelectItem>
                    <SelectItem value="Expense">{tx.expenses}</SelectItem>
                    <SelectItem value="Income">{tx.income}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <Label className="text-xs text-muted-foreground">{tx.category}</Label>
                <Popover open={isCategoryPickerOpen} onOpenChange={setIsCategoryPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isCategoryPickerOpen}
                      className="w-full justify-between border-border/70 bg-card font-normal disabled:bg-card disabled:opacity-55"
                      disabled={filterType === "all"}
                    >
                      {filterType === "all"
                        ? tx.selectTypeFirst
                        : filterCategory === "all"
                        ? tx.all
                        : categoryFilterOptions.find(([value]) => value === filterCategory)?.[1] ?? filterCategory}
                      <ChevronsUpDown className="size-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder={tx.searchCategory} />
                      <CommandList>
                        <CommandEmpty>{tx.categoryNotFound}</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value={tx.all}
                            onSelect={() => {
                              setFilterCategory("all")
                              setCurrentPage(1)
                              setIsCategoryPickerOpen(false)
                            }}
                          >
                            <Check className={`size-4 ${filterCategory === "all" ? "opacity-100" : "opacity-0"}`} />
                            {tx.all}
                          </CommandItem>
                          {categoryFilterOptions.map(([value, label]) => (
                            <CommandItem
                              key={value}
                              value={label}
                              onSelect={() => {
                                setFilterCategory(value)
                                setCurrentPage(1)
                                setIsCategoryPickerOpen(false)
                              }}
                            >
                              <Check className={`size-4 ${filterCategory === value ? "opacity-100" : "opacity-0"}`} />
                              {label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className={`size-9 self-end ${hasActiveFilters ? "" : "invisible pointer-events-none"}`}
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                aria-label={tx.clearFilters}
                title={tx.clearFilters}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <Button variant="outline" className="w-full shrink-0 xl:w-auto" onClick={handleExport} disabled={isExporting}>
              <DownloadIcon className="size-4" />
              {isExporting ? tx.exporting : tx.export}
            </Button>
          </div>
        </CardContent>
        <CardContent>
          <div className={`${shouldShowPagination ? "min-h-[520px]" : "min-h-[220px]"} w-full`}>
            <Table className="w-full table-auto">
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    className={transactionTableHeadClassName}
                    label={tx.columnDate}
                    field="OccurredOn"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <SortableTableHead
                    className={transactionTableHeadClassName}
                    label={tx.columnDescription}
                    field="Description"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <SortableTableHead
                    className={transactionTableHeadClassName}
                    label={tx.columnCategory}
                    field="Category"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <SortableTableHead
                    className={transactionTableHeadClassName}
                    label={tx.columnPaymentMethod}
                    field="PaymentMethod"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <SortableTableHead
                    className={transactionTableHeadClassName}
                    label={t.pendingInbox.columnSource}
                    field="Source"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <SortableTableHead
                    className={transactionTableHeadClassName}
                    label={tx.columnStatus}
                    field="Status"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <SortableTableHead
                    className={transactionTableHeadClassName}
                    label={tx.columnAmount}
                    field="Amount"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <TableHead className={transactionTableHeadClassName}>{tx.columnActions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTransactions ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-4 text-center text-muted-foreground">
                      {tx.loading}
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-4 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2 py-4">
                        <span>
                          {hasActiveFilters
                            ? tx.noMatches
                            : tx.empty}
                        </span>
                        {hasActiveFilters && (
                          <Button variant="outline" size="sm" onClick={clearFilters}>
                            {tx.clearFilters}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => {
                    const CategoryIcon = getCategoryIcon(transaction.category)
                    const categoryLabels: Record<string, string> =
                      transaction.type === "Income" ? t.labels.incomeCategories : t.labels.expenseCategories
                    const categoryLabel = categoryLabels[transaction.category] ?? transaction.category
                    const PaymentMethodIcon = getPaymentMethodIcon(transaction.paymentMethod)
                    const paymentMethodLabel = t.labels.paymentMethods[transaction.paymentMethod] ?? transaction.paymentMethod

                    return (
                      <TableRow key={transaction.id}>
                        <TableCell className={`${transactionTableCellClassName} font-medium`}>
                          {formatDate(transaction.occurredOn)}
                        </TableCell>
                        <TableCell className={`${transactionTableCellClassName} max-w-[240px]`}>
                          <span className="block truncate" title={transaction.description}>
                            {transaction.description}
                          </span>
                        </TableCell>
                        <TableCell className={transactionTableCellClassName}>
                          <div className="flex items-center gap-2" title={categoryLabel}>
                            <CategoryIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <span className="truncate text-sm text-foreground">{categoryLabel}</span>
                          </div>
                        </TableCell>
                        <TableCell className={`${transactionTableCellClassName} text-muted-foreground`}>
                          <div className="flex items-center gap-2" title={paymentMethodLabel}>
                            <PaymentMethodIcon className="size-4 shrink-0" aria-hidden="true" />
                            <span className="truncate text-sm">{paymentMethodLabel}</span>
                          </div>
                        </TableCell>
                        <TableCell className={`${transactionTableCellClassName} text-sm text-muted-foreground`}>
                          {t.pendingInbox.sources[transaction.source] ?? transaction.source}
                        </TableCell>
                        <TableCell className={transactionTableCellClassName}>
                          <Badge
                            variant="outline"
                            className={`gap-1 rounded-full font-medium ${
                              transaction.status === "Confirmed"
                                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300"
                                : "border-amber-500/40 bg-amber-500/10 text-amber-600"
                            }`}
                          >
                            {transaction.status === "Confirmed" ? (
                              <CheckCircle2 className="size-3" />
                            ) : (
                              <Clock className="size-3" />
                            )}
                            {t.labels.transactionStatuses[transaction.status] ?? transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell className={transactionTableCellClassName}>
                          <span
                            className={`font-semibold ${transaction.type === "Income" ? "text-emerald-500 dark:text-emerald-300" : "text-rose-500 dark:text-rose-300"}`}
                          >
                            {transaction.type === "Income" ? "+" : "-"}
                            {formatMoney(Math.abs(transaction.amount), transaction.currency)}
                          </span>
                        </TableCell>
                        <TableCell className={transactionTableCellClassName}>
                          <TransactionActionsMenu
                            transaction={transaction}
                            onEdit={openEditTransactionDialog}
                            onDelete={openDeleteTransactionDialog}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-medium text-foreground">
                {tx.count(transactionsResponse.totalCount)}
              </span>
              <span>
                {transactionsResponse.totalCount === 0
                  ? tx.count(0)
                  : tx.showing(visibleResultsStart, visibleResultsEnd, transactionsResponse.totalCount)}
              </span>
            </div>

            {shouldShowPagination && (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Select value={String(pageSize)} onValueChange={(value) => {
                  setPageSize(Number(value))
                  setCurrentPage(1)
                }}>
                  <SelectTrigger className="h-9 w-full sm:w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">{tx.perPage(10)}</SelectItem>
                    <SelectItem value="20">{tx.perPage(20)}</SelectItem>
                    <SelectItem value="30">{tx.perPage(30)}</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={tx.previousPage}
                  disabled={transactionsResponse.pageNumber <= 1}
                  onClick={() => setCurrentPage((page) => page - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="min-w-[84px] text-center">
                  {tx.pageOf(transactionsResponse.pageNumber, transactionsResponse.totalPages)}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={tx.nextPage}
                  disabled={transactionsResponse.pageNumber >= transactionsResponse.totalPages}
                  onClick={() => setCurrentPage((page) => page + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <PendingReviewDialogs review={scanReview} />
    </div>
  )
}
