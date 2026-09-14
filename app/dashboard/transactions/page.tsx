"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  PlusIcon,
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CreditCardIcon,
  WalletIcon,
  ScanLine,
  Send,
  Upload,
  Camera,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Video,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

const mockTransactions = [
  {
    id: 1,
    type: "expense",
    category: "Comida",
    description: "Supermercado",
    amount: 8500.5,
    date: "2025-01-19",
    paymentMethod: "Tarjeta de Crédito",
    source: "Manual",
  },
  {
    id: 2,
    type: "income",
    category: "Salario",
    description: "Salario Mensual",
    amount: 550000.0,
    date: "2025-01-18",
    paymentMethod: "Transferencia Bancaria",
    source: "Manual",
  },
  {
    id: 3,
    type: "expense",
    category: "Servicios",
    description: "Factura de Luz",
    amount: 12000.0,
    date: "2025-01-17",
    paymentMethod: "Débito Automático",
    source: "Gmail",
  },
  {
    id: 4,
    type: "expense",
    category: "Comida",
    description: "Cena en Restaurante",
    amount: 4500.0,
    date: "2025-01-16",
    paymentMethod: "Tarjeta de Crédito",
    source: "Telegram",
  },
  {
    id: 5,
    type: "expense",
    category: "Transporte",
    description: "Nafta",
    amount: 6000.0,
    date: "2025-01-15",
    paymentMethod: "Tarjeta de Débito",
    source: "OCR",
  },
  {
    id: 6,
    type: "income",
    category: "Freelance",
    description: "Proyecto de Diseño Web",
    amount: 80000.0,
    date: "2025-01-14",
    paymentMethod: "PayPal",
    source: "Telegram",
  },
  {
    id: 7,
    type: "expense",
    category: "Entretenimiento",
    description: "Entradas de Cine",
    amount: 3000.0,
    date: "2025-01-13",
    paymentMethod: "Tarjeta de Crédito",
    source: "Manual",
  },
  {
    id: 8,
    type: "expense",
    category: "Servicios",
    description: "Factura de Internet",
    amount: 8000.0,
    date: "2025-01-12",
    paymentMethod: "Débito Automático",
    source: "Gmail",
  },
]

export default function TransactionsPage() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  // Detectar parámetro mode=ocr en la URL
  useEffect(() => {
    const mode = searchParams.get('mode')
    if (mode === 'ocr') {
      setIsOcrDialogOpen(true)
    }
  }, [searchParams])

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

  const filteredTransactions = mockTransactions.filter((transaction) => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || transaction.type === filterType
    return matchesSearch && matchesType
  })

  const totalIncome = mockTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = mockTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

  // Función de formateo consistente
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
  }

  const handleExportCSV = () => {
    // Crear encabezados del CSV
    const headers = ["Fecha", "Descripción", "Categoría", "Método de Pago", "Tipo", "Fuente", "Monto"]

    // Crear filas de datos
    const rows = filteredTransactions.map((transaction) => {
      const date = new Date(transaction.date).toLocaleDateString("es-ES")
      const type = transaction.type === "income" ? "Ingreso" : "Gasto"
      const amount = transaction.type === "income" ? `+${transaction.amount.toFixed(2)}` : `-${transaction.amount.toFixed(2)}`

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
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-col md:flex-row">
        <div>
          <h1 className="text-3xl font-bold text-balance">Transacciones</h1>
          <p className="text-muted-foreground mt-1">Rastrea y gestiona tus ingresos y gastos</p>
        </div>
        <div className="flex gap-2 flex-wrap mt-4">
          <Dialog open={isOcrDialogOpen} onOpenChange={setIsOcrDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
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

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="size-4" />
                Agregar Transacción
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Agregar Nueva Transacción</DialogTitle>
                <DialogDescription>Registra un nuevo ingreso o gasto</DialogDescription>
              </DialogHeader>
              <AddTransactionForm onClose={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Ingresos</CardDescription>
            <CardTitle className="text-2xl text-success">{formatCurrency(totalIncome)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <ArrowUpIcon className="size-4" />
              <span>{mockTransactions.filter((t) => t.type === "income").length} transacciones</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Gastos</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(totalExpense)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <ArrowDownIcon className="size-4" />
              <span>{mockTransactions.filter((t) => t.type === "expense").length} transacciones</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Balance Neto</CardDescription>
            <CardTitle className="text-2xl text-success">{formatCurrency(totalIncome - totalExpense)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <WalletIcon className="size-4" />
              <span>Período actual</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar transacciones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <FilterIcon className="size-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Tipos</SelectItem>
                  <SelectItem value="income">Ingresos</SelectItem>
                  <SelectItem value="expense">Gastos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={handleExportCSV}>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Método de Pago</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fuente</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {new Date(transaction.date).toLocaleDateString("es-ES", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex size-8 items-center justify-center rounded-full ${
                          transaction.type === "income" ? "bg-success/10 text-success" : "bg-muted"
                        }`}
                      >
                        {transaction.type === "income" ? (
                          <ArrowUpIcon className="size-4" />
                        ) : (
                          <CreditCardIcon className="size-4" />
                        )}
                      </div>
                      <span>{transaction.description}</span>
                    </div>
                  </TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell className="text-muted-foreground">{transaction.paymentMethod}</TableCell>
                  <TableCell>
                    <Badge variant={transaction.type === "income" ? "default" : "secondary"}>
                      {transaction.type === "income" ? "Ingreso" : "Gasto"}
                    </Badge>
                  </TableCell>
                  <TableCell>{transaction.source}</TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-semibold ${transaction.type === "income" ? "text-success" : "text-foreground"}`}
                    >
                      {transaction.type === "income" ? "+" : "-"}${transaction.amount.toFixed(2)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function AddTransactionForm({ onClose }: { onClose: () => void }) {
  const [transactionType, setTransactionType] = useState("expense")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs value={transactionType} onValueChange={setTransactionType}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expense">Gasto</TabsTrigger>
          <TabsTrigger value="income">Ingreso</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        <Label htmlFor="amount">Monto</Label>
        <Input id="amount" type="number" placeholder="0.00" step="0.01" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Input id="description" placeholder="Ingresa descripción" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categoría</Label>
        <Select>
          <SelectTrigger id="category">
            <SelectValue placeholder="Selecciona categoría" />
          </SelectTrigger>
          <SelectContent>
            {transactionType === "expense" ? (
              <>
                <SelectItem value="food">Comida y Restaurantes</SelectItem>
                <SelectItem value="transport">Transporte</SelectItem>
                <SelectItem value="bills">Servicios y Facturas</SelectItem>
                <SelectItem value="entertainment">Entretenimiento</SelectItem>
                <SelectItem value="shopping">Compras</SelectItem>
                <SelectItem value="health">Salud</SelectItem>
                <SelectItem value="other">Otros</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="salary">Salario</SelectItem>
                <SelectItem value="freelance">Freelance</SelectItem>
                <SelectItem value="investment">Inversión</SelectItem>
                <SelectItem value="gift">Regalo</SelectItem>
                <SelectItem value="other">Otros</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Fecha</Label>
        <Input id="date" type="date" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment">Método de Pago</Label>
        <Select>
          <SelectTrigger id="payment">
            <SelectValue placeholder="Selecciona método de pago" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Efectivo</SelectItem>
            <SelectItem value="credit">Tarjeta de Crédito</SelectItem>
            <SelectItem value="debit">Tarjeta de Débito</SelectItem>
            <SelectItem value="bank">Transferencia Bancaria</SelectItem>
            <SelectItem value="digital">Billetera Digital</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">Agregar Transacción</Button>
      </div>
    </form>
  )
}
