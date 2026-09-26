"use client"

import type React from "react"

import { useState, useRef, useEffect, useLayoutEffect } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  FilterIcon,
  DownloadIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ScanLine,
  Send,
  Upload,
  Camera,
  CheckCircle2,
  Check,
  ChevronsUpDown,
  Info,
  ScaleIcon,
  Clock,
  Sparkles,
  MessageSquare,
  Video,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  createTransaction,
  deleteTransaction,
  expenseCategoryLabels,
  getTransactionSummary,
  incomeCategoryLabels,
  listTransactions,
  paymentMethodLabels,
  transactionStatusLabels,
  type PaymentMethod,
  type TransactionDto,
  type TransactionSummaryResponse,
  type TransactionsResponse,
  updateTransaction,
} from "@/lib/api/transactions"
import { AddTransactionForm } from "@/components/transactions/add-transaction-form"
import { TransactionActionsMenu } from "@/components/transactions/transaction-actions-menu"
import { getCategoryIcon, getPaymentMethodIcon } from "@/components/transactions/transaction-icons"
import { isApiError } from "@/lib/api/errors"

const emptyTransactionsResponse: TransactionsResponse = {
  items: [],
  pageNumber: 1,
  pageSize: 10,
  totalCount: 0,
  totalPages: 1,
}

const emptyTransactionSummary: TransactionSummaryResponse = {
  totalExpenseArs: 0,
  totalExpenseUsd: 0,
  totalIncomeArs: 0,
  totalIncomeUsd: 0,
  totalTransactions: 0,
  totalExpenseTransactions: 0,
  totalIncomeTransactions: 0,
}

// Métodos de pago para el filtro, ordenados alfabéticamente
const paymentMethodFilterOptions = (Object.entries(paymentMethodLabels) as [PaymentMethod, string][]).sort(
  ([, labelA], [, labelB]) => labelA.localeCompare(labelB, "es"),
)

const monthNames = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]

const transactionTableHeadClassName = "py-3 pr-2 text-left align-middle whitespace-nowrap"
const transactionTableCellClassName = "py-3 pr-2 align-middle whitespace-nowrap"

function formatDateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseDateInput(value: string): Date {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function getCurrentMonthStart(): string {
  const now = new Date()
  return formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1))
}

function getToday(): string {
  return formatDateInput(new Date())
}

function getPeriodLabel(dateFrom: string, dateTo: string): string {
  if (!dateFrom && !dateTo) return "Mostrando todos los períodos"
  if (!dateFrom || !dateTo) {
    const from = dateFrom ? parseDateInput(dateFrom).toLocaleDateString("es-AR") : "el inicio"
    const to = dateTo ? parseDateInput(dateTo).toLocaleDateString("es-AR") : "hoy"
    return `Período: desde ${from} hasta ${to}`
  }

  const from = parseDateInput(dateFrom)
  const to = parseDateInput(dateTo)
  const isFullCalendarMonth =
    from.getDate() === 1 && from.getFullYear() === to.getFullYear() && from.getMonth() === to.getMonth()

  if (isFullCalendarMonth) {
    return `Período: mes de ${monthNames[from.getMonth()]} ${from.getFullYear()}`
  }

  return `Período: ${from.toLocaleDateString("es-AR")} – ${to.toLocaleDateString("es-AR")}`
}

