"use client"

import { useEffect, useRef, useState } from "react"
import { CheckCircle2, Eye, FileText, Paperclip, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
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
import { useToast } from "@/hooks/use-toast"
import { isApiError } from "@/lib/api/errors"
import {
  getReceiptFile,
  receiptAcceptedTypes,
  receiptFileInputAccept,
  receiptMaxSizeBytes,
  uploadReceipt,
} from "@/lib/api/receipts"

type UploadState = "idle" | "uploading" | "uploaded" | "error"

export interface UploadedReceipt {
  id: string
  file: File
}

export function ReceiptField({
  existingReceiptId = null,
  uploaded = null,
  onChange,
  onRemoveExisting,
  onUploadingChange,
  disabled = false,
}: {
  existingReceiptId?: string | null
  uploaded?: UploadedReceipt | null
  onChange: (receiptId: string | null) => void
  onRemoveExisting?: () => void
  onUploadingChange: (uploading: boolean) => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<AbortController | null>(null)
  const [keepsExisting, setKeepsExisting] = useState(existingReceiptId !== null)
  const [isConfirmingRemoval, setIsConfirmingRemoval] = useState(false)
  const [isOpening, setIsOpening] = useState(false)
  const [file, setFile] = useState<File | null>(uploaded?.file ?? null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(() =>
    uploaded?.file.type.startsWith("image/") ? URL.createObjectURL(uploaded.file) : null,
  )
  const [state, setState] = useState<UploadState>(uploaded ? "uploaded" : "idle")
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => () => uploadRef.current?.abort(), [])

  useEffect(() => {
    if (!previewUrl) {
      return
    }

    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const openExisting = async () => {
    if (!existingReceiptId) {
      return
    }

    // La pestaña se abre antes del await para que el navegador no la bloquee como popup.
    const tab = window.open("", "_blank")
    setIsOpening(true)

    try {
      const blob = await getReceiptFile(existingReceiptId)
      const url = URL.createObjectURL(blob)

      if (tab) {
        tab.location.href = url
      }

      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (openError) {
      tab?.close()
      toast({
        title: "No se pudo abrir el comprobante",
        description: isApiError(openError) ? openError.description : "Intentá de nuevo en unos segundos.",
        variant: "destructive",
      })
    } finally {
      setIsOpening(false)
    }
  }

  const removeExisting = () => {
    setKeepsExisting(false)
    setIsConfirmingRemoval(false)
    onRemoveExisting?.()
  }

  const clear = () => {
    uploadRef.current?.abort()
    setFile(null)
    setPreviewUrl(null)
    setState("idle")
    setError(null)
    onChange(null)
    onUploadingChange(false)

    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const handleSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files

    if (!files || files.length === 0) {
      return
    }

    if (files.length > 1) {
      setState("error")
      setError("Solo se puede subir un archivo.")
      return
    }

    const selected = files[0]

    uploadRef.current?.abort()
    onChange(null)
    setFile(selected)
    setPreviewUrl(selected.type.startsWith("image/") ? URL.createObjectURL(selected) : null)
    setError(null)

    if (!(receiptAcceptedTypes as readonly string[]).includes(selected.type)) {
      setState("error")
      setError("El comprobante tiene que ser una imagen JPG o PNG, o un PDF.")
      return
    }

    if (selected.size > receiptMaxSizeBytes) {
      setState("error")
      setError(`El comprobante no puede superar los ${receiptMaxSizeBytes / (1024 * 1024)} MB.`)
      return
    }

    const controller = new AbortController()
    uploadRef.current = controller
    setState("uploading")
    onUploadingChange(true)

    try {
      const receipt = await uploadReceipt(selected, controller.signal)
      onChange(receipt.id)
      setState("uploaded")
    } catch (uploadError) {
      if (controller.signal.aborted) {
        return
      }

      setState("error")
      setError(isApiError(uploadError) ? uploadError.description : "No pudimos subir el comprobante. Intentá de nuevo.")
    } finally {
      if (!controller.signal.aborted) {
        onUploadingChange(false)
      }
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="receipt">Comprobante (opcional)</Label>
      <input
        ref={inputRef}
        id="receipt"
        type="file"
        accept={receiptFileInputAccept}
        className="hidden"
        onChange={handleSelect}
        disabled={disabled}
      />

      {keepsExisting ? (
        <div className="flex items-center gap-3 rounded-md border border-border/70 p-2">
          <FileText className="size-10 p-1.5 text-muted-foreground" />
          <p className="min-w-0 flex-1 text-sm">Comprobante adjunto</p>
          <Button type="button" variant="ghost" size="sm" onClick={openExisting} disabled={disabled || isOpening}>
            {isOpening ? <Spinner className="size-4" /> : <Eye className="size-4" />}
            Ver
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsConfirmingRemoval(true)}
            disabled={disabled}
            aria-label="Quitar comprobante"
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : !file ? (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          <Paperclip className="size-4" />
          Adjuntar foto o PDF
        </Button>
      ) : (
        <div className="flex items-center gap-3 rounded-md border border-border/70 p-2">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Vista previa del comprobante" className="size-12 rounded object-cover" />
          ) : (
            <FileText className="size-12 p-2 text-muted-foreground" />
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{file.name}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              {state === "uploading" && (
                <>
                  <Spinner className="size-3" />
                  Subiendo…
                </>
              )}
              {state === "uploaded" && (
                <>
                  <CheckCircle2 className="size-3 text-green-600" />
                  Listo
                </>
              )}
            </p>
          </div>

          <Button type="button" variant="ghost" size="icon" onClick={clear} disabled={disabled} aria-label="Quitar comprobante">
            <X className="size-4" />
          </Button>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <AlertDialog open={isConfirmingRemoval} onOpenChange={setIsConfirmingRemoval}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quitar el comprobante?</AlertDialogTitle>
            <AlertDialogDescription>
              Al guardar, este movimiento va a quedar sin su comprobante actual. Después podés adjuntar otro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={removeExisting}>Quitar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
