import { api } from "./client"
import type { PendingTransactionDto } from "./transactions"

export const receiptAcceptedTypes = ["image/jpeg", "image/png", "application/pdf"] as const

export const receiptFileInputAccept = [".jpg", ".jpeg", ".png", ".pdf", ...receiptAcceptedTypes].join(",")

export const receiptMaxSizeBytes = 10 * 1024 * 1024

export const receiptScanMaxSizeBytes = 5 * 1024 * 1024

export const ReceiptScanErrorCodes = {
  Unreadable: "Receipt.Unreadable",
  MissingAmount: "Receipt.MissingAmount",
  UnsupportedForScan: "Receipt.UnsupportedForScan",
  TooLargeToScan: "Receipt.TooLargeToScan",
  ScanUnavailable: "Receipt.ScanUnavailable",
  StorageUnavailable: "Receipt.StorageUnavailable",
  AlreadyScanned: "Receipt.AlreadyScanned",
} as const

export interface TransactionReceiptDto {
  id: string
  transactionId: string | null
  contentType: string
  sizeBytes: number
  fileName: string | null
  uploadedAt: string
}

export function uploadReceipt(file: File, signal?: AbortSignal): Promise<TransactionReceiptDto> {
  const form = new FormData()
  form.append("file", file)

  return api.post<TransactionReceiptDto>("/api/receipts", form, { signal })
}

export function getReceiptFile(id: string, signal?: AbortSignal): Promise<Blob> {
  return api.get<Blob>(`/api/receipts/${encodeURIComponent(id)}/file`, {
    headers: { Accept: "*/*" },
    responseType: "blob",
    signal,
  })
}

export function scanReceipt(id: string, signal?: AbortSignal): Promise<PendingTransactionDto> {
  return api.post<PendingTransactionDto>(`/api/receipts/${encodeURIComponent(id)}/scan`, undefined, { signal })
}