export default function TransactionsPage() {
  const searchParams = useSearchParams()
  const [transactionsResponse, setTransactionsResponse] = useState(emptyTransactionsResponse)
  const [transactionSummary, setTransactionSummary] = useState(emptyTransactionSummary)
  const [summaryRefreshKey, setSummaryRefreshKey] = useState(0)
  const [isSummaryReady, setIsSummaryReady] = useState(false)
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "Income" | "Expense">("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("all")
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false)
  const [dateFrom, setDateFrom] = useState(() => getCurrentMonthStart())
  const [dateTo, setDateTo] = useState(() => getToday())
  const [dateFromDraft, setDateFromDraft] = useState(() => getCurrentMonthStart())
  const [dateToDraft, setDateToDraft] = useState(() => getToday())
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<TransactionDto | null>(null)
  const [transactionToDelete, setTransactionToDelete] = useState<TransactionDto | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isOcrDialogOpen, setIsOcrDialogOpen] = useState(false)
  const [isTelegramDialogOpen, setIsTelegramDialogOpen] = useState(false)
  const [ocrImage, setOcrImage] = useState<string | null>(null)
  const [ocrProcessing, setOcrProcessing] = useState(false)
  const [ocrResult, setOcrResult] = useState<{
    amount: number
    description: string
    category: string
    date: string
    confidence: number
  } | null>(null)
  const [telegramMessage, setTelegramMessage] = useState("")
  const [telegramProcessing, setTelegramProcessing] = useState(false)
  const [telegramResult, setTelegramResult] = useState<{
    type: "income" | "expense"
    amount: number
    description: string
    category: string
    date: string
  } | null>(null)
  const [useCameraMode, setUseCameraMode] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const summaryRequestKey = useRef<string | null>(null)
  const scrollPositionRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
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
          title: "No se pudo cargar el resumen",
          description: error instanceof Error ? error.message : "Intenta de nuevo en unos segundos.",
          variant: "destructive",
        })
      })
      .finally(() => {
        setIsSummaryReady(true)
      })
  }, [dateFrom, dateTo, summaryRefreshKey, toast])

  // Detectar parámetro mode=ocr en la URL
  useEffect(() => {
    const mode = searchParams.get('mode')
    if (mode === 'ocr') {
      setIsOcrDialogOpen(true)
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
            ? (filterCategory as keyof typeof expenseCategoryLabels)
            : undefined,
        incomeCategory:
          filterType === "Income" && filterCategory !== "all"
            ? (filterCategory as keyof typeof incomeCategoryLabels)
            : undefined,
        status: filterStatus === "all" ? undefined : (filterStatus as "Confirmed" | "Pending"),
        paymentMethod: filterPaymentMethod === "all" ? undefined : (filterPaymentMethod as PaymentMethod),
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
        .then(setTransactionsResponse)
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return
          toast({
            title: "No se pudo cargar el listado",
            description: error instanceof Error ? error.message : "Intenta de nuevo en unos segundos.",
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
    pageSize,
    searchQuery,
    toast,
  ])

  // Limpiar stream de cámara al cerrar modal
  useEffect(() => {
    if (!isOcrDialogOpen) {
      stopCamera()
      setUseCameraMode(false)
      setOcrImage(null)
      setOcrResult(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOcrDialogOpen])

  useEffect(() => {
    if (isAddDialogOpen || isOcrDialogOpen || isTelegramDialogOpen) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      document.body.style.pointerEvents = ""
      document.body.style.overflow = ""
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [isAddDialogOpen, isOcrDialogOpen, isTelegramDialogOpen])

  const transactions = transactionsResponse.items
  const filteredTransactions = transactions
  const categoryFilterOptions = filterType === "Expense"
    ? Object.entries(expenseCategoryLabels)
    : filterType === "Income"
      ? Object.entries(incomeCategoryLabels)
      : []

  const defaultDateFrom = getCurrentMonthStart()
  const defaultDateTo = getToday()
  const periodLabel = getPeriodLabel(dateFrom, dateTo)
  const shouldShowPagination = transactionsResponse.totalPages > 1
  const visibleResultsStart = transactionsResponse.totalCount === 0 ? 0 : (transactionsResponse.pageNumber - 1) * pageSize + 1
  const visibleResultsEnd = transactionsResponse.totalCount === 0 ? 0 : Math.min(transactionsResponse.pageNumber * pageSize, transactionsResponse.totalCount)

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    filterType !== "all" ||
    filterCategory !== "all" ||
    filterStatus !== "all" ||
    filterPaymentMethod !== "all" ||
    dateFrom !== defaultDateFrom ||
    dateTo !== defaultDateTo

  const clearFilters = () => {
    setSearchQuery("")
    setFilterType("all")
    setFilterCategory("all")
    setFilterStatus("all")
    setFilterPaymentMethod("all")
    setDateFrom(defaultDateFrom)
    setDateTo(defaultDateTo)
    setDateFromDraft(defaultDateFrom)
    setDateToDraft(defaultDateTo)
    setCurrentPage(1)
  }

  const closeTransactionDialog = () => {
    setIsAddDialogOpen(false)
    setEditingTransaction(null)
  }

  const openCreateTransactionDialog = () => {
    setEditingTransaction(null)
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
        title: "Transacción eliminada",
        description: "La transacción se eliminó correctamente.",
      })
    } catch (error) {
      toast({
        title: error instanceof Error && isApiError(error) && error.status === 404
          ? "Transacción no encontrada"
          : "No se pudo eliminar la transacción",
        description: error instanceof Error && isApiError(error) && error.status === 404
          ? "La transacción no existe o no pertenece al usuario."
          : error instanceof Error
            ? error.message
            : "Intenta de nuevo en unos segundos.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleTransactionDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      closeTransactionDialog()
    }
  }

  const applyDateFilter = () => {
    setDateFrom(dateFromDraft)
    setDateTo(dateToDraft)
    setCurrentPage(1)
    setSummaryRefreshKey((key) => key + 1)
  }

  const totalIncome = {
    ARS: transactionSummary.totalIncomeArs,
    USD: transactionSummary.totalIncomeUsd,
  }
  const totalExpense = {
    ARS: transactionSummary.totalExpenseArs,
    USD: transactionSummary.totalExpenseUsd,
  }
  const balanceByCurrency = {
    ARS: totalIncome.ARS - totalExpense.ARS,
    USD: totalIncome.USD - totalExpense.USD,
  }

  // Función de formateo consistente
  const formatCurrency = (amount: number, currency: string) =>
    `${currency === "USD" ? "US$" : "$"}${amount.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`

  const renderCurrencyTotals = (totals: Record<string, number>) => (
    <div className="space-y-1">
      <div>{formatCurrency(totals.ARS ?? 0, "ARS")}</div>
      <div className="text-base text-muted-foreground">{formatCurrency(totals.USD ?? 0, "USD")}</div>
    </div>
  )

  const handleExportCSV = () => {
    // Crear encabezados del CSV
    const headers = ["Fecha", "Descripción", "Categoría", "Método de Pago", "Tipo", "Fuente", "Monto"]

    // Crear filas de datos
    const rows = filteredTransactions.map((transaction) => {
      const date = new Date(transaction.occurredOn).toLocaleDateString("es-ES")
      const type = transaction.type === "Income" ? "Ingreso" : "Gasto"
      const amount = transaction.type === "Income" ? `+${transaction.amount.toFixed(2)}` : `-${transaction.amount.toFixed(2)}`

      return [date, transaction.description, transaction.category, transaction.paymentMethod, type, transaction.source, amount]
    })

    // Combinar encabezados y filas
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    // Crear blob y descargar
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", `transacciones_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      setStream(mediaStream)
      setUseCameraMode(true)

      // Esperar a que el componente se monte antes de asignar el stream
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          // Asegurar que el video se reproduzca
          videoRef.current.play().catch(err => {
            console.error('Error playing video:', err)
          })
        }
      }, 100)

      toast({
        title: "Cámara activada",
        description: "Posiciona el ticket y toma una foto",
      })
    } catch (error) {
      toast({
        title: "Error al acceder a la cámara",
        description: "Verifica los permisos de tu navegador",
        variant: "destructive",
      })
      console.error('Error accessing camera:', error)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setUseCameraMode(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL('image/jpeg')
        setOcrImage(imageData)
        stopCamera()
        setUseCameraMode(false)
        toast({
          title: "Foto capturada",
          description: "Ahora procesa la imagen con OCR",
        })
      }
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setOcrImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const processOCR = () => {
    setOcrProcessing(true)
    // Simular procesamiento OCR
    setTimeout(() => {
      setOcrResult({
        amount: 1250.50,
        description: "Supermercado Día",
        category: "Comida",
        date: new Date().toISOString().split("T")[0],
        confidence: 95,
      })
      setOcrProcessing(false)
      toast({
        title: "¡Ticket procesado!",
        description: "Los datos han sido extraídos exitosamente",
      })
    }, 2000)
  }

  const processTelegramMessage = () => {
    setTelegramProcessing(true)
    // Simular procesamiento de mensaje en lenguaje natural
    setTimeout(() => {
      // Detectar si es ingreso o gasto
      const isIncome = telegramMessage.toLowerCase().includes("ingreso") ||
                       telegramMessage.toLowerCase().includes("cobré") ||
                       telegramMessage.toLowerCase().includes("cobro")

      // Extraer monto (buscar números con $ o sin)
      const amountMatch = telegramMessage.match(/\$?\s*(\d+(?:[.,]\d+)?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1].replace(",", ".")) : 0

      // Detectar categoría básica
      let category = "Otros"
      if (telegramMessage.toLowerCase().includes("comida") ||
          telegramMessage.toLowerCase().includes("almuerzo") ||
          telegramMessage.toLowerCase().includes("cena") ||
          telegramMessage.toLowerCase().includes("supermercado")) {
        category = "Comida"
      } else if (telegramMessage.toLowerCase().includes("transporte") ||
                 telegramMessage.toLowerCase().includes("uber") ||
                 telegramMessage.toLowerCase().includes("taxi")) {
        category = "Transporte"
      } else if (telegramMessage.toLowerCase().includes("freelance") ||
                 telegramMessage.toLowerCase().includes("proyecto")) {
        category = "Freelance"
      }

      setTelegramResult({
        type: isIncome ? "income" : "expense",
        amount: amount,
        description: telegramMessage,
        category: category,
        date: new Date().toISOString().split("T")[0],
      })
      setTelegramProcessing(false)
      toast({
        title: "¡Mensaje procesado!",
        description: "Transacción detectada correctamente",
      })
    }, 1500)
  }

  const saveOcrTransaction = () => {
    toast({
      title: "Transacción guardada",
      description: "La transacción ha sido agregada exitosamente",
    })
    setIsOcrDialogOpen(false)
    setOcrImage(null)
    setOcrResult(null)
  }

  const saveTelegramTransaction = () => {
    toast({
      title: "Transacción guardada",
      description: "La transacción ha sido agregada exitosamente",
    })
    setIsTelegramDialogOpen(false)
    setTelegramMessage("")
    setTelegramResult(null)
  }

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden pr-1 sm:pr-2">
      <div className="w-full max-w-full space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-balance">Transacciones</h1>
          <p className="text-muted-foreground mt-1">Rastrea y gestiona tus ingresos y gastos</p>

          <Card className="mt-4 w-full border-border/70 bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Dialog open={isOcrDialogOpen} onOpenChange={setIsOcrDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <ScanLine className="size-4" />
                  Escanear Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Escanear Ticket con OCR</DialogTitle>
                  <DialogDescription>Sube una foto o usa la cámara para escanear tu ticket</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {!ocrImage && !useCameraMode ? (
                    <div className="space-y-4">
                      <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <Camera className="size-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground mb-4">
                          Arrastra una imagen o usa una de las opciones
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                            <Upload className="size-4 mr-2" />
                            Subir Imagen
                          </Button>
                          <Button onClick={startCamera}>
                            <Video className="size-4 mr-2" />
                            Usar Cámara
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : useCameraMode ? (
                    <div className="space-y-4">
                      <div className="relative rounded-lg overflow-hidden border">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full max-h-[400px] object-contain"
                        />
                        <canvas ref={canvasRef} className="hidden" />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={capturePhoto} className="flex-1">
                          <Camera className="size-4 mr-2" />
                          Tomar Foto
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            stopCamera()
                            setUseCameraMode(false)
                          }}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {ocrImage && (
                        <div className="relative rounded-lg overflow-hidden border">
                          <Image src={ocrImage} alt="Ticket" width={600} height={300} className="w-full max-h-[300px] object-contain" />
                        </div>
                      )}

                      {!ocrResult && !ocrProcessing && (
                        <Button onClick={processOCR} className="w-full">
                          <Sparkles className="size-4 mr-2" />
                          Procesar con OCR
                        </Button>
                      )}

                      {ocrProcessing && (
                        <Alert>
                          <Sparkles className="h-4 w-4 animate-pulse" />
                          <AlertDescription>
                            Procesando imagen... Esto puede tomar unos segundos.
                          </AlertDescription>
                        </Alert>
                      )}

                      {ocrResult && (
                        <div className="space-y-4">
                          <Alert>
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>
                              Datos extraídos con {ocrResult.confidence}% de confianza
                            </AlertDescription>
                          </Alert>

                          <div className="grid gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="ocr-amount">Monto</Label>
                              <Input
                                id="ocr-amount"
                                type="number"
                                defaultValue={ocrResult.amount}
                                step="0.01"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="ocr-description">Descripción</Label>
                              <Input
                                id="ocr-description"
                                defaultValue={ocrResult.description}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="ocr-category">Categoría</Label>
                              <Select defaultValue={ocrResult.category}>
                                <SelectTrigger id="ocr-category">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Comida">Comida</SelectItem>
                                  <SelectItem value="Transporte">Transporte</SelectItem>
                                  <SelectItem value="Servicios">Servicios</SelectItem>
                                  <SelectItem value="Entretenimiento">Entretenimiento</SelectItem>
                                  <SelectItem value="Otros">Otros</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="ocr-date">Fecha</Label>
                              <Input
                                id="ocr-date"
                                type="date"
                                defaultValue={ocrResult.date}
                              />
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button onClick={saveOcrTransaction} className="flex-1">
                              Guardar Transacción
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setOcrImage(null)
                                setOcrResult(null)
                              }}
                            >
                              Nueva Imagen
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isTelegramDialogOpen} onOpenChange={setIsTelegramDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={(e) => {
                    e.preventDefault()
                    window.open('https://t.me/fingrowapp_bot', '_blank')
                  }}
                >
                  <Send className="size-4" />
                  Mensaje Telegram
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Procesar Mensaje de Telegram</DialogTitle>
                  <DialogDescription>
                    Escribe un mensaje en lenguaje natural para registrar una transacción
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="telegram-message">Mensaje</Label>
                    <Textarea
                      id="telegram-message"
                      placeholder="Ej: Gasté $1500 en el almuerzo con el equipo"
                      value={telegramMessage}
                      onChange={(e) => setTelegramMessage(e.target.value)}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ejemplos: &quot;Pagué $500 en supermercado&quot;, &quot;Ingreso de $10000 por freelance&quot;
                    </p>
                  </div>

                  {!telegramResult && !telegramProcessing && (
                    <Button
                      onClick={processTelegramMessage}
                      className="w-full"
                      disabled={!telegramMessage.trim()}
                    >
                      <MessageSquare className="size-4 mr-2" />
                      Procesar Mensaje
                    </Button>
                  )}

                  {telegramProcessing && (
                    <Alert>
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      <AlertDescription>
                        Analizando mensaje con IA...
                      </AlertDescription>
                    </Alert>
                  )}

                  {telegramResult && (
                    <div className="space-y-4">
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>
                          {telegramResult.type === "income" ? "Ingreso" : "Gasto"} detectado correctamente
                        </AlertDescription>
                      </Alert>

                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tg-type">Tipo</Label>
                          <Select defaultValue={telegramResult.type}>
                            <SelectTrigger id="tg-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="income">Ingreso</SelectItem>
                              <SelectItem value="expense">Gasto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tg-amount">Monto</Label>
                          <Input
                            id="tg-amount"
                            type="number"
                            defaultValue={telegramResult.amount}
                            step="0.01"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tg-description">Descripción</Label>
                          <Input
                            id="tg-description"
                            defaultValue={telegramResult.description}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tg-category">Categoría</Label>
                          <Select defaultValue={telegramResult.category}>
                            <SelectTrigger id="tg-category">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Comida">Comida</SelectItem>
                              <SelectItem value="Transporte">Transporte</SelectItem>
                              <SelectItem value="Servicios">Servicios</SelectItem>
                              <SelectItem value="Entretenimiento">Entretenimiento</SelectItem>
                              <SelectItem value="Freelance">Freelance</SelectItem>
                              <SelectItem value="Salario">Salario</SelectItem>
                              <SelectItem value="Otros">Otros</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={saveTelegramTransaction} className="flex-1">
                          Guardar Transacción
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setTelegramMessage("")
                            setTelegramResult(null)
                          }}
                        >
                          Nuevo Mensaje
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddDialogOpen} onOpenChange={handleTransactionDialogChange}>
              <Button className="w-full" onClick={openCreateTransactionDialog}>
                <PlusIcon className="size-4" />
                Agregar Transacción
              </Button>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingTransaction ? "Editar transacción" : "Agregar Nueva Transacción"}</DialogTitle>
                  <DialogDescription>
                    {editingTransaction ? "Actualiza los datos del movimiento seleccionado." : "Registra un nuevo ingreso o gasto"}
                  </DialogDescription>
                </DialogHeader>
                <AddTransactionForm
                  mode={editingTransaction ? "edit" : "create"}
                  initialTransaction={editingTransaction}
                  onSubmit={async (payload) => {
                    if (editingTransaction) {
                      const updated = await updateTransaction(editingTransaction.id, payload)
                      setTransactionsResponse((previous) => ({
                        ...previous,
                        items: previous.items.map((item) => (item.id === updated.id ? updated : item)),
                      }))
                      setSummaryRefreshKey((key) => key + 1)
                      toast({
                        title: "Transacción actualizada",
                        description: "Los cambios se guardaron correctamente.",
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
                      title: "Transacción guardada",
                      description: "La transacción ha sido agregada exitosamente",
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
                  <AlertDialogTitle>¿Eliminar transacción?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Vas a eliminar la transacción de {transactionToDelete?.description ?? ""} por {transactionToDelete
                      ? `${transactionToDelete.currency === "USD" ? "US$" : "$"}${transactionToDelete.amount.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} ${transactionToDelete.currency}`
                      : ""}. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                    onClick={(event) => {
                      event.preventDefault()
                      void handleDeleteTransaction()
                    }}
                  >
                    {isDeleting ? "Eliminando..." : "Confirmar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 w-full max-w-3xl space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,170px)_minmax(0,170px)_minmax(0,1fr)_auto] sm:items-end">
              <div className="flex min-w-0 flex-col gap-1">
                <Label htmlFor="date-from" className="text-xs text-muted-foreground">
                  Desde
                </Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFromDraft}
                  max={dateToDraft || undefined}
                  onChange={(e) => setDateFromDraft(e.target.value)}
                  className="w-full bg-white"
                />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <Label htmlFor="date-to" className="text-xs text-muted-foreground">
                  Hasta
                </Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateToDraft}
                  min={dateFromDraft || undefined}
                  onChange={(e) => setDateToDraft(e.target.value)}
                  className="w-full bg-white"
                />
              </div>
              <div className="rounded-md border border-border/60 bg-white px-3 py-2 text-sm text-muted-foreground">
                {periodLabel}
              </div>
              <Button size="sm" className="h-8 w-full px-3 sm:w-auto" onClick={applyDateFilter}>
                <FilterIcon className="size-4" />
                Filtrar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-border bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <ArrowUpIcon className="size-5 shrink-0 text-success" />
              <div>
                <CardDescription className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Ingresos
                </CardDescription>
                <CardTitle className="mt-1 space-y-1 text-2xl text-success">{renderCurrencyTotals(totalIncome)}</CardTitle>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-success">
              <ArrowUpIcon className="size-3.5" />
              <span>{transactionSummary.totalIncomeTransactions} ingresos</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <ArrowDownIcon className="size-5 shrink-0 text-muted-foreground" />
              <div>
                <CardDescription className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Gastos
                </CardDescription>
                <CardTitle className="mt-1 space-y-1 text-2xl">{renderCurrencyTotals(totalExpense)}</CardTitle>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <ArrowDownIcon className="size-3.5" />
              <span>{transactionSummary.totalExpenseTransactions} gastos</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-primary/20 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <ScaleIcon className="size-5 shrink-0 text-muted-foreground" />
              <div>
                <CardDescription className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Balance Neto
                </CardDescription>
                <CardTitle className="mt-1 space-y-1 text-2xl text-success">{renderCurrencyTotals(balanceByCurrency)}</CardTitle>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <ArrowUpIcon className="size-3.5" />
              <span>{transactionSummary.totalTransactions} transacciones totales</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert className="border-sky-200 bg-sky-50 text-sky-900">
        <AlertDescription className="flex flex-wrap items-center gap-1.5 text-sky-900">
          <span>Los movimientos pendientes no se incluyen en los totales hasta que sean confirmados.</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 rounded-full text-sky-700 hover:bg-sky-100 hover:text-sky-800"
                aria-label="Más información sobre el cálculo de los totales"
              >
                <Info className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 text-sm">
              <p className="font-medium">¿Cómo se calculan los totales?</p>
              <p className="mt-1 text-muted-foreground">
                Ingresos, gastos y balance neto solo suman las transacciones con estado{" "}
                <strong className="text-foreground">Confirmada</strong>. Las transacciones{" "}
                <strong className="text-foreground">Pendientes</strong> (por ejemplo, las que llegan de
                integraciones como Mercado Pago) se excluyen de estos cálculos hasta que las confirmes.
              </p>
            </PopoverContent>
          </Popover>
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,1fr))_auto]">
              <div className="flex min-w-0 flex-col gap-1 lg:col-span-2 xl:col-span-1">
                <Label htmlFor="search-query" className="text-xs text-muted-foreground">
                  Buscar
                </Label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search-query"
                    placeholder="Buscar transacciones..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full border-border/70 bg-white pl-9"
                  />
                </div>
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Estado</Label>
                <Select value={filterStatus} onValueChange={(value) => {
                  setFilterStatus(value)
                  setCurrentPage(1)
                }}>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Confirmed">Confirmada</SelectItem>
                    <SelectItem value="Pending">Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Método de pago</Label>
                <Select value={filterPaymentMethod} onValueChange={(value) => {
                  setFilterPaymentMethod(value)
                  setCurrentPage(1)
                }}>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {paymentMethodFilterOptions.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Tipo</Label>
                <Select value={filterType} onValueChange={(value) => {
                  setFilterType(value as "all" | "Income" | "Expense")
                  setFilterCategory("all")
                  setCurrentPage(1)
                }}>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Expense">Gastos</SelectItem>
                    <SelectItem value="Income">Ingresos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Categoría</Label>
                <Popover open={isCategoryPickerOpen} onOpenChange={setIsCategoryPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isCategoryPickerOpen}
                      className="w-full justify-between border-border/70 bg-white font-normal disabled:bg-white disabled:opacity-55"
                      disabled={filterType === "all"}
                    >
                      {filterType === "all"
                        ? "Seleccioná un tipo"
                        : filterCategory === "all"
                        ? "Todos"
                        : categoryFilterOptions.find(([value]) => value === filterCategory)?.[1] ?? filterCategory}
                      <ChevronsUpDown className="size-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar categoría..." />
                      <CommandList>
                        <CommandEmpty>No se encontró la categoría.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="Todos"
                            onSelect={() => {
                              setFilterCategory("all")
                              setCurrentPage(1)
                              setIsCategoryPickerOpen(false)
                            }}
                          >
                            <Check className={`size-4 ${filterCategory === "all" ? "opacity-100" : "opacity-0"}`} />
                            Todos
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
                aria-label="Limpiar filtros"
                title="Limpiar filtros"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <Button variant="outline" className="w-full shrink-0 xl:w-auto" onClick={handleExportCSV}>
              <DownloadIcon className="size-4" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Transacciones</CardTitle>
          <CardDescription>Todas tus transacciones financieras en un solo lugar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`${shouldShowPagination ? "min-h-[520px]" : "min-h-[220px]"} w-full`}>
            <Table className="w-full table-auto">
              <TableHeader>
                <TableRow>
                  <TableHead className={transactionTableHeadClassName}>Fecha</TableHead>
                  <TableHead className={transactionTableHeadClassName}>Descripción</TableHead>
                  <TableHead className={transactionTableHeadClassName}>Categoría</TableHead>
                  <TableHead className={transactionTableHeadClassName}>Método de Pago</TableHead>
                  <TableHead className={transactionTableHeadClassName}>Estado</TableHead>
                  <TableHead className={transactionTableHeadClassName}>Monto</TableHead>
                  <TableHead className={transactionTableHeadClassName}>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTransactions ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-4 text-center text-muted-foreground">
                      Cargando movimientos...
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-4 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2 py-4">
                        <span>
                          {hasActiveFilters
                            ? "No encontramos movimientos que coincidan con esos filtros."
                            : "Todavia no cargaste ningun movimiento."}
                        </span>
                        {hasActiveFilters && (
                          <Button variant="outline" size="sm" onClick={clearFilters}>
                            Limpiar filtros
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => {
                    const CategoryIcon = getCategoryIcon(transaction.category)
                    const PaymentMethodIcon = getPaymentMethodIcon(transaction.paymentMethod)

                    return (
                      <TableRow key={transaction.id}>
                        <TableCell className={`${transactionTableCellClassName} font-medium`}>
                          {new Date(transaction.occurredOn).toLocaleDateString("es-ES", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className={`${transactionTableCellClassName} max-w-[240px]`}>
                          <span className="block truncate" title={transaction.description}>
                            {transaction.description}
                          </span>
                        </TableCell>
                        <TableCell className={transactionTableCellClassName}>
                          <div className="flex items-center gap-2" title={transaction.category}>
                            <CategoryIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <span className="truncate text-sm text-foreground">{transaction.category}</span>
                          </div>
                        </TableCell>
                        <TableCell className={`${transactionTableCellClassName} text-muted-foreground`}>
                          <div className="flex items-center gap-2" title={transaction.paymentMethod}>
                            <PaymentMethodIcon className="size-4 shrink-0" aria-hidden="true" />
                            <span className="truncate text-sm">{transaction.paymentMethod}</span>
                          </div>
                        </TableCell>
                        <TableCell className={transactionTableCellClassName}>
                          <Badge
                            variant="outline"
                            className={`gap-1 rounded-full font-medium ${
                              transaction.status === "Confirmed"
                                ? "border-success/40 bg-success/10 text-success"
                                : "border-amber-500/40 bg-amber-500/10 text-amber-600"
                            }`}
                          >
                            {transaction.status === "Confirmed" ? (
                              <CheckCircle2 className="size-3" />
                            ) : (
                              <Clock className="size-3" />
                            )}
                            {transactionStatusLabels[transaction.status] ?? transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell className={transactionTableCellClassName}>
                          <span
                            className={`font-semibold ${transaction.type === "Income" ? "text-success" : "text-foreground"}`}
                          >
                            {transaction.type === "Income" ? "+" : "-"}${transaction.amount.toFixed(2)} {transaction.currency}
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
                {transactionsResponse.totalCount} transacciones
              </span>
              <span>
                {transactionsResponse.totalCount === 0
                  ? "0 transacciones"
                  : `Mostrando ${visibleResultsStart}-${visibleResultsEnd} de ${transactionsResponse.totalCount}`}
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
                    <SelectItem value="10">10 por página</SelectItem>
                    <SelectItem value="20">20 por página</SelectItem>
                    <SelectItem value="30">30 por página</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Página anterior"
                  disabled={transactionsResponse.pageNumber <= 1}
                  onClick={() => setCurrentPage((page) => page - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="min-w-[84px] text-center">
                  Página {transactionsResponse.pageNumber} de {transactionsResponse.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Página siguiente"
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
    </div>
  )
}
