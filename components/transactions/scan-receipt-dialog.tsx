"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { AlertCircle, Camera, FileText, PenLine, RotateCcw, Sparkles, Upload, Video } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import type { UploadedReceipt } from "@/components/transactions/receipt-field"
import { isApiError } from "@/lib/api/errors"
import { ReceiptScanErrorCodes, scanReceipt, uploadReceipt } from "@/lib/api/receipts"
import type { PendingTransactionDto } from "@/lib/api/transactions"
import { useMessages, type Messages } from "@/lib/i18n"
import {
  ReceiptImageError,
  compressReceiptImage,
  prepareReceiptForScan,
  receiptScanInputAccept,
  type ReceiptImageProblem,
} from "@/lib/receipt-image"

type Step = "select" | "camera" | "preparing" | "ready" | "scanning" | "failed"

interface Failure {
  message: string
  imageKept: boolean
  canRetry: boolean
}

type ScanMessages = Messages["receiptScan"]

function problemMessage(problem: ReceiptImageProblem, t: ScanMessages): string {
  return { unsupported: t.unsupportedFile, heic: t.heicUnsupported, tooLarge: t.tooLarge }[problem]
}

function scanErrorMessage(error: unknown, t: ScanMessages): string {
  if (!isApiError(error)) {
    return t.scanFailed
  }

  const byCode: Record<string, string> = {
    [ReceiptScanErrorCodes.Unreadable]: t.unreadable,
    [ReceiptScanErrorCodes.MissingAmount]: t.missingAmount,
    [ReceiptScanErrorCodes.UnsupportedForScan]: t.unsupportedForScan,
    [ReceiptScanErrorCodes.TooLargeToScan]: t.tooLarge,
    [ReceiptScanErrorCodes.ScanUnavailable]: t.scanUnavailable,
    [ReceiptScanErrorCodes.StorageUnavailable]: t.storageUnavailable,
    [ReceiptScanErrorCodes.AlreadyScanned]: t.alreadyScanned,
  }

  return byCode[error.code] ?? error.description
}

function isTransient(error: unknown): boolean {
  return !isApiError(error) || error.status === 0 || error.status >= 500
}

function captureFrame(video: HTMLVideoElement): Promise<Blob | null> {
  const canvas = document.createElement("canvas")
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext("2d")?.drawImage(video, 0, 0)

  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92))
}

export function ScanReceiptDialog({
  open,
  onOpenChange,
  onProposed,
  onManualEntry,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProposed: (transaction: PendingTransactionDto) => void
  onManualEntry: (receipt: UploadedReceipt | null) => void
}) {
  const messages = useMessages()
  const t = messages.receiptScan
  const inputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const requestRef = useRef<AbortController | null>(null)
  const [step, setStep] = useState<Step>("select")
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [receiptId, setReceiptId] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [selectError, setSelectError] = useState<string | null>(null)
  const [failure, setFailure] = useState<Failure | null>(null)

  useEffect(() => {
    if (!previewUrl) {
      return
    }

    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }

    return () => stream?.getTracks().forEach((track) => track.stop())
  }, [stream])

  useEffect(() => () => requestRef.current?.abort(), [])

  const reset = () => {
    requestRef.current?.abort()
    setStream(null)
    setStep("select")
    setFile(null)
    setPreviewUrl(null)
    setReceiptId(null)
    setSelectError(null)
    setFailure(null)

    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const close = () => {
    reset()
    onOpenChange(false)
  }

  const showFile = (prepared: File) => {
    setFile(prepared)
    setPreviewUrl(prepared.type.startsWith("image/") ? URL.createObjectURL(prepared) : null)
    setReceiptId(null)
    setStep("ready")
  }

  const prepare = async (work: () => Promise<File>) => {
    setSelectError(null)
    setStep("preparing")

    try {
      showFile(await work())
    } catch (error) {
      setSelectError(error instanceof ReceiptImageError ? problemMessage(error.problem, t) : t.unsupportedFile)
      setStep("select")
    }
  }

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0]
    event.target.value = ""

    if (selected) {
      void prepare(() => prepareReceiptForScan(selected))
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const dropped = event.dataTransfer.files?.[0]

    if (dropped) {
      void prepare(() => prepareReceiptForScan(dropped))
    }
  }

  const startCamera = async () => {
    setSelectError(null)

    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      setStream(media)
      setStep("camera")
    } catch {
      setSelectError(t.cameraFailed)
    }
  }

  const stopCamera = () => {
    setStream(null)
    setStep("select")
  }

  const takePhoto = async () => {
    const video = videoRef.current
    if (!video) {
      return
    }

    const frame = await captureFrame(video)
    setStream(null)

    if (!frame) {
      setSelectError(t.unsupportedFile)
      setStep("select")
      return
    }

    await prepare(() => compressReceiptImage(frame, "comprobante.jpg"))
  }

  const scan = async () => {
    if (!file) {
      return
    }

    const controller = new AbortController()
    requestRef.current?.abort()
    requestRef.current = controller
    setFailure(null)
    setStep("scanning")

    let id = receiptId

    if (!id) {
      try {
        id = (await uploadReceipt(file, controller.signal)).id
        setReceiptId(id)
      } catch (error) {
        if (controller.signal.aborted) return
        setFailure({
          message: isApiError(error) ? error.description : t.uploadFailed,
          imageKept: false,
          canRetry: isTransient(error),
        })
        setStep("failed")
        return
      }
    }

    try {
      const proposal = await scanReceipt(id, controller.signal)
      if (controller.signal.aborted) return
      onProposed(proposal)
      close()
    } catch (error) {
      if (controller.signal.aborted) return
      setFailure({ message: scanErrorMessage(error, t), imageKept: true, canRetry: isTransient(error) })
      setStep("failed")
    }
  }

  const enterManually = () => {
    const uploaded = receiptId && file ? { id: receiptId, file } : null
    close()
    onManualEntry(uploaded)
  }

  const chooseAnother = () => {
    reset()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          onOpenChange(true)
        } else if (step !== "scanning") {
          close()
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept={receiptScanInputAccept}
          onChange={handleSelect}
          className="hidden"
        />

        {step === "select" && (
          <div
            className="rounded-lg border-2 border-dashed p-8 text-center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <Camera className="mx-auto mb-4 size-12 text-muted-foreground" aria-hidden="true" />
            <p className="mb-4 text-sm text-muted-foreground">{t.formats}</p>
            <div className="flex flex-col justify-center gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => inputRef.current?.click()}>
                <Upload className="size-4" />
                {t.upload}
              </Button>
              <Button onClick={startCamera}>
                <Video className="size-4" />
                {t.useCamera}
              </Button>
            </div>
            {selectError && <p className="mt-4 text-sm text-destructive">{selectError}</p>}
          </div>
        )}

        {step === "camera" && (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-lg border">
              <video ref={videoRef} autoPlay playsInline muted className="max-h-[400px] w-full object-contain" />
            </div>
            <div className="flex gap-2">
              <Button onClick={takePhoto} className="flex-1">
                <Camera className="size-4" />
                {t.takePhoto}
              </Button>
              <Button variant="outline" onClick={stopCamera} className="flex-1">
                {messages.common.cancel}
              </Button>
            </div>
          </div>
        )}

        {step === "preparing" && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Spinner className="size-4" />
            {t.preparing}
          </div>
        )}

        {(step === "ready" || step === "scanning" || step === "failed") && file && (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-lg border">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt={t.previewAlt}
                  width={800}
                  height={600}
                  className="max-h-[300px] w-full bg-muted/30 object-contain"
                />
              ) : (
                <p className="flex items-center gap-2 p-4 text-sm">
                  <FileText className="size-5 text-muted-foreground" aria-hidden="true" />
                  {t.pdfSelected(file.name)}
                </p>
              )}
            </div>

            {step === "ready" && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={scan} className="flex-1">
                  <Sparkles className="size-4" />
                  {t.scan}
                </Button>
                <Button variant="outline" onClick={chooseAnother}>
                  {t.otherImage}
                </Button>
              </div>
            )}

            {step === "scanning" && (
              <Alert>
                <Sparkles className="size-4 animate-pulse" />
                <AlertDescription>{t.scanning}</AlertDescription>
              </Alert>
            )}

            {step === "failed" && failure && (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertTitle>{t.failedTitle}</AlertTitle>
                  <AlertDescription>
                    <p>{failure.message}</p>
                    {failure.imageKept && <p>{t.imageKept}</p>}
                  </AlertDescription>
                </Alert>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button onClick={enterManually} className="flex-1">
                    <PenLine className="size-4" />
                    {t.manualEntry}
                  </Button>
                  {failure.canRetry && (
                    <Button variant="outline" onClick={scan}>
                      <RotateCcw className="size-4" />
                      {t.retry}
                    </Button>
                  )}
                  <Button variant="outline" onClick={chooseAnother}>
                    {t.otherImage}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
